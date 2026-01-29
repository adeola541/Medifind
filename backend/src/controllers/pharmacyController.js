const prisma = require('../utils/prisma');
const axios = require('axios');

const { fetchPlaces, fetchPlaceTips } = require('../services/foursquareService');

const createPharmacy = async (req, res) => {
    try {
        const { name, address, latitude, longitude, phone, email } = req.body;
        const userId = req.user.userId;

        // Check if user already owns a pharmacy (optional, usually one per admin)
        // For now allow multiple or check existing
        const existing = await prisma.pharmacy.findUnique({ where: { ownerId: userId } });
        if (existing) {
            return res.status(400).json({ error: 'User already owns a pharmacy' });
        }

        const pharmacy = await prisma.pharmacy.create({
            data: {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                phone,
                email,
                ownerId: userId,
            },
        });

        res.status(201).json(pharmacy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not create pharmacy' });
    }
};

const getMyPharmacy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId },
            include: { drugs: { include: { drug: true } } }
        });
        if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
        res.json(pharmacy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

const searchNearby = async (req, res) => {
    try {
        const { lat, lng, radius = 10, hospitalId, osm_ids, place_ids, foursquare_ids } = req.query; // radius in km

        // Data Enrichment Logic: If osm_ids, place_ids, or foursquare_ids are provided
        if (osm_ids || place_ids || foursquare_ids) {
            const idList = osm_ids
                ? (Array.isArray(osm_ids) ? osm_ids : osm_ids.split(','))
                : [];
            const placeIdList = place_ids
                ? (Array.isArray(place_ids) ? place_ids : place_ids.split(','))
                : [];
            const foursquareIdList = foursquare_ids
                ? (Array.isArray(foursquare_ids) ? foursquare_ids : foursquare_ids.split(','))
                : [];

            const pharmacies = await prisma.pharmacy.findMany({
                where: {
                    OR: [
                        { osm_id: { in: idList } },
                        { google_place_id: { in: placeIdList } },
                        { foursquare_id: { in: foursquareIdList } }
                    ],
                    applicationStatus: 'APPROVED'
                },
                include: {
                    drugs: {
                        include: { drug: true }
                    }
                }
            });
            return res.json(pharmacies);
        }

        let latitude = parseFloat(lat);
        let longitude = parseFloat(lng);

        // Hospital-First Logic: If hospitalId is provided, center search on Hospital
        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({
                where: { id: hospitalId }
            });
            if (hospital) {
                latitude = hospital.latitude;
                longitude = hospital.longitude;
            } else {
                return res.status(404).json({ error: 'Hospital not found' });
            }
        }

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and Longitude, hospitalId, or osm_ids required' });
        }

        // Use Prisma queryRaw for Haversine formula with Expanding Search
        // Step 1: Try requested radius
        let searchRadius = parseFloat(radius);
        let pharmacies = await findPharmacies(latitude, longitude, searchRadius);

        // Step 2: If < 3 results, expand radius (up to 500km limit)
        if (pharmacies.length < 3) {
            const steps = [25, 50, 100, 200, 350, 500]; // Expansion steps in km
            for (const step of steps) {
                if (step <= searchRadius) continue; // Skip if already smaller

                // console.log(`Expanding search radius to ${step}km...`);
                pharmacies = await findPharmacies(latitude, longitude, step);

                if (pharmacies.length >= 3) break; // Stop if we found enough
            }
        }

        res.json(pharmacies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
};

// Helper function for spatial query
async function findPharmacies(latitude, longitude, radius) {
    const results = await prisma.$queryRaw`
        SELECT id, name, address, latitude, longitude, phone, email, "hospitalId", "osm_id",
        ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) * sin( radians( latitude ) ) ) ) AS distance
        FROM "Pharmacy"
        WHERE ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) * sin( radians( latitude ) ) ) ) < ${parseFloat(radius)}
        AND "applicationStatus" = 'APPROVED'
        ORDER BY distance ASC;
    `;
    return results;
}



const getAllPharmacies = async (req, res) => {
    try {
        const pharmacies = await prisma.pharmacy.findMany({
            include: { owner: { select: { name: true, email: true } } }
        });
        res.json(pharmacies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch pharmacies' });
    }
};

const verifyPharmacy = async (req, res) => {
    try {
        const { pharmacyId } = req.params;
        const { isApproved, status } = req.body;

        let newStatus = status;
        let newIsApproved = isApproved;

        // If status is provided, sync isApproved
        if (newStatus) {
            newIsApproved = (newStatus === 'APPROVED');
        }
        // If legacy isApproved is provided, map to Status
        else if (isApproved !== undefined) {
            newStatus = isApproved ? 'APPROVED' : 'REJECTED';
            newIsApproved = isApproved;
        }

        const pharmacy = await prisma.pharmacy.update({
            where: { id: pharmacyId },
            data: {
                isApproved: newIsApproved,
                // Only update status if we determined a new one
                ...(newStatus && { applicationStatus: newStatus })
            }
        });

        res.json(pharmacy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not verify pharmacy' });
    }
};

const updateMyPharmacy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, address, phone, email, latitude, longitude } = req.body;

        const pharmacy = await prisma.pharmacy.update({
            where: { ownerId: userId },
            data: {
                name,
                address,
                phone,
                email,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
            }
        });

        res.json(pharmacy);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Pharmacy not found' });
        }
        res.status(500).json({ error: 'Could not update pharmacy' });
    }
};

const getPharmacyStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId }
        });

        if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // 1. Today's Orders
        const todaysOrdersCount = await prisma.order.count({
            where: {
                pharmacyId: pharmacy.id,
                createdAt: {
                    gte: startOfDay
                }
            }
        });

        // 2. Revenue (Today) - Sum totalAmount of orders today
        const todaysRevenueAgg = await prisma.order.aggregate({
            where: {
                pharmacyId: pharmacy.id,
                createdAt: {
                    gte: startOfDay
                },
                // Optional: Only count completed/paid orders? For now, all orders.
                // status: { not: 'CANCELLED' } 
            },
            _sum: {
                totalAmount: true
            }
        });
        const todaysRevenue = todaysRevenueAgg._sum.totalAmount || 0;

        // 3. Low Stock Items (Currently we only have boolean inStock, so we count unavailable items)
        const lowStockCount = await prisma.pharmacyDrug.count({
            where: {
                pharmacyId: pharmacy.id,
                inStock: false
            }
        });

        // 4. Total Products
        const totalProductsCount = await prisma.pharmacyDrug.count({
            where: {
                pharmacyId: pharmacy.id
            }
        });

        // 5. Recent Orders
        const recentOrders = await prisma.order.findMany({
            where: { pharmacyId: pharmacy.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                items: true // to count items
            }
        });

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.id,
            customerName: order.user.name,
            customerInitials: order.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            itemCount: order.items.length,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.json({
            todaysOrders: todaysOrdersCount,
            todaysRevenue: todaysRevenue,
            lowStock: lowStockCount,
            totalProducts: totalProductsCount,
            recentOrders: formattedRecentOrders
        });

    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ error: 'Could not fetch dashboard stats' });
    }
};

