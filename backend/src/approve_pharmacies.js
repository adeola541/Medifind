const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Approving All Pharmacies ---');

    const update = await prisma.pharmacy.updateMany({
        data: {
            applicationStatus: 'APPROVED'
        }
    });

    console.log(`Updated ${update.count} pharmacies to APPROVED.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
