const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch users' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body; // true or false

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isActive: isActive }
        });

        res.json({ message: 'User status updated', user: { id: user.id, isActive: user.isActive } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not update user' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateMe = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.user.userId;

        // Validation: Check if email is taken by another user
        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== userId) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const updateData = { name, email };
        if (password && password.length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true }
        });

        res.json(user);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Saved Items Logic
const saveItem = async (req, res) => {
    try {
        const { drugId } = req.body;
        const userId = req.user.userId;

        // Verify drug exists
        const drug = await prisma.drug.findUnique({ where: { id: drugId } });
        if (!drug) return res.status(404).json({ error: 'Drug not found' });

        const saved = await prisma.savedItem.create({
            data: {
                userId,
                drugId
            }
        });
        res.status(201).json(saved);
    } catch (error) {
        // P2002 is unique constraint violation (already saved)
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Item already saved' });
        }
        res.status(500).json({ error: 'Failed to save item' });
    }
};

const removeSavedItem = async (req, res) => {
    try {
        const { drugId } = req.params;
        const userId = req.user.userId;

        await prisma.savedItem.deleteMany({
            where: {
                userId: userId,
                drugId: drugId
            }
        });
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
};

const getSavedItems = async (req, res) => {
    try {
        const userId = req.user.userId;
        const saved = await prisma.savedItem.findMany({
            where: { userId },
            include: { drug: true } // including drug details
        });
        res.json(saved.map(s => s.drug)); // Return list of drugs
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch saved items' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const userId = req.user.userId;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address
            },
            select: { id: true, address: true, latitude: true, longitude: true }
        });

        res.json(user);
    } catch (error) {
        console.error("Location Update Error:", error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

module.exports = { getUsers, toggleUserStatus, getMe, updateMe, saveItem, removeSavedItem, getSavedItems, updateLocation };
