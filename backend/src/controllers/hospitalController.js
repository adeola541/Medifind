const prisma = require('../utils/prisma');

const getHospitals = async (req, res) => {
    try {
        const hospitals = await prisma.hospital.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(hospitals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch hospitals' });
    }
};

module.exports = { getHospitals };
