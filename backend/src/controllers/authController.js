const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, password, name, role, pharmacyName, pharmacyAddress, pharmacyPhone, licenseNumber, documents } = req.body;

        console.log(`Registration attempt: ${email}, role: ${role}`);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.warn(`Registration failed: User already exists (${email})`);
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Security: Block SUPER_ADMIN creation via API
        if (role === 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Cannot register as Super Admin' });
        }

        // Transaction to create User and potentially Pharmacy
        const result = await prisma.$transaction(async (prisma) => {
            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: role || 'USER', // Default to USER
                },
            });

            // If Pharmacy Admin, create Pharmacy record immediately
            if (role === 'PHARMACY_ADMIN') {
                await prisma.pharmacy.create({
                    data: {
                        name: pharmacyName || `${name}'s Pharmacy`, // Fallback name
                        address: pharmacyAddress || 'Address Pending',
                        phone: pharmacyPhone || null,
                        email: email, // Use user email for pharmacy contact by default
                        latitude: 0.0, // Default pending updates
                        longitude: 0.0,
                        licenseNumber: licenseNumber || null,
                        documents: documents || null,
                        ownerId: user.id,
                        isApproved: false, // Legacy
                        applicationStatus: 'PENDING' // New Enum
                    }
                });
            }

            return user;
        });

        // Generate Token (Optional: Maybe don't generate token if they are pending? 
        // But usually we might return it but Login blocks usage. 
        // The requirement is "can't login". So maybe we don't return token if Pharmacy Admin?)
        // Let's return user info but maybe NOT token if strict, OR return it but Login will fail next time.
        // Actually, for better UX, let's allow them to be "created" but force them to Login, which will fail.

        res.status(201).json({
            message: "Registration successful. verification pending.",
            user: { id: result.id, email: result.email, name: result.name, role: result.role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check Approval Status for Pharmacy Admins
        if (user.role === 'PHARMACY_ADMIN') {
            const pharmacy = await prisma.pharmacy.findUnique({
                where: { ownerId: user.id }
            });

            // If pharmacy doesn't exist (legacy user?) or is not approved
            if (!pharmacy || !pharmacy.isApproved) {
                return res.status(403).json({
                    error: 'Account pending approval. Please contact support or wait for verification.'
                });
            }
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

module.exports = { register, login };
