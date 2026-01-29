const prisma = require('../utils/prisma');
const { createDedicatedAccount, initializeTransaction, verifySignature, verifyTransaction } = require('../services/paystackService');

const getWallet = async (req, res) => {
    try {
        const userId = req.user.userId;
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } }
        });

        // Auto-create wallet if missing
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { userId, balance: 0.0 }
            });
        }

        // Dedicated Account creation is disabled for now in favor of Direct Top-up
        // This avoids errors for businesses without NUBAN permissions
        /*
        if (!wallet.accountNumber) {
           // Legacy NUBAN logic removed
        }
        */

        res.json(wallet);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch wallet info' });
    }
};

const initializeTopUp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Initialize Paystack transaction
        const paystackData = await initializeTransaction(user.email, amount, {
            userId,
            type: 'WALLET_TOPUP'
        });

        res.json(paystackData);
    } catch (error) {
        console.error('Top-up initialization failed:', error.message);
        res.status(500).json({ error: error.message || 'Failed to initialize top-up' });
    }
};

const handlePaystackWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-paystack-signature'];
        const rawBody = JSON.stringify(req.body);

        // Verify the signature
        if (!verifySignature(signature, rawBody)) {
            console.warn('Invalid Paystack signature received');
            return res.status(401).send('Invalid signature');
        }

        const { event, data } = req.body;

        if (event === 'charge.success') {
            const { reference, amount, customer, channel } = data;
            const realAmount = amount / 100; // Paystack subunits to NGN

            // Find wallet by user email
            const wallet = await prisma.wallet.findFirst({
                where: { user: { email: customer.email } }
            });

            if (wallet) {
                // Check if transaction already processed
                const existingTx = await prisma.walletTransaction.findUnique({
                    where: { reference: reference }
                });

                if (!existingTx) {
                    await prisma.$transaction([
                        prisma.wallet.update({
                            where: { id: wallet.id },
                            data: { balance: { increment: realAmount } }
                        }),
                        prisma.walletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                amount: realAmount,
                                type: 'DEPOSIT',
                                status: 'SUCCESS',
                                reference: reference,
                                description: `Deposit via ${channel}`
                            }
                        })
                    ]);
                    console.log(`Wallet ${wallet.id} credited with ${realAmount} via Paystack`);
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Paystack Webhook Error:', error);
        res.status(500).send('Internal Error');
    }
};

const verifyTopUp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { reference } = req.body;

        console.log(`[Verify] Request for user ${userId}, ref: ${reference}`);

        if (!reference) {
            return res.status(400).json({ error: 'Transaction reference is required' });
        }

        // Verify with Paystack
        const verifyData = await verifyTransaction(reference);
        console.log('[Verify] Paystack Response:', JSON.stringify(verifyData, null, 2));

        if (verifyData.status && verifyData.data.status === 'success') {
            const { amount, reference: txRef, channel } = verifyData.data;
            const realAmount = amount / 100;

            // Check if transaction already processed locally
            const existingTx = await prisma.walletTransaction.findUnique({
                where: { reference: txRef }
            });

            if (existingTx) {
                console.log('[Verify] Transaction already processed:', txRef);
                return res.json({ status: 'success', message: 'Transaction already processed', wallet: null });
            }

            // Find User's Wallet or Create if missing
            let wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet) {
                console.log('[Verify] Wallet missing, creating new wallet for user:', userId);
                wallet = await prisma.wallet.create({
                    data: { userId, balance: 0.0 }
                });
            }

            // Perform Update
            await prisma.$transaction([
                prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: realAmount } }
                }),
                prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: realAmount,
                        type: 'DEPOSIT',
                        status: 'SUCCESS',
                        reference: txRef,
                        description: `Deposit via ${channel || 'online'}`
                    }
                })
            ]);

            console.log(`[Verify] Success! Wallet credited: ${realAmount}`);
            return res.json({ status: 'success', message: 'Wallet credited successfully' });
        }

        console.warn('[Verify] Validation Failed:', verifyData.data?.gateway_response || verifyData.message);
        res.status(400).json({
            status: 'failed',
            message: `Payment Validation Failed: ${verifyData.data?.gateway_response || 'Unknown error'}`,
            debug: verifyData
        });

    } catch (error) {
        console.error('Verify Top-up Error:', error);
        res.status(500).json({ error: 'Failed to verify transaction: ' + error.message });
    }
};

const simulateTopUp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // Find Wallet or Create
        let wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            wallet = await prisma.wallet.create({ data: { userId, balance: 0.0 } });
        }

        // Direct Credit
        const realAmount = Number(amount);
        await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: realAmount } }
            }),
            prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: realAmount,
                    type: 'DEPOSIT',
                    status: 'SUCCESS',
                    reference: 'SIM_' + Date.now(),
                    description: 'Simulated Top-Up'
                }
            })
        ]);

        return res.json({ status: 'success', message: 'Wallet credited successfully (Simulated)' });

    } catch (error) {
        console.error('Simulate Top-Up Error:', error);
        res.status(500).json({ error: 'Failed to simulate top-up' });
    }
};

module.exports = {
    getWallet,
    initializeTopUp,
    verifyTopUp,
    handlePaystackWebhook,
    simulateTopUp
};
