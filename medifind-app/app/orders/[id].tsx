import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, MapPin, CreditCard, Package, Clock, CheckCircle2, XCircle, AlertCircle, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { getOrderDetails } from '../../services/api';
import SmartImage from '../../components/SmartImage';

const { width } = Dimensions.get('window');

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'COMPLETED':
        case 'DELIVERED':
            return { color: '#059669', bg: '#D1FAE5', icon: CheckCircle2, label: 'Delivered' };
        case 'PENDING':
            return { color: '#D97706', bg: '#FEF3C7', icon: Clock, label: 'Pending' };
        case 'PROCESSING':
            return { color: '#2563EB', bg: '#DBEAFE', icon: AlertCircle, label: 'Processing' };
        case 'CANCELLED':
            return { color: '#DC2626', bg: '#FEE2E2', icon: XCircle, label: 'Cancelled' };
        default:
            return { color: '#6B7280', bg: '#F3F4F6', icon: Package, label: status };
    }
};

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const data = await getOrderDetails(id!);
            setOrder(data);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50, color: Colors.text }}>Order not found</Text>
            </View>
        );
    }

    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order Status Header */}
                <View style={styles.statusSection}>
                    <View style={[styles.statusIconLarge, { backgroundColor: statusInfo.bg }]}>
                        <StatusIcon size={32} color={statusInfo.color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    <Text style={styles.orderNumber}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                {/* Items Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Items Ordered</Text>
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{order.items?.length || 0}</Text>
                        </View>
                    </View>
                    <View style={styles.itemsList}>
                        {order.items.map((item: any) => (
                            <View key={item.id} style={styles.itemCard}>
                                <SmartImage
                                    uri={item.drug?.image}
                                    category={item.drug?.category || 'TABLET'}
                                    style={styles.itemImage}
                                    iconSize={24}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.drug?.name || 'Unknown Medicine'}</Text>
                                    <Text style={styles.itemMeta}>{item.quantity} x ₦{parseFloat(item.price).toLocaleString()}</Text>
                                </View>
                                <Text style={styles.itemTotal}>₦{(parseFloat(item.price) * item.quantity).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pharmacy Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pharmacy Details</Text>
                    <View style={styles.detailCard}>
                        <View style={styles.pharmacyInfoMain}>
                            <View style={styles.pharmacyAvatar}>
                                <Package size={20} color={Colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pharmacyName}>{order.pharmacy?.name}</Text>
                                <Text style={styles.pharmacyAddress} numberOfLines={2}>{order.pharmacy?.address}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.contactRow}>
                            <TouchableOpacity style={styles.contactBtn}>
                                <Phone size={16} color={Colors.primary} />
                                <Text style={styles.contactBtnText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.contactBtn}>
                                <Mail size={16} color={Colors.primary} />
                                <Text style={styles.contactBtnText}>Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Shipping & Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery & Payment</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <MapPin size={16} color={Colors.primary} />
                                <Text style={styles.infoCardTitle}>Delivery Address</Text>
                            </View>
                            <Text style={styles.infoCardValue}>123 Medical Drive, Victoria Island, Lagos</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <CreditCard size={16} color={Colors.primary} />
                                <Text style={styles.infoCardTitle}>Payment Method</Text>
                            </View>
                            <Text style={styles.infoCardValue}>Credit Card (**** 4242)</Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>₦{parseFloat(order.totalAmount).toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={styles.summaryValue}>₦500</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₦{(parseFloat(order.totalAmount) + 500).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.helpButton}>
                    <AlertCircle size={20} color={Colors.textLight} />
                    <Text style={styles.helpButtonText}>Need help with this order?</Text>
                    <ChevronRight size={16} color={Colors.textLight} />
                </TouchableOpacity>

            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        paddingBottom: 40,
    },
    statusSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#F9FAFB',
    },
    statusIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 8,
    },
    dateText: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    itemCountBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    itemCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textLight,
    },
    itemsList: {
        gap: 12,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
    },
    itemMeta: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 8,
    },
    detailCard: {
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
        }),
    },
    pharmacyInfoMain: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    pharmacyAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    pharmacyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    pharmacyAddress: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 16,
    },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
    },
    contactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        gap: 8,
    },
    contactBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    infoGrid: {
        gap: 12,
    },
    infoCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoCardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCardValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
        lineHeight: 20,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
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
    summaryDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 32,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        gap: 12,
    },
    helpButtonText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
});
