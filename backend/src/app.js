const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
const allowedOrigins = [
    'https://medifind-dashboard-production.up.railway.app',
    'https://medifind-api-production.up.railway.app',
    'https://medifind-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-session-id'],
    optionsSuccessStatus: 200
}));

// Explicit OPTIONS handler handled by global middleware



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
