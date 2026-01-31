const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

console.log('--- Initializing Database Connection ---');

if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL: DATABASE_URL environment variable is missing!');
    // Allow non-crashing for build steps, but log heavily
}

const connectionString = process.env.DATABASE_URL;

let prisma;

try {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    // DB Ping to verify connection
    prisma.$executeRaw`SELECT 1`
        .then(() => console.log('✅ Database Ping Successful'))
        .catch(err => console.error('❌ Database Ping Failed:', err.message));

    console.log('✅ Prisma Client initialized with PostgreSQL Adapter');
} catch (error) {
    console.error('❌ Failed to initialize Prisma Adapter:', error);
    // Fallback to standard client if adapter fails (safety net)
    console.log('⚠️ Attempting fallback to standard Prisma Client...');
    prisma = new PrismaClient();
}

module.exports = prisma;
