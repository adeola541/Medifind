import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Share, Clipboard, Alert, Modal, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Copy, Share2, History, CreditCard, Banknote, ShieldCheck, ChevronRight, Plus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchWallet, simulateWalletTopUp } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

export default function WalletScreen() {
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [topUpModal, setTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpLoading, setTopUpLoading] = useState(false);
    const router = useRouter();

    const loadWalletData = async () => {
        try {
            const data = await fetchWallet();
            setWallet(data);
        } catch (error) {
            console.error('Wallet Load Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleTopUp = async () => {
        if (!topUpAmount || isNaN(Number(topUpAmount))) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        const amount = Number(topUpAmount);
        setTopUpLoading(true);

        try {
            await simulateWalletTopUp(amount);
            setTopUpModal(false);
            setTopUpAmount('');
            Alert.alert('Success', 'Wallet credited successfully!');
            loadWalletData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to top up wallet');
        } finally {
            setTopUpLoading(false);
        }
    };

    useEffect(() => {
        loadWalletData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadWalletData();
    }, []);

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied!', `${label} has been copied to your clipboard.`);
    };

    const handleShare = async () => {
        if (!wallet?.accountNumber) return;
        try {
            await Share.share({
                message: `Pay into my Medifind Wallet:\nBank: ${wallet.bankName}\nAccount: ${wallet.accountNumber}\nName: ${wallet.accountName}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && !wallet) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen
                options={{
                    title: 'My Wallet',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8FAFC' }
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={[Colors.primary, '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.walletIconBg}>
                            <WalletIcon size={24} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardLabel}>Available Balance</Text>
                    </View>

                    <Text style={styles.balanceText}>
                        ₦{parseFloat(wallet?.balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.statusBadge}>
                            <ShieldCheck size={12} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.statusText}>Secure Wallet</Text>
                        </View>

                        <TouchableOpacity style={styles.headerTopUp} onPress={() => setTopUpModal(true)}>
                            <Plus size={16} color="#FFFFFF" />
                            <Text style={styles.headerTopUpText}>Top Up</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Quick Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => setTopUpModal(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Plus size={24} color="#16A34A" />
                        </View>
                        <Text style={styles.actionLabel}>Top Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={onRefresh}>
                        <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                            <ArrowDownLeft size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Withdraw</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FAF5FF' }]}>
                            <Share2 size={24} color="#9333EA" />
                        </View>
                        <Text style={styles.actionLabel}>Share Info</Text>
                    </TouchableOpacity>
                </View>

                {/* Top Up Modal */}
                <Modal
                    visible={topUpModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setTopUpModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Top Up Wallet</Text>
                            <Text style={styles.modalSubtitle}>How much would you like to add?</Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.currencyPrefix}>₦</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={topUpAmount}
                                    onChangeText={setTopUpAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.quickAmounts}>
                                {['1000', '2000', '5000', '10000'].map(amt => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={styles.quickAmtBtn}
                                        onPress={() => setTopUpAmount(amt)}
                                    >
                                        <Text style={styles.quickAmtText}>₦{parseInt(amt).toLocaleString()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        setTopUpModal(false);
                                        setTopUpAmount('');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, topUpLoading && { opacity: 0.7 }]}
                                    onPress={handleTopUp}
                                    disabled={topUpLoading}
                                >
                                    {topUpLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Continue</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Transactions History */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {wallet?.transactions?.length > 0 ? (
                        wallet.transactions.map((tx: any) => (
                            <View key={tx.id} style={styles.txItem}>
                                <View style={[styles.txIcon, { backgroundColor: tx.type === 'DEPOSIT' ? '#F0FDF4' : '#FEF2F2' }]}>
                                    {tx.type === 'DEPOSIT' ? (
                                        <ArrowDownLeft size={20} color="#16A34A" />
                                    ) : (
                                        <ArrowUpRight size={20} color="#DC2626" />
                                    )}
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txTitle}>{tx.description || tx.type}</Text>
                                    <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.txAmountContainer}>
                                    <Text style={[styles.txAmount, { color: tx.type === 'DEPOSIT' ? '#16A34A' : '#DC2626' }]}>
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                                    </Text>
                                    <Text style={styles.txStatus}>{tx.status}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyTransactions}>
                            <History size={40} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        </View>
                    )}
                </View>

                <View style={styles.promoBox}>
                    <LinearGradient
                        colors={['#FFFBEB', '#FEF3C7']}
                        style={styles.promoGradient}
                    >
                        <View style={styles.promoContent}>
                            <Text style={styles.promoTitle}>Earn Cashback!</Text>
                            <Text style={styles.promoDesc}>Get 2% cashback on every medicine purchase using your wallet balance.</Text>
                        </View>
                        <ChevronRight size={20} color="#D97706" />
                    </LinearGradient>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    balanceCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    walletIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
    },
    balanceText: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
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
    seeAll: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 16,
    },
    depositCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    bankInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bankLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    bankValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    accInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        letterSpacing: 1,
    },
    accName: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    loadingAcc: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textLight,
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    errorSubtext: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    txDate: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    txAmountContainer: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    txStatus: {
        fontSize: 10,
        color: Colors.textLight,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    emptyTransactions: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        color: Colors.textLight,
        fontSize: 15,
    },
    promoBox: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 8,
    },
    promoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 4,
    },
    promoDesc: {
        fontSize: 13,
        color: '#B45309',
        lineHeight: 18,
    },
    headerTopUp: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    headerTopUpText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: 24,
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
        justifyContent: 'center',
    },
    quickAmtBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quickAmtText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textLight,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: Colors.primary,
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
