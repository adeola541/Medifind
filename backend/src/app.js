const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
const allowedOrigins = [
    'https://medifind-dashboard-production.up.railway.app'
];

// CORS Middleware - Manual Implementation for Reliability
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const isAllowed = origin && (allowedOrigins.indexOf(origin) !== -1 || isLocalhost);

    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Allow ANY origin for now to ensure mobile/dev compatibility
        // In strict production, this would be restricted, but for mobile app direct hits it's often needed
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-session-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
app.use(require('morgan')('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) => {
    res.send('MediFind API is running');
});

app.get('/api/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
});

// Routes
const authRoutes = require('./routes/authRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const drugRoutes = require('./routes/drugRoutes');
const orderRoutes = require('./routes/orderRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));

module.exports = app;