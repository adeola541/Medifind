const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Drug Categories ---');

    // Group by category to see what exists
    const groups = await prisma.drug.groupBy({
        by: ['category'],
        _count: {
            id: true
        }
    });

    console.log('Categories found in DB:', groups);

    // Specific check for the problematic one
    const painDrugs = await prisma.drug.findMany({
        where: { category: "Pain Relief & Fever" },
        select: { name: true, category: true }
    });
    console.log(`\nDirect query for "Pain Relief & Fever": Found ${painDrugs.length}`);
    if (painDrugs.length > 0) console.log(painDrugs[0]);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
