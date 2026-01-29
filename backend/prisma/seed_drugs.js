const { PrismaClient } = require("@prisma/client");
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Master Catalog with more drugs...');

    const drugs = [
        { name: "Ibuprofen 400mg", description: "Anti-inflammatory pain reliever", manufacturer: "Emzor", image: "https://via.placeholder.com/150", category: "Bone", avgPrice: 500 },
        { name: "Amoxicillin 500mg", description: "Antibiotic for bacterial infections", manufacturer: "GlaxoSmithKline", image: "https://via.placeholder.com/150", category: "Injection", avgPrice: 1200 },
        { name: "Ciprofloxacin 500mg", description: "Broad-spectrum antibiotic", manufacturer: "Fidson", image: "https://via.placeholder.com/150", category: "Injection", avgPrice: 1500 },
        { name: "Metronidazole 400mg", description: "Antibiotic and antiprotozoal", manufacturer: "May & Baker", image: "https://via.placeholder.com/150", category: "Stomach", avgPrice: 800 },
        { name: "Loratadine 10mg", description: "Antihistamine for allergies", manufacturer: "Claritin", image: "https://via.placeholder.com/150", category: "Liquid", avgPrice: 900 },
        { name: "Omeprazole 20mg", description: "Acid reflux treatment", manufacturer: "Mopson", image: "https://via.placeholder.com/150", category: "Stomach", avgPrice: 1100 },
        { name: "Artemether Lumefantrine", description: "Malaria treatment", manufacturer: "Lonart", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 2000 },
        { name: "Multivite", description: "Daily multivitamin supplement", manufacturer: "Fidson", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 1500 },
        { name: "Vitamin B Complex", description: "Energy and metabolism support", manufacturer: "Emzor", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 700 },
        { name: "Diclofenac Potassium", description: "Pain and inflammation relief", manufacturer: "Novartis", image: "https://via.placeholder.com/150", category: "Bone", avgPrice: 600 },
        { name: "Panadol Extra", description: "Fast pain relief", manufacturer: "GlaxoSmithKline", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 500 },
        { name: "Paracetamol 500mg", description: "Mild pain relief", manufacturer: "Emzor", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 200 },
        { name: "Amatem Softgel", description: "Malaria treatment", manufacturer: "Elbe", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 2500 },
        { name: "Coartem 80/480", description: "Malaria treatment", manufacturer: "Novartis", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 3000 },
        { name: "Tetracycline", description: "Antibiotic", manufacturer: "Juhel", image: "https://via.placeholder.com/150", category: "Injection", avgPrice: 400 },
        { name: "Ampiclox", description: "Antibiotic", manufacturer: "Beecham", image: "https://via.placeholder.com/150", category: "Injection", avgPrice: 1800 },
        { name: "Mist Mag", description: "Antacid for heartburn", manufacturer: "Mopson", image: "https://via.placeholder.com/150", category: "Liquid", avgPrice: 1000 },
        { name: "Gaviscon", description: "Heartburn and indigestion", manufacturer: "Reckitt", image: "https://via.placeholder.com/150", category: "Liquid", avgPrice: 4500 },
        { name: "Piriton", description: "Allergy relief", manufacturer: "GlaxoSmithKline", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 400 },
        { name: "Procold", description: "Cold and flu relief", manufacturer: "Chi", image: "https://via.placeholder.com/150", category: "Tablet", avgPrice: 300 }
    ];

    for (const d of drugs) {
        // Check if exists
        const existing = await prisma.drug.findFirst({
            where: { name: d.name }
        });

        if (!existing) {
            await prisma.drug.create({ data: d });
            console.log(` - Created: ${d.name}`);
        } else {
            console.log(` - Skipped (Exists): ${d.name}`);
        }
    }

    console.log('Master Catalog Seeding Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
