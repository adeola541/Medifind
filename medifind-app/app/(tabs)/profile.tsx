import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, ShoppingBag, Heart, Settings, HelpCircle, LogOut, ChevronRight, MapPin, Bell, CreditCard, Shield } from 'lucide-react-native';

const MENU_GROUPS = [
    {
        title: 'Account',
        items: [
            { icon: User, label: 'Personal Information', route: '/profile/edit', color: '#3B82F6' },
            { icon: CreditCard, label: 'My Wallet', route: '/wallet', color: '#6366F1' },
            { icon: ShoppingBag, label: 'My Orders', route: '/orders', color: '#10B981' },
            { icon: Heart, label: 'Saved Items', route: '/saved', color: '#EF4444' },
            { icon: MapPin, label: 'Delivery Addresses', route: '/addresses', color: '#F59E0B' },
        ]
    },
    {
        title: 'Settings',
        items: [
            { icon: Bell, label: 'Notifications', route: '/settings/notifications', color: '#8B5CF6' },
            { icon: Shield, label: 'Privacy & Security', route: '/settings/privacy', color: '#6366F1' },
        ]
    },
    {
        title: 'Support',
        items: [
            { icon: HelpCircle, label: 'Help & FAQ', route: '/support', color: '#6B7280' },
        ]
    }
];

import { getOrders, getSavedItems } from '../../services/api';

export default function ProfileScreen() {
    const { signOut, user } = useAuthStore((state: any) => state);
    const router = useRouter();
    const [stats, setStats] = React.useState({ orders: 0, saved: 0 });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const orders = await getOrders();
                const saved = await getSavedItems();
                setStats({
                    orders: Array.isArray(orders) ? orders.length : 0,
                    saved: Array.isArray(saved) ? saved.length : 0
                });
            } catch (e) {
                console.warn('Failed to fetch profile stats:', e);
                setStats({ orders: 0, saved: 0 });
            }
        };
        fetchStats();
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/welcome');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Settings size={22} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <User size={12} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@medifind.com'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.orders}</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.saved}</Text>
                            <Text style={styles.statLabel}>Saved</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Groups */}
                {MENU_GROUPS.map((group, gIndex) => (
                    <View key={gIndex} style={styles.menuGroup}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.menuList}>
                            {group.items.map((item, iIndex) => (
                                <TouchableOpacity
                                    key={iIndex}
                                    style={[
                                        styles.menuItem,
                                        iIndex === group.items.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() => {
                                        if (item.route === '/orders' || item.route === '/profile/edit' || item.route === '/wallet' || item.route === '/saved' || item.route === '/addresses') {
                                            router.push(item.route as any);
                                        } else {
                                            alert('Coming soon!');
                                        }
                                    }}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                                    </View>
                                    <ChevronRight size={18} color="#D1D5DB" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.2 (2024)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
        }),
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    editBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 16,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
        }),
    },
    statItem: {
        alignItems: 'center',
        marginHorizontal: 16,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    menuGroup: {
        paddingHorizontal: 24,
        marginTop: 32,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textLight,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginTop: 40,
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EF4444',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#D1D5DB',
        marginTop: 24,
    },
});
