import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ChevronRight, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
    const router = useRouter();
    const { items: cartItems, updateQuantity, removeItem, getTotal } = useCartStore();

    const subtotal = getTotal();
    const deliveryFee = cartItems.length > 0 ? 500 : 0;
    const total = subtotal + deliveryFee;

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemMain}>
                <Image source={{ uri: item.image || 'https://placehold.co/150x150/png' }} style={styles.itemImage} resizeMode="contain" />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.drugName}</Text>
                    <Text style={styles.itemPharmacy} numberOfLines={1}>Sold by {item.pharmacyName}</Text>
                    <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                    <Trash2 size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
            <View style={styles.itemFooter}>
                <View style={styles.counter}>
                    <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        style={[styles.countBtn, item.quantity === 1 && styles.countBtnDisabled]}
                        disabled={item.quantity === 1}
                    >
                        <Minus size={14} color={item.quantity === 1 ? '#D1D5DB' : Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.countText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.countBtn}>
                        <Plus size={14} color={Colors.text} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>₦{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cart</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartItems.length}</Text>
                </View>
            </View>

            {cartItems.length > 0 ? (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.infoBox}>
                                <Info size={16} color={Colors.primary} />
                                <Text style={styles.infoText}>Items from different pharmacies will be split into separate orders.</Text>
                            </View>
                        }
                    />

                    <View style={styles.footer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Grand Total</Text>
                            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={() => router.push('/checkout')}
                        >
                            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            <ChevronRight size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <ShoppingBag size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Looks like you haven't added anything to your cart yet.</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Text style={styles.shopButtonText}>Explore Medicines</Text>
                    </TouchableOpacity>
                </View>
            )
            }
        </SafeAreaView >
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
    },
    badge: {
        backgroundColor: '#D1FAE5',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#065F46',
        flex: 1,
        lineHeight: 18,
    },
    cartItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
        }),
        elevation: 2,
    },
    itemMain: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    itemPharmacy: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: 4,
    },
    removeBtn: {
        padding: 4,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB',
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    countBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countBtnDisabled: {
        opacity: 0.5,
    },
    countText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginHorizontal: 12,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 130, // Extra padding for tab bar
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px -10px 10px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
        }),
        elevation: 10,
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
    totalRow: {
        marginTop: 8,
        marginBottom: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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
    checkoutButton: {
        backgroundColor: Colors.primary,
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        elevation: 4,
        ...(Platform.OS === 'web' ? {
            boxShadow: `0px 4px 8px ${Colors.primary}4D`,
        } : {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
        }),
    },
    checkoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    shopButton: {
        paddingHorizontal: 40,
        paddingVertical: 14,
        backgroundColor: Colors.primary,
        borderRadius: 16,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
