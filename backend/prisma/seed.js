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

    // Upsert Admin
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {},
        create: {
            name: 'Super Admin',
            email: superAdminEmail,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true
        }
    });

    // 2. Seed Hospitals
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
        },
        {
            name: 'Primary Health Center Ota',
            address: '76 Idiroko Rd, Ota, Ogun State',
            latitude: 6.6905,
            longitude: 3.2323,
            image: 'https://plus.unsplash.com/premium_photo-1661281397737-9b5d75b52beb?q=80&w=2938&auto=format&fit=crop'
        }
    ];

    for (const h of hospitals) {
        await prisma.hospital.upsert({
            where: { name: h.name },
            update: h,
            create: h
        });
        console.log(`Seeded Hospital: ${h.name}`);
    }

    // 3. Seed Pharmacy Admin
    const pharmacyEmail = process.env.PHARMACY_ADMIN_EMAIL || 'pharmacy@alpha.com';
    const pharmacyPassword = process.env.PHARMACY_ADMIN_PASSWORD || 'Pharmacy@123';
    const pHash = await bcrypt.hash(pharmacyPassword, 10);

    const pharmacyUser = await prisma.user.upsert({
        where: { email: pharmacyEmail },
        update: {},
        create: {
            name: 'Alpha Pharmacy Admin',
            email: pharmacyEmail,
            password: pHash,
            role: 'PHARMACY_ADMIN'
        }
    });

    // 4. Seed Pharmacies
    const stNicholas = await prisma.hospital.findFirst({ where: { name: 'St. Nicholas Hospital' } });
    if (stNicholas) {
        await prisma.pharmacy.upsert({
            where: { ownerId: pharmacyUser.id },
            update: {
                // Ensure coordinates are accurate for map testing
                latitude: 6.4540,
                longitude: 3.3965
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
    }

    // 5. Seed Expanded Drugs (Merged list with better images)
    const drugsData = [
        // Original High Quality
        { name: "Loratadine 10mg", description: "Non-drowsy antihistamine", manufacturer: "Mylan", category: "TABLET", avgPrice: 900, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400" },
        { name: "Diclofenac Potassium", description: "Pain relief NSAID", manufacturer: "Novartis", category: "TABLET", avgPrice: 600, image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=400" },
        { name: "Amoxicillin 500mg", description: "Antibiotic", manufacturer: "GlaxoSmithKline", category: "CAPSULE", avgPrice: 1200, image: "https://images.unsplash.com/photo-1555633514-abcee6ad93e1?q=80&w=400" },
        { name: "Piriton (Chlorphenamine)", description: "Allergy relief", manufacturer: "GSK", category: "TABLET", avgPrice: 400, image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=400" },
        { name: "Paracetamol 500mg", description: "Pain reliever", manufacturer: "Emzor", category: "TABLET", avgPrice: 500, image: "https://images.unsplash.com/photo-1584017947282-23ddc4659a66?q=80&w=400" },
        { name: "Benylin Syrup", description: "Cough relief", manufacturer: "Benylin", category: "LIQUID", avgPrice: 2200, image: "https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?q=80&w=400" },
        { name: "Visine Eye Drops", description: "Red eye relief", manufacturer: "Johnson & Johnson", category: "EYE", avgPrice: 2000, image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?q=80&w=400" },

        // New Additions (Mapped to Categories for SmartImage or real images)
        { name: "Ibuprofen 400mg", description: "Anti-inflammatory", manufacturer: "Emzor", category: "TABLET", avgPrice: 500, image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?q=80&w=400" },
        { name: "Ciprofloxacin 500mg", description: "Antibiotic", manufacturer: "Fidson", category: "TABLET", avgPrice: 1500, image: "" }, // Will use SmartImage Pill
        { name: "Metronidazole 400mg", description: "Antibiotic", manufacturer: "May & Baker", category: "TABLET", avgPrice: 800, image: "" },
        { name: "Omeprazole 20mg", description: "Acid reflux", manufacturer: "Mopson", category: "CAPSULE", avgPrice: 1100, image: "" },
        { name: "Artemether Lumefantrine", description: "Malaria treatment", manufacturer: "Lonart", category: "TABLET", avgPrice: 2000, image: "" },
        { name: "Multivite", description: "Multivitamin", manufacturer: "Fidson", category: "TABLET", avgPrice: 1500, image: "https://images.unsplash.com/photo-1574484284008-81dcec289d38?q=80&w=400" },
        { name: "Vitamin B Complex", description: "Energy support", manufacturer: "Emzor", category: "TABLET", avgPrice: 700, image: "" },
        { name: "Panadol Extra", description: "Fast pain relief", manufacturer: "GSK", category: "TABLET", avgPrice: 500, image: "" },
        { name: "Coartem 80/480", description: "Malaria treatment", manufacturer: "Novartis", category: "TABLET", avgPrice: 3000, image: "" },
        { name: "Tetracycline", description: "Antibiotic", manufacturer: "Juhel", category: "CAPSULE", avgPrice: 400, image: "" },
        { name: "Ampiclox", description: "Antibiotic", manufacturer: "Beecham", category: "CAPSULE", avgPrice: 1800, image: "" },
        { name: "Gaviscon", description: "Heartburn relief", manufacturer: "Reckitt", category: "LIQUID", avgPrice: 4500, image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=400" },
        { name: "Procold", description: "Cold relief", manufacturer: "Chi", category: "TABLET", avgPrice: 300, image: "" }
    ];

    const alphaPharmacy = await prisma.pharmacy.findFirst({ where: { name: 'Alpha Pharmacy' } });

    for (const d of drugsData) {
        let drug = await prisma.drug.findFirst({ where: { name: d.name } });
        if (!drug) {
            drug = await prisma.drug.create({ data: d });
            console.log(`Seeded Drug: ${d.name}`);
        } else {
            // Update image if existing has placeholder
            if (d.image && (!drug.image || drug.image.includes('placeholder'))) {
                await prisma.drug.update({ where: { id: drug.id }, data: { image: d.image, category: d.category } });
                console.log(`Updated images for: ${d.name}`);
            }
        }

        if (alphaPharmacy && drug) {
            await prisma.pharmacyDrug.upsert({
                where: {
                    pharmacyId_drugId: {
                        pharmacyId: alphaPharmacy.id,
                        drugId: drug.id
                    }
                },
                update: {},
                create: {
                    pharmacyId: alphaPharmacy.id,
                    drugId: drug.id,
                    price: d.avgPrice,
                    inStock: true
                }
            });
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
