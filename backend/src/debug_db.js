const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Drugs ---');
    const drugs = await prisma.drug.findMany();
    console.log(`Found ${drugs.length} drugs.`);
    drugs.forEach(d => console.log(` - ${d.name} (ID: ${d.id})`));

    console.log('\n--- Checking PharmacyDrugs (Inventory) ---');
    const inventory = await prisma.pharmacyDrug.findMany({
        include: { pharmacy: true, drug: true }
    });
    console.log(`Found ${inventory.length} inventory items.`);
    inventory.forEach(i => {
        console.log(` - ${i.drug.name} at ${i.pharmacy.name} | Price: ${i.price} | Stock: ${i.inStock} | Approved: ${i.pharmacy.applicationStatus}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
