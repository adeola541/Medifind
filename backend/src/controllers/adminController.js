const prisma = require('../utils/prisma');

const getSystemStats = async (req, res) => {
    try {
        // 1. Total Users
        const totalUsers = await prisma.user.count();

        // 2. Pharmacies Stats
        const totalPharmacies = await prisma.pharmacy.count();
        const pendingPharmacies = await prisma.pharmacy.count({
            where: { isApproved: false }
        });

        // 3. Drugs in Master Catalog
        const totalDrugs = await prisma.drug.count();

        // 4. Total Orders System-wide
        const totalOrders = await prisma.order.count();

        // 5. Recent/Pending Pharmacy Approvals (for Action Items)
        const pendingPharmacyList = await prisma.pharmacy.findMany({
            where: {
                OR: [
                    { isApproved: false },
                    { applicationStatus: 'DELETION_REQUESTED' }
                ]
            },
            take: 5,
            orderBy: { updatedAt: 'desc' }, // Order by updatedAt to see recent requests
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                applicationStatus: true,
                deletionReason: true
            }
        });

        res.json({
            users: totalUsers,
            pharmacies: {
                total: totalPharmacies,
                pending: pendingPharmacies,
                active: totalPharmacies - pendingPharmacies
            },
            drugs: totalDrugs,
            orders: totalOrders,
            pendingActions: pendingPharmacyList
        });

    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ error: 'Could not fetch system stats' });
    }
};

module.exports = { getSystemStats };
