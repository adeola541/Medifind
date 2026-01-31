require("dotenv").config();
console.log('--- MediFind Server Booting ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const app = require("./app");
const port = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

try {
    app.listen(port, "0.0.0.0", () => {
        console.log(`✅ Server successfully bound to port ${port}`);
        console.log(`🚀 API active at http://0.0.0.0:${port}`);
    });
} catch (error) {
    console.error('FATAL: Could not start server:', error);
    process.exit(1);
}

