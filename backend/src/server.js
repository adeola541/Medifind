require("dotenv").config();
const app = require("./app");
const port = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

try {
    // Railway requires binding to 0.0.0.0 and using the provided PORT
    const server = app.listen(port, "0.0.0.0", () => {
        const address = server.address();
        console.log(`✅ Server successfully bound`);
        console.log(`📡 Listening on: ${address.address}:${address.port}`);
        console.log(`Environment PORT variable: ${process.env.PORT || 'Not Set (using 5000)'}`);
        console.log(`Checking DATABASE_URL... ${process.env.DATABASE_URL ? 'Present' : 'MISSING'}`);
    });
} catch (error) {
    console.error('FATAL: Startup Error:', error);
}