const prisma = require('../utils/prisma');
const axios = require('axios');

// Seeded Random Helper (Mulberry32)
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
function stringToSeed(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

const createDrug = async (req, res) => {
    try {
        const { name, description, manufacturer, image } = req.body;
        const drug = await prisma.drug.create({
            data: { name, description, manufacturer, image }
        });
        res.status(201).json(drug);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not create drug' });
    }
};

const getDrugs = async (req, res) => {
    try {
        const { search, category } = req.query;
        let where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (category && category !== "ALL") {
            where.category = { equals: category, mode: 'insensitive' };
        }
        const drugs = await prisma.drug.findMany({ where, take: 50 });

        // Ensure every drug has an image
        const enrichedDrugs = drugs.map(d => ({
            ...d,
            image: d.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop'
        }));

        res.json(enrichedDrugs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch drugs' });
    }
};

const getSuggestions = async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) return res.json([]);

        // Parallel search for Drugs and Pharmacies
        const [drugs, pharmacies] = await Promise.all([
            prisma.drug.findMany({
                where: { name: { contains: search, mode: 'insensitive' } },
                take: 5,
                select: { id: true, name: true, image: true }
            }),
            prisma.pharmacy.findMany({
                where: { name: { contains: search, mode: 'insensitive' } },
                take: 3,
                select: { id: true, name: true, image: true }
            })
        ]);

        const suggestions = [
            ...drugs.map(d => ({ ...d, type: 'drug' })),
            ...pharmacies.map(p => ({ ...p, type: 'pharmacy' }))
        ];

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Suggestions failed' });
    }
};

// Add drug to pharmacy inventory with price
const addDrugToPharmacy = async (req, res) => {
    try {
        const { drugId, price, inStock } = req.body;
        const userId = req.user.userId;

        // Find pharmacy owned by user
        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId }
        });

        if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });

        const pharmacyDrug = await prisma.pharmacyDrug.upsert({
            where: {
                pharmacyId_drugId: {
                    pharmacyId: pharmacy.id,
                    drugId: drugId
                }
            },
            update: {
                price: parseFloat(price),
                inStock: inStock
            },
            create: {
                pharmacyId: pharmacy.id,
                drugId: drugId,
                price: parseFloat(price),
                inStock: inStock !== undefined ? inStock : true
            }
        });

        res.json(pharmacyDrug);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not add drug to pharmacy' });
    }
};


const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const searchDrugsWithPricing = async (req, res) => {
    try {
        const { query, lat, lng } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const drugs = await prisma.drug.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            include: {
                pharmacies: {
                    where: { inStock: true },
                    include: { pharmacy: true }
                }
            }
        });

        const results = [];

        drugs.forEach(drug => {
            drug.pharmacies.forEach(pd => {
                let distance = null;
                if (lat && lng) {
                    distance = getDistance(parseFloat(lat), parseFloat(lng), pd.pharmacy.latitude, pd.pharmacy.longitude);
                }

                results.push({
                    drugName: drug.name,
                    drugId: drug.id,
                    drugDescription: drug.description,
                    drugImage: drug.image,
                    pharmacyName: pd.pharmacy.name,
                    pharmacyAddress: pd.pharmacy.address,
                    pharmacyId: pd.pharmacy.id,
                    price: parseFloat(pd.price),
                    distance: distance
                });
            });
        });

        results.sort((a, b) => a.price - b.price);

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
};

// Update inventory item (price/stock)
const updateInventory = async (req, res) => {
    try {
        const { drugId } = req.params;
        const { price, inStock } = req.body;
        const userId = req.user.userId;

        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId }
        });

        if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });

        const pharmacyDrug = await prisma.pharmacyDrug.update({
            where: {
                pharmacyId_drugId: {
                    pharmacyId: pharmacy.id,
                    drugId: drugId
                }
            },
            data: {
                price: price !== undefined ? parseFloat(price) : undefined,
                inStock: inStock !== undefined ? inStock : undefined
            }
        });

        res.json(pharmacyDrug);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }
        res.status(500).json({ error: 'Could not update inventory' });
    }
};

