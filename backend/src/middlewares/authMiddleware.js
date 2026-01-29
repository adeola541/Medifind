const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Check if user still exists in DB
        const prisma = require('../utils/prisma');
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });

        if (!dbUser) {
            return res.status(401).json({ error: 'User account not found' });
        }

        req.user = user;
        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.warn(`403 Forbidden: User role [${req?.user?.role}] not in allowed roles [${roles}] for path ${req.path}`);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
