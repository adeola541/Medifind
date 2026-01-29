const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING FRESH DATABASE SEED ---');

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const pharmacyPassword = await bcrypt.hash('Pharmacy@123', 10);
    const customerPassword = await bcrypt.hash('Order@123', 10);

    // 0. CLEANUP (Delete in correct order)
    console.log('1. Clearing existing data...');
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.pharmacyDrug.deleteMany({});
    await prisma.drug.deleteMany({});
    await prisma.pharmacy.deleteMany({});
    await prisma.hospital.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('   - Database cleared.');

    // 1. Create Super Admin
    console.log('2. Creating Super Admin...');
    await prisma.user.create({
        data: {
            email: "admin@medifind.com",
            name: "Super Admin",
            password: adminPassword,
            role: "SUPER_ADMIN",
            isActive: true
        }
    });

    // 2. Create Pharmacy Admins
    console.log('3. Creating Pharmacy Admins...');
    const admins = [
        { email: 'mazepharmacy@alpha.com', name: 'Maze Admin' },
        { email: 'windpharmacy@alpha.com', name: 'Wind Admin' }
    ];

    const seededAdmins = [];
    for (const a of admins) {
        const user = await prisma.user.create({
            data: {
                email: a.email,
                name: a.name,
                password: pharmacyPassword,
                role: 'PHARMACY_ADMIN',
                isActive: true
            }
        });
        seededAdmins.push(user);
    }

    // 3. Create a Mock Customer
    console.log('4. Creating Test Customer...');
    const customer = await prisma.user.create({
        data: {
            email: 'customer@test.com',
            name: 'Test Customer',
            password: customerPassword,
            role: 'USER',
            isActive: true
        }
    });

    // 4. Create Hospital
    console.log('5. Creating Hospital...');
    const lagoon = await prisma.hospital.create({
        data: {
            name: 'Lagoon Hospital',
            address: '17B Bourdillon Rd, Ikoyi, Lagos',
            latitude: 6.4474,
            longitude: 3.4182
        }
    });

    // 5. Create Pharmacies
    console.log('6. Creating Pharmacies (Maze & Wind)...');
    const mazePharmacy = await prisma.pharmacy.create({
        data: {
            name: 'Maze Pharmacy',
            address: 'Maze Plaza, Victoria Island',
            latitude: 6.4300,
            longitude: 3.4200,
            ownerId: seededAdmins[0].id,
            hospitalId: lagoon.id
        }
    });

    const windPharmacy = await prisma.pharmacy.create({
        data: {
            name: 'Wind Pharmacy',
            address: 'Wind Towers, Lekki',
            latitude: 6.4500,
            longitude: 3.4500,
            ownerId: seededAdmins[1].id,
            hospitalId: lagoon.id
        }
    });

    // 6. Seed Drugs
    console.log('7. Seeding Drugs...');
    const drugs = [
        { name: "Paracetamol 500mg", description: "Pain reliever", manufacturer: "Emzor" },
        { name: "Vitamin C 1000mg", description: "Immune support", manufacturer: "Reload" },
        { name: "Amartem Softgel", description: "Malaria treatment", manufacturer: "Elbe" }
    ];

    const seededDrugs = [];
    for (const d of drugs) {
        const drug = await prisma.drug.create({ data: d });
        seededDrugs.push(drug);

        // Add to both pharmacies' inventory
        for (const p of [mazePharmacy, windPharmacy]) {
            await prisma.pharmacyDrug.create({
                data: {
                    pharmacyId: p.id,
                    drugId: drug.id,
                    price: 1500,
                    inStock: true
                }
            });
        }
    }

    // 7. Seed 3 Orders for EACH pharmacy
    console.log('8. Seeding 3 Orders for both pharmacies...');
    const pharmacies = [mazePharmacy, windPharmacy];
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED'];

    for (const [index, p] of pharmacies.entries()) {
        for (let i = 0; i < 3; i++) {
            await prisma.order.create({
                data: {
                    userId: customer.id,
                    pharmacyId: p.id,
                    totalAmount: 3000,
                    status: statuses[i],
                    items: {
                        create: [
                            { drugId: seededDrugs[0].id, quantity: 1, price: 1500 },
                            { drugId: seededDrugs[1].id, quantity: 1, price: 1500 }
                        ]
                    }
                }
            });
        }
        console.log(`   - 3 orders seeded for ${p.name}`);
    }

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY! ---');
    console.log('Login with:');
    console.log('1. admin@medifind.com / Admin@123');
    console.log('2. mazepharmacy@alpha.com / Pharmacy@123');
    console.log('3. windpharmacy@alpha.com / Pharmacy@123');
}

main()
    .catch((e) => {
        console.error('SEEDING FAILED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
