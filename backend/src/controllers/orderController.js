const prisma = require('../utils/prisma');
const { initializeTransaction, verifyTransaction } = require('../services/paystackService');
const crypto = require('crypto');

// Helper to generate deterministic UUID from string (v5-like)
const toUUID = (str) => {
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    // Format as UUID: 8-4-4-4-12
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
};

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const createOrder = async (req, res) => {
    try {
        const { pharmacyId: rawPharmacyIdInput, pharmacyName, items, paymentMethod } = req.body; // paymentMethod: 'WALLET' | 'ONLINE'
        const userId = req.user.userId;

        const rawPharmacyId = String(rawPharmacyIdInput);
        let realPharmacyId = rawPharmacyId;

        // 1. Resolve Pharmacy ID
        if (!isUUID(rawPharmacyId)) {
            // It's a simulated/OSM ID. Check if we have it mapped.
            const existingPharm = await prisma.pharmacy.findUnique({ where: { osm_id: rawPharmacyId } });

            if (existingPharm) {
                realPharmacyId = existingPharm.id;
            } else {
                // Determine Coordinates (Simulate or use provided?)
                // Since we don't have coords in body, use defaults or specific Lagos location
                const newPharm = await prisma.pharmacy.create({
                    data: {
                        name: pharmacyName || 'Simulated Pharmacy',
                        address: 'Simulated Address, Lagos',
                        latitude: 6.5244,
                        longitude: 3.3792,
                        osm_id: rawPharmacyId
                    }
                });
                realPharmacyId = newPharm.id;
            }
        } else {
            // Verify Real Pharmacy Exists
            const exists = await prisma.pharmacy.findUnique({ where: { id: rawPharmacyId } });
            if (!exists) {
                return res.status(404).json({ error: 'Pharmacy not found' });
            }
        }

        // Calculate total amount
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            let realDrugId = String(item.drugId);

            // 2. Resolve Drug ID
            if (!isUUID(realDrugId)) {
                realDrugId = toUUID(realDrugId);
            }

            // Ensure Drug Exists
            const drugExists = await prisma.drug.findUnique({ where: { id: realDrugId } });
            if (!drugExists) {
                await prisma.drug.create({
                    data: {
                        id: realDrugId,
                        name: item.drugName || 'Simulated Drug',
                        description: 'Automatically created for simulation',
                        requiresPrescription: false
                    }
                });
            }

            let pharmacyDrug = await prisma.pharmacyDrug.findUnique({
                where: {
                    pharmacyId_drugId: {
                        pharmacyId: realPharmacyId,
                        drugId: realDrugId
                    }
                }
            });

            let price = 0;
            if (!pharmacyDrug) {
                // Trust Frontend Price
                if (item.price) {
                    price = Number(item.price);
                } else {
                    return res.status(400).json({ error: `Drug unavailable and no price provided.` });
                }
            } else {
                price = Number(pharmacyDrug.price);
            }

            totalAmount += price * item.quantity;
            orderItemsData.push({
                drugId: realDrugId,
                quantity: item.quantity,
                price: price
            });
        }

        if (paymentMethod === 'ONLINE') {
            // 1. Create Pending Order
            const order = await prisma.order.create({
                data: {
                    userId,
                    pharmacyId: realPharmacyId,
                    totalAmount,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });

            // 2. Initialize Paystack
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const paystackData = await initializeTransaction(user.email, totalAmount, {
                orderId: order.id,
                type: 'ORDER_PAYMENT',
                userId
            });

            return res.status(201).json({
                order,
                paymentUrl: paystackData.authorization_url,
                reference: paystackData.reference,
                mode: 'ONLINE'
            });

        } else if (paymentMethod === 'CASH') {
            // CASH ON DELIVERY
            const order = await prisma.order.create({
                data: {
                    userId,
                    pharmacyId: realPharmacyId,
                    totalAmount,
                    status: 'PENDING', // Confirmed upon delivery
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });
            return res.status(201).json({ order, mode: 'CASH' });

        } else {
            // WALLET PAYMENT (Default if 'WALLET' or unspecified)
            const result = await prisma.$transaction(async (tx) => {
                // 1. Get Wallet
                const wallet = await tx.wallet.findUnique({ where: { userId } });
                if (!wallet || Number(wallet.balance) < totalAmount) {
                    throw new Error('Insufficient wallet balance');
                }

                // 2. Deduct from Wallet
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: totalAmount } }
                });

                // 3. Create Wallet Transaction Record
                const walletTxRef = `PX_${Date.now()}_${userId.substring(0, 5)}`;
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: totalAmount,
                        type: 'PURCHASE',
                        status: 'SUCCESS',
                        reference: walletTxRef,
                        description: `Payment for order`
                    }
                });

                // 4. Create Order (Status defaults to CONFIRMED as it's paid)
                return await tx.order.create({
                    data: {
                        userId,
                        pharmacyId: realPharmacyId,
                        totalAmount,
                        status: 'CONFIRMED',
                        items: {
                            create: orderItemsData
                        }
                    },
                    include: { items: true }
                });
            });

            return res.status(201).json({ ...result, mode: 'WALLET' });
        }
    } catch (error) {
        console.error(error);
        if (error.message === 'Insufficient wallet balance') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Could not create order' });
    }
};

const verifyOrderPayment = async (req, res) => {
    try {
        const { reference, orderId } = req.body;

        console.log(`[VerifyOrder] Ref: ${reference}, Order: ${orderId}`);

        if (!reference || !orderId) {
            return res.status(400).json({ error: 'Missing reference or orderId' });
        }

        const verifyData = await verifyTransaction(reference);
        console.log('[VerifyOrder] Status:', verifyData.data.status);

        if (verifyData.status && verifyData.data.status === 'success') {
            // Update Order Status
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'CONFIRMED' }
            });

            return res.json({ status: 'success', order: updatedOrder });
        }

        res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
    } catch (error) {
        console.error('Verify Order Error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: { include: { drug: true } },
                pharmacy: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch orders' });
    }
};

const getPharmacyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('----------------------------------------------------');
        console.log('DEBUG: getPharmacyOrders');
        console.log(`DEBUG: User ID from token: ${userId}`);

        const pharmacy = await prisma.pharmacy.findUnique({
            where: { ownerId: userId }
        });

        console.log(`DEBUG: Pharmacy Lookup Result:`, pharmacy ? `Found (ID: ${pharmacy.id})` : 'NULL');

        if (!pharmacy) {
            console.warn(`DEBUG: No pharmacy linked to ownerId ${userId}. Returning 404.`);
            return res.status(404).json({ error: 'Pharmacy not found' });
        }

        const orders = await prisma.order.findMany({
            where: { pharmacyId: pharmacy.id },
            include: {
                items: { include: { drug: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`DEBUG: Found ${orders.length} orders for pharmacy.`);
        res.json(orders);
    } catch (error) {
        console.error('DEBUG: Error in getPharmacyOrders:', error);
        res.status(500).json({ error: 'Could not fetch orders', details: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // todo: Verify pharmacy ownership logic

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not update order' });
    }
};

const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
        const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

        // Basic revenue calc (sum of totalAmount)
        const revenue = await prisma.order.aggregate({
            _sum: { totalAmount: true }
        });

        res.json({
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue: revenue._sum.totalAmount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch stats' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { drug: true } },
                pharmacy: true
            }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.userId !== userId) return res.status(403).json({ error: 'Access denied' });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch order' });
    }
};

module.exports = { createOrder, verifyOrderPayment, getMyOrders, getOrderById, getPharmacyOrders, updateOrderStatus, getOrderStats };