const deletePharmacy = async (req, res) => {
    try {
        let targetPharmacyId = req.params.pharmacyId;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        // 1. Get Pharmacy to find Owner
        // If no ID provided (Self-Delete via /me), find by ownerId
        let pharmacy;
        if (!targetPharmacyId) {
            pharmacy = await prisma.pharmacy.findUnique({
                where: { ownerId: requesterId }
            });
        } else {
            pharmacy = await prisma.pharmacy.findUnique({
                where: { id: targetPharmacyId }
            });
        }

        if (!pharmacy) {
            return res.status(404).json({ error: 'Pharmacy not found' });
        }

        // 2. Authorization Check
        // Allow if Super Admin OR if the requester is the owner
        if (requesterRole !== 'SUPER_ADMIN' && pharmacy.ownerId !== requesterId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 3. Delete the Owner User (Cascades to Pharmacy -> Orders/Drugs)
        // CHECK FOR PENDING ORDERS FIRST
        const pendingOrders = await prisma.order.count({
            where: {
                pharmacyId: pharmacy.id,
                status: 'PENDING' // or CONFIRMED?
            }
        });

        if (pendingOrders > 0) {
            return res.status(400).json({
                error: `Cannot delete pharmacy. There are ${pendingOrders} pending orders that must be resolved first.`
            });
        }

        await prisma.user.delete({
            where: { id: pharmacy.ownerId }
        });

        res.json({ message: 'Pharmacy account deleted successfully' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Could not delete pharmacy', details: error.message, code: error.code });
    }
};

const requestDeletion = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user.userId;

        await prisma.pharmacy.update({
            where: { ownerId: userId },
            data: {
                applicationStatus: 'DELETION_REQUESTED',
                deletionReason: reason
            }
        });

        res.json({ message: 'Deletion request submitted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not submit deletion request' });
    }
};

const discoverNearby = async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and Longitude required' });
    }

    // CACHE IMPLEMENTATION
    // Key: Round coords to 3 decimals (~100m precision) to group nearby users
    const cacheKey = `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
    const now = Date.now();
    const TTL = 3600 * 1000; // 1 Hour Cache

    if (global.pharmacyCache && global.pharmacyCache.has(cacheKey)) {
        const cached = global.pharmacyCache.get(cacheKey);
        if (now - cached.timestamp < TTL) {
            console.log('Serving from cache:', cacheKey);
            return res.json(cached.data);
        }
    }

    let results = [];
    const seenNames = new Set();
    // 1. Try Foursquare Places API
    try {
        console.log('Attempting Foursquare discovery...');
        const fsqResults = await fetchPlaces(lat, lng);

        if (fsqResults && fsqResults.length > 0) {
            fsqResults.forEach(item => {
                const nameLower = item.name.toLowerCase();
                const nameNormalized = nameLower.replace(/[^a-z0-9]/g, '');

                // Filter Generic Names
                if (['pharmacy', 'chemist', 'drug store', 'medicine store'].includes(nameLower)) return;

                if (seenNames.has(nameNormalized)) return;
                seenNames.add(nameNormalized);

                // Use Foursquare image if available, otherwise null
                const finalImage = item.image || null;

                results.push({
                    fsq_id: item.id,
                    name: item.name,
                    address: item.address,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    rating: item.rating || 4.5,
                    user_ratings_total: item.user_ratings_total || 0,
                    types: ['Pharmacy'],
                    distance: item.distance,
                    image: finalImage
                });
            });
        }
    } catch (fsqError) {
        console.warn('Foursquare failed, falling back to OSM:', fsqError.message);
    }

    // 2. Fallback to OSM if Geoapify returned nothing/failed
    if (results.length === 0) {
        try {
            // OpenStreetMap (Overpass API)
            const overpassQuery = `
                [out:json][timeout:45];
                (
                  node["amenity"="pharmacy"](around:25000,${lat},${lng});
                  node["amenity"="hospital"](around:25000,${lat},${lng});
                  node["amenity"="clinic"](around:25000,${lat},${lng});
                  node["healthcare"="laboratory"](around:25000,${lat},${lng});
                  way["amenity"="pharmacy"](around:25000,${lat},${lng});
                  way["amenity"="hospital"](around:25000,${lat},${lng});
                  relation["amenity"="pharmacy"](around:25000,${lat},${lng});
                );
                out body;
                >;
                out skel qt;
            `;

            let response;
            try {
                response = await axios.get('https://overpass-api.de/api/interpreter', {
                    params: { data: overpassQuery },
                    headers: { 'User-Agent': 'MediFind/1.0' },
                    timeout: 45000
                });
            } catch (e) {
                console.warn('Primary OSM server failed, trying mirror...', e.message);
                response = await axios.get('https://overpass.kumi.systems/api/interpreter', {
                    params: { data: overpassQuery },
                    headers: { 'User-Agent': 'MediFind/1.0' },
                    timeout: 45000
                });
            }

            const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
                const R = 6371;
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            if (response && response.data && response.data.elements) {
                response.data.elements.forEach(item => {
                    if (!item.tags || !item.tags.name) return;

                    const nameLower = item.tags.name.toLowerCase();
                    const nameNormalized = nameLower.replace(/[^a-z0-9]/g, '');

                    // Filter Generic Names (Low quality data)
                    if (['pharmacy', 'chemist', 'drug store', 'medicine store'].includes(nameLower)) return;

                    // Removed Blocklist for Hospitals/Clinics/Labs


                    if (seenNames.has(nameNormalized)) return;
                    seenNames.add(nameNormalized);

                    const distance = getDistanceFromLatLonInKm(lat, lng, item.lat, item.lon);
                    // No images for OSM, set to null for connection to default icon
                    const image = null;

                    results.push({
                        fsq_id: `osm_${item.id}`,
                        name: item.tags.name,
                        address: item.tags['addr:street'] ? `${item.tags['addr:street']}, ${item.tags['addr:city'] || ''}` : 'Address unavailable',
                        latitude: item.lat,
                        longitude: item.lon,
                        rating: 4.0,
                        user_ratings_total: 0,
                        types: ['Pharmacy'],
                        distance: distance,
                        image: image
                    });
                });
            }
        } catch (error) {
            console.error('OSM Proxy Error:', error.message);
            // Don't return error here, just return empty list or partial results from geoapify? 
            // well if results is empty, we return empty.
        }
    }

    results.sort((a, b) => a.distance - b.distance);

    // Save to Cache
    if (!global.pharmacyCache) global.pharmacyCache = new Map();
    global.pharmacyCache.set(cacheKey, {
        timestamp: Date.now(),
        data: results.slice(0, 50)
    });

    res.json(results.slice(0, 50));
};
const getPharmacyById = async (req, res) => {
    try {
        const { id } = req.params;
        const pharmacy = await prisma.pharmacy.findFirst({
            where: {
                OR: [
                    { id: id },
                    { foursquare_id: id },
                    { osm_id: id }
                ]
            },
            include: {
                drugs: {
                    include: { drug: true }
                },
                hospital: true
            }
        });

        if (!pharmacy) {
            return res.status(404).json({ error: 'Pharmacy not found in our partners database' });
        }

        res.json(pharmacy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPharmacyReviews = async (req, res) => {
    try {
        const { id } = req.params;

        let targetId = id;

        // If it's a local UUID, we need to find the foursquare_id first
        if (id.length > 20 && id.includes('-')) {
            const pharmacy = await prisma.pharmacy.findUnique({
                where: { id },
                select: { foursquare_id: true }
            });
            if (pharmacy && pharmacy.foursquare_id) {
                targetId = pharmacy.foursquare_id;
            }
        }

        const tips = await fetchPlaceTips(targetId);
        res.json(tips);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

module.exports = { createPharmacy, getMyPharmacy, updateMyPharmacy, searchNearby, getAllPharmacies, verifyPharmacy, getPharmacyStats, deletePharmacy, requestDeletion, discoverNearby, getPharmacyById, getPharmacyReviews };
