import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, MapPin, CreditCard, DollarSign, CheckCircle, ShieldCheck, ChevronRight, Truck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '../../store/cartStore';
import { fetchWallet, validateCart, createOrder, verifyOrderPayment } from '../../services/api';
import { Wallet as WalletIcon } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState('123 Medical Drive, Victoria Island, Lagos');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'online'>('wallet');
    const [isSuccess, setIsSuccess] = useState(false);
    const [wallet, setWallet] = useState<any>(null);

    const [deliveryFee, setDeliveryFee] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [isValid, setIsValid] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        initializeCheckout();
    }, []);

    const initializeCheckout = async () => {
        try {
            setLoading(true);

            // Fetch Wallet
            const walletData = await fetchWallet();
            setWallet(walletData);

            const { status } = await Location.requestForegroundPermissionsAsync();
            let lat, lng;
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                lat = location.coords.latitude;
                lng = location.coords.longitude;
            }

            const validation = await validateCart(items, lat, lng);

            setDeliveryFee(validation.deliveryFee || 500);
            setGrandTotal(validation.grandTotal || (getTotal() + 500));

            if (!validation.valid || validation.changes.length > 0) {
                setIsValid(false);
                const errors = validation.changes.map((c: any) => c.message).join('\n');
                setValidationError(errors);
                Alert.alert('Cart Updated', `Some items have changed:\n${errors}`, [
                    { text: 'Review Cart', onPress: () => router.back() },
                    { text: 'Continue Anyway', onPress: () => setIsValid(true) }
                ]);
            } else {
                setIsValid(true);
            }

        } catch (error) {
            console.error('Checkout initialization failed:', error);
            setDeliveryFee(500);
            setGrandTotal(getTotal() + 500);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!isValid) {
            Alert.alert('Cannot Proceed', 'Please review your cart items.');
            return;
        }

        if (paymentMethod === 'wallet' && (!wallet || parseFloat(wallet.balance) < grandTotal)) {
            Alert.alert('Insufficient Balance', 'Your wallet balance is too low. Please top up your wallet to continue.', [
                { text: 'Top Up Wallet', onPress: () => router.push('/wallet') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        setLoading(true);
        const createdOrderIds: string[] = [];
        try {
            const ordersByPharmacy: { [key: string]: any[] } = {};
            items.forEach(item => {
                const pid = item.pharmacyId;
                if (!ordersByPharmacy[pid]) {
                    ordersByPharmacy[pid] = [];
                }
                ordersByPharmacy[pid].push({
                    drugId: item.drugId,
                    drugName: item.drugName,
                    quantity: item.quantity,
                    price: item.price
                });
            });

            // If Online Payment
            if (paymentMethod === 'online') {
                // For MVP, we only handle single pharmacy order for online payment nicely, or we loop?
                // If multiple pharmacies, we might need multiple transactions or a split payment.
                // For now, let's assume one big transaction if we could, OR just loop through like before.
                // The backend creates an Order per pharmacy.
                // This is tricky with multiple payments.
                // Let's assume the user has items from only ONE pharmacy for simplicity, OR we handle one by one.
                // To keep it simple: Loop through. But UI flow with multiple redirects is bad.
                // Ideal: Single Payment for Cart. Backend splits it.
                // Current backend infrastructure is 'createOrder' per pharmacy.

                // Let's warn if multiple pharmacies for online payment?
                // Or just process the first one?
                // Let's iterate. The user will have to pay multiple times? That's bad UX.
                // But for now, let's implement the loop and see.

                // Actually, if we loop, we open multiple browsers? No.
                // Let's just handle them sequentially or Promise.all? 
                // WebBrowser is blocking-ish.

                // Updated Strategy: Process them sequentially for Online payment.

                const pharmacyIds = Object.keys(ordersByPharmacy);
                const feePerLayout = pharmacyIds.length > 0 ? Math.round(deliveryFee / pharmacyIds.length) : 0;

                for (const pid of pharmacyIds) {
                    // Find Name
                    const pName = items.find(i => i.pharmacyId === pid)?.pharmacyName;

                    const result = await createOrder({
                        pharmacyId: pid,
                        pharmacyName: pName || 'Simulated Pharmacy',
                        items: ordersByPharmacy[pid],
                        paymentMethod: 'ONLINE',
                        deliveryFee: feePerLayout
                    });


                    if (result.paymentUrl) {
                        await WebBrowser.openBrowserAsync(result.paymentUrl);
                        // Verify
                        await verifyOrderPayment(result.reference, result.order.id);
                    }
                    if (result.order && result.order.id) {
                        createdOrderIds.push(result.order.id);
                    }
                }

            } else {
                // Wallet or Cash
                const method = paymentMethod === 'wallet' ? 'WALLET' : 'CASH';
                const pharmacyIds = Object.keys(ordersByPharmacy);
                const feePerOrder = pharmacyIds.length > 0 ? Math.round(deliveryFee / pharmacyIds.length) : 0;

                const promises = pharmacyIds.map(pharmacyId => {
                    const pName = items.find(i => i.pharmacyId === pharmacyId)?.pharmacyName;
                    return createOrder({
                        pharmacyId,
                        pharmacyName: pName || 'Simulated Pharmacy',
                        items: ordersByPharmacy[pharmacyId],
                        paymentMethod: method,
                        deliveryFee: feePerOrder
                    });
                });
                const results = await Promise.all(promises);
                results.forEach(res => {
                    if (res && res.order && res.order.id) {
                        createdOrderIds.push(res.order.id);
                    }
                });
            }

            setLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                if (createdOrderIds.length > 0) {
                    // @ts-ignore
                    router.replace({ pathname: '/order/[id]', params: { id: createdOrderIds[0] } });
                } else {
                    router.replace('/(tabs)');
                }
            }, 3000);
        } catch (error: any) {
            console.error('Payment failed:', error);
            setLoading(false);
            const errMsg = error.response?.data?.error || 'There was an error placing your order. Please try again.';
            Alert.alert('Order Failed', errMsg);
        }
    };

    const subtotal = getTotal();

    if (isSuccess) {
        return (
            <View style={styles.successContainer}>
                <StatusBar style="dark" />
                <View style={styles.successIconBox}>
                    <CheckCircle size={80} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={styles.successTitle}>Order Placed!</Text>
                <Text style={styles.successSubtitle}>Your medication is being prepared and will be delivered shortly.</Text>
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
                <Text style={styles.redirectText}>Returning to Home...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={styles.shieldBox}>
                    <ShieldCheck size={20} color={Colors.primary} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Steps */}
                <View style={styles.stepsRow}>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <Text style={styles.stepTextActive}>Order</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <Text style={styles.stepTextActive}>Payment</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepItem}>
                        <View style={styles.stepDot} />
                        <Text style={styles.stepText}>Confirm</Text>
                    </View>
                </View>

                {/* Validation Warning */}
                {validationError && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{validationError}</Text>
                    </View>
                )}

                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <TouchableOpacity><Text style={styles.editLink}>Change</Text></TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.addressRow}>
                            <View style={styles.iconCircle}>
                                <MapPin size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>Home</Text>
                                <TextInput
                                    style={styles.addressInput}
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Delivery Estimate */}
                <View style={styles.estimateBox}>
                    <Truck size={20} color={Colors.primary} />
                    <Text style={styles.estimateText}>Estimated Delivery: <Text style={{ fontWeight: 'bold' }}>30-45 mins</Text></Text>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('wallet')}
                    >
                        <View style={styles.paymentRow}>
                            <View style={[styles.paymentIconBox, paymentMethod === 'wallet' && { backgroundColor: '#D1FAE5' }]}>
                                <WalletIcon size={20} color={paymentMethod === 'wallet' ? Colors.primary : Colors.textLight} />
                            </View>
                            <View>
                                <Text style={[styles.paymentText, paymentMethod === 'wallet' && styles.paymentTextActive]}>Medifind Wallet</Text>
                                <Text style={[styles.walletBalance, parseFloat(wallet?.balance || '0') < grandTotal && { color: '#DC2626' }]}>
                                    Balance: ₦{parseFloat(wallet?.balance || '0').toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.radio, paymentMethod === 'wallet' && styles.radioActive]}>
                            {paymentMethod === 'wallet' && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'online' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('online')}
                    >
                        <View style={styles.paymentRow}>
                            <View style={[styles.paymentIconBox, paymentMethod === 'online' && { backgroundColor: '#E0E7FF' }]}>
                                <CreditCard size={20} color={paymentMethod === 'online' ? '#4F46E5' : Colors.textLight} />
                            </View>
                            <Text style={[styles.paymentText, paymentMethod === 'online' && styles.paymentTextActive]}>Pay Online (Paystack)</Text>
                        </View>
                        <View style={[styles.radio, paymentMethod === 'online' && styles.radioActive]}>
                            {paymentMethod === 'online' && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <View style={styles.paymentRow}>
                            <View style={[styles.paymentIconBox, paymentMethod === 'cash' && { backgroundColor: '#FEF3C7' }]}>
                                <DollarSign size={20} color={paymentMethod === 'cash' ? '#D97706' : Colors.textLight} />
                            </View>
                            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextActive]}>Cash on Delivery</Text>
                        </View>
                        <View style={[styles.radio, paymentMethod === 'cash' && styles.radioActive]}>
                            {paymentMethod === 'cash' && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        {items.map((item, index) => (
                            <View key={index} style={styles.summaryItemRow}>
                                <Text style={styles.summaryItemName} numberOfLines={1}>{item.quantity}x {item.drugName}</Text>
                                <Text style={styles.summaryItemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <View style={styles.summaryFeeRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryFeeRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Grand Total</Text>
                            <Text style={styles.totalValue}>₦{grandTotal.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, (!isValid || loading) && { backgroundColor: '#E5E7EB' }]}
                    onPress={handlePayment}
                    disabled={loading || !isValid}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Place Order • ₦{grandTotal.toLocaleString()}</Text>
                            <ChevronRight size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
        }),
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    shieldBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E5E7EB',
        marginBottom: 8,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
        width: 12,
        height: 12,
    },
    stepText: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '500',
    },
    stepTextActive: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 15,
        marginTop: -18,
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        lineHeight: 18,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    editLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
        }),
        elevation: 2,
    },
    addressRow: {
        flexDirection: 'row',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    addressInput: {
        fontSize: 14,
        color: Colors.textLight,
        lineHeight: 20,
        padding: 0,
    },
    estimateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        marginBottom: 32,
        gap: 8,
    },
    estimateText: {
        fontSize: 13,
        color: '#065F46',
    },
    paymentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
    },
    paymentOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    paymentText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    paymentTextActive: {
        color: Colors.primary,
    },
    walletBalance: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
        marginTop: 2,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    summaryCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
    },
    summaryItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryItemName: {
        fontSize: 14,
        color: Colors.textLight,
        flex: 1,
        marginRight: 16,
    },
    summaryItemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    summaryFeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textLight,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px -10px 10px rgba(0, 0, 0, 0.1)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        }),
        elevation: 10,
    },
    payButton: {
        backgroundColor: Colors.primary,
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    successContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        elevation: 10,
        ...(Platform.OS === 'web' ? {
            boxShadow: `0px 10px 15px ${Colors.primary}4D`,
        } : {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
        }),
    },
    successTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 16,
    },
    successSubtitle: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 24,
    },
    redirectText: {
        marginTop: 16,
        fontSize: 14,
        color: Colors.textLight,
    },
});