// Price Comparison with Haversine Formula & Weighted Scoring AND OSM Integration
const comparePrices = async (req, res) => {
    try {
        const { search, category, lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        let searchQuery = search ? `%${search}%` : '%';
        const categoryFilter = category && category !== 'ALL' ? category : null;

        // 0. PRE-SEARCH: Identify target drug to normalize search query
        console.log(`[DEBUG] Search Request: query="${search}", lat=${lat}, lng=${lng}`);
        let targetDrugs = [];
        let foundDrug = null;

        if (search) {
            // First try strict match
            foundDrug = await prisma.drug.findFirst({
                where: { name: { contains: search, mode: 'insensitive' } }
            });

            // If no match, try searching with the first word (e.g. "Paracetamol 500mg" -> "Paracetamol")
            if (!foundDrug) {
                const firstWord = search.split(' ')[0];
                if (firstWord.length > 2) {
                    foundDrug = await prisma.drug.findFirst({
                        where: { name: { contains: firstWord, mode: 'insensitive' } }
                    });
                }
            }

            if (foundDrug) {
                targetDrugs.push(foundDrug);
                // OVERRIDE searchQuery to potentially catch more pharmacies
                searchQuery = `%${foundDrug.name}%`;
            }
        } else if (category && category !== 'ALL') {
            targetDrugs = await prisma.drug.findMany({
                where: { category: { equals: category, mode: 'insensitive' } },
                take: 3
            });
        }

        // Smart Scoring Multipliers
        const distanceMultiplier = 100; // 1km ~ 100 Naira impact
        const ratingMultiplier = 50;   // 1 star ~ 50 Naira impact

        // 1. Fetch Real DB Results (Partners)
        const dbResults = await prisma.$queryRaw`
            SELECT 
                d.name AS "drugName",
                d.id AS "drugId",
                d.manufacturer,
                d.description,
                d.image,
                d.category,
                d."avgPrice" as "marketAvg",
                p.name AS "pharmacyName",
                p.address AS "pharmacyAddress",
                p.id AS "pharmacyId",
                p.rating,
                p."ratingCount",
                p.image as "pharmacyImage",
                pd.price,
                pd."inStock",
                (6371 * acos(
                    cos(radians(${userLat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${userLng})) + 
                    sin(radians(${userLat})) * sin(radians(p.latitude))
                )) AS "distanceKm",
                (pd.price * 0.5) + 
                ((6371 * acos(
                    cos(radians(${userLat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${userLng})) + 
                    sin(radians(${userLat})) * sin(radians(p.latitude))
                )) * ${distanceMultiplier} * 0.3) - 
                (COALESCE(p.rating, 0) * ${ratingMultiplier} * 0.2) as "score"
            FROM "PharmacyDrug" pd
            JOIN "Drug" d ON pd."drugId" = d.id
            JOIN "Pharmacy" p ON pd."pharmacyId" = p.id
            WHERE (d.name ILIKE ${searchQuery} OR p.name ILIKE ${searchQuery} OR ${search ? false : true})
              AND (LOWER(d.category) = LOWER(${categoryFilter}) OR ${categoryFilter === null})
              AND pd."inStock" = true
              AND p."applicationStatus" = 'APPROVED'
            ORDER BY "score" ASC
            LIMIT 50
        `;

        console.log(`[DEBUG] Partner DB Results: ${dbResults.length}`);
        console.log(`[DEBUG] targetDrugs for OSM: ${targetDrugs.length}`);

        let formatted = dbResults.map(r => {
            const price = parseFloat(r.price);
            const marketAvg = r.marketAvg ? parseFloat(r.marketAvg) : price;
            const savingsAmount = marketAvg > price ? marketAvg - price : 0;
            const savingsPercentage = marketAvg > 0 ? (savingsAmount / marketAvg) * 100 : 0;

            return {
                ...r,
                price,
                marketAvg,
                savingsAmount,
                savingsPercentage: Math.round(savingsPercentage),
                distanceKm: parseFloat(r.distanceKm),
                rating: parseFloat(r.rating),
                score: parseFloat(r.score),
                isPartner: true
            };
        });

        // 2. Fetch OSM Results (Non-Partners)
        // Only do this if we are searching for a specific drug, so we can assign it to them
        // 2. Fetch OSM Results (Non-Partners)
        // Only do this if we are searching for a specific drug, so we can assign it to them
        let osmResults = [];

        // targetDrugs is already populated from Step 0 above

        if (targetDrugs.length > 0) {


            try {
                const overpassQuery = `
                    [out:json][timeout:25];
                    (
                      node["amenity"="pharmacy"](around:50000,${userLat},${userLng});
                      way["amenity"="pharmacy"](around:50000,${userLat},${userLng});
                      node["amenity"="hospital"](around:50000,${userLat},${userLng});
                      node["amenity"="clinic"](around:50000,${userLat},${userLng});
                    );
                    out center;
                `;

                const osmResponse = await axios.get('https://overpass-api.de/api/interpreter', {
                    params: { data: overpassQuery },
                    headers: { 'User-Agent': 'MediFind/1.0' }
                });

                if (osmResponse.data && osmResponse.data.elements) {
                    const elements = osmResponse.data.elements;

                    // Filter out duplicate partner pharmacies (basic name check)
                    const partnerNames = new Set(dbResults.map(p => p.pharmacyName.toLowerCase()));
                    const seenNames = new Set();

                    const uniqueOsmPharmacies = elements.filter(el => {
                        if (!el.tags || !el.tags.name) return false;
                        const nameLower = el.tags.name.toLowerCase();

                        // We now ALLOW hospitals and clinics as fallback
                        // const blocked = ['veterinary']; 
                        // if (blocked.some(b => nameLower.includes(b))) return false;

                        if (partnerNames.has(nameLower) || seenNames.has(nameLower)) {
                            return false;
                        }
                        seenNames.add(nameLower);
                        return true;
                    });

                    // SEEDING: If we have too few results, generate synthetic ones to meet "30 seed" request
                    if (uniqueOsmPharmacies.length < 30) {
                        const syntheticNames = [
                            "HealthPlus Pharmacy", "Medplus Pharmacy", "Juli Pharmacy", "Alpha Pharmacy",
                            "Vanguard Pharmacy", "City Chemist", "Life Stores", "Pinnacle Health",
                            "RX Care", "Nett Pharmacy", "E-Clinic Dispensary", "Lagos Island Chemist",
                            "Mainland Pharmacy", "Ikeja Medicals", "Victoria Island Meds", "Lekki Health",
                            "Surulere Chemist", "Yaba Pharmacy", "Gbagada Health", "Oshodi Meds",
                            "Ajao Estate Pharmacy", "Mushin Medicals", "Apapa Health", "Festac Pharmacy",
                            "Badagry Chemist", "Ikorodu Meds", "Epe Health", "Agege Pharmacy", "Ojo Meds", "Alimosho Care"
                        ];

                        let seedIdx = 0;
                        while (uniqueOsmPharmacies.length < 30 && seedIdx < syntheticNames.length) {
                            const name = syntheticNames[seedIdx++];
                            if (!seenNames.has(name.toLowerCase()) && !partnerNames.has(name.toLowerCase())) {
                                // Seed = SessionID + PharmacyName
                                const sessionId = req.headers['x-session-id'] || 'default';
                                const seedStr = sessionId + name;
                                const rng = mulberry32(stringToSeed(seedStr));

                                uniqueOsmPharmacies.push({
                                    tags: { name: name, 'addr:street': 'Simulated Address' },
                                    lat: userLat + (rng() * 0.1 - 0.05), // Seeded Random nearby location
                                    lon: userLng + (rng() * 0.1 - 0.05),
                                    id: 999000 + seedIdx,
                                    isSynthetic: true
                                });
                                seenNames.add(name.toLowerCase());
                            }
                        }
                    }


                    // Randomize assignment to target drugs (Seeded)
                    targetDrugs.forEach(targetDrug => {
                        const sessionId = req.headers['x-session-id'] || 'default';
                        // Seed specific to this drug and session
                        const drugSeed = stringToSeed(sessionId + targetDrug.id);
                        const rng = mulberry32(drugSeed);

                        // Shuffle pharmacies consistently
                        const shuffled = [...uniqueOsmPharmacies].sort(() => 0.5 - rng());

                        // Pick random count (using rng)
                        const count = targetDrugs.length === 1 ? Math.floor(rng() * 6) + 5 : Math.floor(rng() * 4) + 2;
                        const selectedPharmacies = shuffled.slice(0, count);

                        selectedPharmacies.forEach(el => {
                            const basePrice = parseFloat(targetDrug.avgPrice || 1000);
                            const randomFactor = 0.85 + (rng() * 0.3); // Seeded price
                            const price = Math.round(basePrice * randomFactor);

                            // Calculate distance
                            // For nodes: lat/lon. For ways/relations: center.lat/center.lon (from out center)
                            const pLat = el.lat || el.center?.lat;
                            const pLng = el.lon || el.center?.lon;

                            const distanceKm = (pLat && pLng) ? getDistance(userLat, userLng, pLat, pLng) : 5.0;

                            const marketAvg = parseFloat(targetDrug.avgPrice || price * 1.1);
                            const savingsAmount = marketAvg > price ? marketAvg - price : 0;
                            const savingsPercentage = marketAvg > 0 ? (savingsAmount / marketAvg) * 100 : 0;

                            const rating = 4.0; // OSM doesn't have ratings usually
                            const score = (price * 0.5) + (distanceKm * distanceMultiplier * 0.3) - (rating * ratingMultiplier * 0.2);

                            const address = el.tags['addr:street']
                                ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}, ${el.tags['addr:city'] || ''}`
                                : (el.tags['addr:full'] || 'Address unavailable');

                            osmResults.push({
                                drugName: targetDrug.name,
                                drugId: targetDrug.id,
                                manufacturer: targetDrug.manufacturer,
                                description: targetDrug.description,
                                image: targetDrug.image,
                                category: targetDrug.category,
                                marketAvg: marketAvg,
                                pharmacyName: el.tags.name,
                                pharmacyAddress: address,
                                pharmacyId: `osm_${el.id}`,
                                rating: rating,
                                ratingCount: 0,
                                pharmacyImage: null,
                                price: price,
                                inStock: true,
                                distanceKm: distanceKm,
                                score: score,
                                savingsAmount: savingsAmount,
                                savingsPercentage: Math.round(savingsPercentage),
                                isPartner: false,
                                isEstimate: true
                            });
                        });
                    });
                } else {
                    console.warn('OSM returned no elements');
                }
            } catch (osmError) {
                console.warn('OSM Fetch failed:', osmError.message);
            }
        }


        // 3. Merge and Sort
        const allResults = [...formatted, ...osmResults].sort((a, b) => a.score - b.score);

        res.json(allResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Comparison failed' });
    }
};

const deleteInventory = async (req, res) => {
    try {
        const { drugId } = req.params;
        const userId = req.user.userId;

        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId }
        });

        if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });

        await prisma.pharmacyDrug.delete({
            where: {
                pharmacyId_drugId: {
                    pharmacyId: pharmacy.id,
                    drugId: drugId
                }
            }
        });

        res.json({ message: 'Item removed from inventory' });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }
        res.status(500).json({ error: 'Could not remove item' });
    }
};

// Update a drug in the master catalog
const updateDrug = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, manufacturer, image, category, dosageForm, strength, requiresPrescription } = req.body;

        const drug = await prisma.drug.update({
            where: { id },
            data: {
                name,
                description,
                manufacturer,
                image,
                category,
                dosageForm,
                strength,
                requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true
            }
        });

        res.json(drug);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Drug not found' });
        }
        res.status(500).json({ error: 'Could not update drug' });
    }
};

// Delete a drug from the master catalog
const deleteDrug = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if drug is used in any pharmacy inventory or orders
        const usageCount = await prisma.pharmacyDrug.count({ where: { drugId: id } });
        const orderCount = await prisma.orderItem.count({ where: { drugId: id } });

        if (usageCount > 0 || orderCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete drug. It is currently in use by pharmacies or part of existing orders.'
            });
        }

        await prisma.drug.delete({
            where: { id }
        });

        res.json({ message: 'Drug deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not delete drug' });
    }
};

module.exports = { createDrug, getDrugs, getSuggestions, addDrugToPharmacy, updateInventory, deleteInventory, searchDrugsWithPricing, comparePrices, updateDrug, deleteDrug };
