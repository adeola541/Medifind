const prisma = require('../utils/prisma');

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

const validateCart = async (req, res) => {
    try {
        const { items, lat, lng } = req.body;
        // items: [{ drugName, pharmacyId, quantity, price }]
        // We rely on pharmacyId and drugName (or drugId if available, but frontend currently sends drugName)
        // Ideally we should have drugId. The frontend store accepts drugName. 
        // Let's assume frontend sends what it has. Validating by Name + PharmacyId is okay if names are unique enough or we look up by name.

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }

        const changes = [];
        let newTotal = 0;
        let valid = true;
        let deliveryFee = 0;

        // Group items by pharmacy to calculate delivery fee per pharmacy or just one global?
        // Usually delivery is per order/shipment. If items are from multiple pharmacies, we might have multiple delivery fees.
        // For simple MVP: Medifind might aggregating? Or just sum of distances.
        // Let's assume items are from one pharmacy for now, or sum up fees.
        // Or simplified: specific fee per pharmacy.

        const pharmacyFees = {};

        for (const item of items) {
            // Find the specific pharmacy-drug entry
            // If we have drugId, great. If not, find drug by name first.
            let drugId = item.drugId;

            if (!drugId && item.drugName) {
                const drug = await prisma.drug.findFirst({
                    where: { name: { equals: item.drugName, mode: 'insensitive' } }
                });
                if (drug) drugId = drug.id;
            }

            if (!drugId) {
                changes.push({
                    itemId: item.id || item.drugName,
                    type: 'ERROR',
                    message: `Drug '${item.drugName}' not found.`
                });
                valid = false;
                continue;
            }

            let pharmacyDrug = await prisma.pharmacyDrug.findUnique({
                where: {
                    pharmacyId_drugId: {
                        pharmacyId: item.pharmacyId,
                        drugId: drugId
                    }
                },
                include: {
                    pharmacy: true
                }
            });

            let isSimulated = false;
            let pharmacyLocation = null;

            if (!pharmacyDrug) {
                // FALLBACK FOR SIMULATION
                // Check if Pharmacy exists
                const pharmacy = await prisma.pharmacy.findUnique({ where: { id: item.pharmacyId } });

                pharmacyDrug = {
                    price: item.price,
                    inStock: true,
                    pharmacy: pharmacy || { latitude: 6.5, longitude: 3.3 } // Dummy location
                };
                isSimulated = true;

                if (pharmacy) {
                    pharmacyLocation = { lat: pharmacy.latitude, lng: pharmacy.longitude };
                }
            } else {
                pharmacyLocation = { lat: pharmacyDrug.pharmacy.latitude, lng: pharmacyDrug.pharmacy.longitude };
            }

            if (!pharmacyDrug.inStock) {
                changes.push({
                    itemId: item.id || item.drugName,
                    type: 'OUT_OF_STOCK',
                    message: `Item is out of stock.`
                });
                valid = false;
                continue;
            }

            // Check Price
            const currentPrice = parseFloat(pharmacyDrug.price);
            if (!isSimulated && Math.abs(currentPrice - item.price) > 5) { // Allow tiny diff
                changes.push({
                    itemId: item.id || item.drugName,
                    type: 'PRICE_CHANGE',
                    message: `Price changed from ₦${item.price} to ₦${currentPrice}`,
                    newPrice: currentPrice
                });
                // We still count it as valid for calculations? 
                // Usually we ask user to confirm. So valid = false to block auto checkout.
                valid = false;
            }

            newTotal += currentPrice * item.quantity;

            // Delivery Fee Calculation (once per pharmacy)
            if (!pharmacyFees[item.pharmacyId]) {
                if (lat && lng && pharmacyLocation) {
                    const distance = getDistance(parseFloat(lat), parseFloat(lng), pharmacyLocation.lat, pharmacyLocation.lng);
                    const fee = 500 + (distance * 100);
                    pharmacyFees[item.pharmacyId] = Math.round(fee);
                } else {
                    pharmacyFees[item.pharmacyId] = 1000;
                }
            }
        }

        deliveryFee = Object.values(pharmacyFees).reduce((sum, fee) => sum + fee, 0);

        // If no location, default delivery fee or 0?
        if (deliveryFee === 0 && (!lat || !lng)) {
            deliveryFee = 1000; // Flat rate fallback
        }

        res.json({
            valid,
            changes,
            newTotal,
            deliveryFee,
            grandTotal: newTotal + deliveryFee
        });

    } catch (error) {
        console.error('Cart validation error:', error);
        res.status(500).json({ error: 'Cart validation failed' });
    }
};

module.exports = { validateCart };
