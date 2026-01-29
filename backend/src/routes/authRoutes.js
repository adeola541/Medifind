const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validate, schemas } = require('../middlewares/validationMiddleware');

const { authenticateToken } = require('../middlewares/authMiddleware');
const prisma = require('../utils/prisma');

// Debug Endpoint
router.get('/debug', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({
            tokenClaim: req.user,
            dbUser: user,
            match: req.user.role === user?.role
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);

module.exports = router;
