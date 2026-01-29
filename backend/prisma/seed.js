const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
        console.error("Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env");
        process.exit(1);
    }

    const existingAdmin = await prisma.user.findUnique({
        where: { email: superAdminEmail }
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
        await prisma.user.create({
            data: {
                name: 'Super Admin',
                email: superAdminEmail,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                isActive: true
            }
        });
        console.log(`Super Admin created: ${superAdminEmail}`);
    } else {
        console.log('Super Admin already exists.');
    }

    // 2. Clear existing Hospital Data (Optional: be careful in prod)
    // await prisma.hospital.deleteMany({}); 

    // 3. Seed Hospitals
    const hospitals = [
        {
            name: 'St. Nicholas Hospital',
            address: '57 Campbell St, Lagos Island, Lagos',
            latitude: 6.4531,
            longitude: 3.3958,
            image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000'
        },
        {
            name: 'Lagoon Hospital',
            address: '17B Bourdillon Rd, Ikoyi, Lagos',
            latitude: 6.4474,
            longitude: 3.4182,
            image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=2000'
        },
        {
            name: 'Reddington Hospital',
            address: '39 Isaac John St, Ikeja, Lagos',
            latitude: 6.5866,
            longitude: 3.3568,
            image: 'https://images.unsplash.com/photo-1516549655169-df83a0833860?auto=format&fit=crop&q=80&w=2000'
        }
    ];

    for (const h of hospitals) {
        // Check if hospital already exists by name
        const existingHospital = await prisma.hospital.findFirst({
            where: { name: h.name }
        });

        if (existingHospital) {
            console.log(`Hospital already exists: ${h.name}`);
        } else {
            await prisma.hospital.create({
                data: h
            });
            console.log(`Seeded Hospital: ${h.name}`);
        }
    }

    // 4. Seed Pharmacies (if not exist) associated with users
    // Creating a mock pharmacy for testing
    const pharmacyEmail = process.env.PHARMACY_ADMIN_EMAIL || 'pharmacy@alpha.com';
    const pharmacyPassword = process.env.PHARMACY_ADMIN_PASSWORD || 'Pharmacy@123';

    let pharmacyUser = await prisma.user.findUnique({ where: { email: pharmacyEmail } });

    if (!pharmacyUser) {
        pharmacyUser = await prisma.user.create({
            data: {
                name: 'Alpha Pharmacy Admin',
                email: pharmacyEmail,
                password: await bcrypt.hash(pharmacyPassword, 10),
                role: 'PHARMACY_ADMIN'
            }
        });
    }

    const stNicholas = await prisma.hospital.findFirst({ where: { name: 'St. Nicholas Hospital' } });

    if (stNicholas) {
        const pharmacy = await prisma.pharmacy.upsert({
            where: { ownerId: pharmacyUser.id },
            update: {
                hospitalId: stNicholas.id,
                latitude: 6.4540, // Nearby St Nicholas
                longitude: 3.3965,
                rating: 4.8,
                ratingCount: 1250,
                image: 'https://images.unsplash.com/photo-1563361411-1b41270830d6?auto=format&fit=crop&q=80&w=2000'
            },
            create: {
                name: 'Alpha Pharmacy',
                address: 'Near St. Nicholas',
                latitude: 6.4540,
                longitude: 3.3965,
                ownerId: pharmacyUser.id,
                hospitalId: stNicholas.id,
                rating: 4.8,
                ratingCount: 1250,
                image: 'https://images.unsplash.com/photo-1563361411-1b41270830d6?auto=format&fit=crop&q=80&w=2000'
            }
        });
        console.log(`Seeded Pharmacy: ${pharmacy.name} linked to ${stNicholas.name}`);
    }

    // 5. Seed Drugs and Inventory
    const drugsData = [
        {
            name: "Loratadine 10mg",
            description: "Non-drowsy antihistamine for allergy relief",
            manufacturer: "Mylan",
            category: "TABLET",
            avgPrice: 900,
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400"
        },
        {
            name: "Diclofenac Potassium",
            description: "Non-steroidal anti-inflammatory drug (NSAID) for pain relief",
            manufacturer: "Novartis",
            category: "TABLET",
            avgPrice: 600,
            image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=400"
        },
        {
            name: "Amoxicillin 500mg",
            description: "Antibiotic used to treat various bacterial infections",
            manufacturer: "GlaxoSmithKline",
            category: "CAPSULE",
            avgPrice: 1200,
            image: "https://images.unsplash.com/photo-1555633514-abcee6ad93e1?q=80&w=400"
        },
        {
            name: "Piriton (Chlorphenamine)",
            description: "Effective relief from hayfever and allergy symptoms",
            manufacturer: "GSK",
            category: "TABLET",
            avgPrice: 400,
            image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=400"
        },
        {
            name: "Paracetamol 500mg",
            description: "Pain reliever and fever reducer",
            manufacturer: "Emzor",
            category: "TABLET",
            avgPrice: 500,
            image: "https://images.unsplash.com/photo-1584017947282-23ddc4659a66?q=80&w=400"
        },
        {
            name: "Benylin Syrup",
            description: "Cough and cold relief",
            manufacturer: "Benylin",
            category: "LIQUID",
            avgPrice: 2200,
            image: "https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?q=80&w=400"
        },
        {
            name: "Visine Eye Drops",
            description: "Relieves red eyes",
            manufacturer: "Johnson & Johnson",
            category: "EYE",
            avgPrice: 2000,
            image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?q=80&w=400"
        }
    ];

    for (const d of drugsData) {
        let drug = await prisma.drug.findFirst({ where: { name: d.name } });
        if (!drug) {
            drug = await prisma.drug.create({ data: d });
            console.log(`Seeded Drug: ${d.name}`);
        }

        // Link to Alpha Pharmacy if exists
        const alphaPharmacy = await prisma.pharmacy.findFirst({ where: { name: 'Alpha Pharmacy' } });
        if (alphaPharmacy && drug) {
            await prisma.pharmacyDrug.upsert({
                where: {
                    pharmacyId_drugId: {
                        pharmacyId: alphaPharmacy.id,
                        drugId: drug.id
                    }
                },
                update: {}, // No update needed
                create: {
                    pharmacyId: alphaPharmacy.id,
                    drugId: drug.id,
                    price: 500 + Math.floor(Math.random() * 1000), // Random price 500-1500
                    inStock: true
                }
            });
            console.log(`Added ${d.name} to Alpha Pharmacy inventory`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
