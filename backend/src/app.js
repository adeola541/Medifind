const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000',
    'http://localhost:8082',
    'https://medifind-production-acdc.up.railway.app',
    'https://glowing-robot-production.up.railway.app',
    'https://medifind-app.vercel.app' // Adding possible future frontend
];

// CORS Middleware - Manual Implementation for Reliability
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const isAllowed = origin && (allowedOrigins.indexOf(origin) !== -1 || isLocalhost);

    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Allow mobile apps/curl with no origin
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
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
    res.status(200).json({ status: 'ok', message: 'Service is healthy' });
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
