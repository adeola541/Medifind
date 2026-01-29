import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, ShieldCheck, ChevronRight, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PermissionsScreen() {
    const router = useRouter();
    const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | 'undetermined'>('undetermined');
    const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        setLocationStatus(locStatus);
        // Note: expo-notifications removed for Expo Go compatibility in SDK 54
        // We will default to undetermined and let user "toggle" it visually for demo
    };

    const requestLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationStatus(status);
        if (status !== 'granted') {
            Alert.alert('Location Permission', 'We need your location to find the nearest pharmacies to you.');
        }
    };

    const requestNotifications = async () => {
        // Mock notification request for Expo Go demo
        setNotificationStatus('granted');
    };

    const handleContinue = () => {
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Illustration/Icon Header */}
                <View style={styles.header}>
                    <View style={styles.illustrationCircle}>
                        <ShieldCheck size={64} color={Colors.primary} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.title}>Your Privacy Matters</Text>
                    <Text style={styles.subtitle}>
                        To provide the best healthcare experience, we need a few permissions.
                    </Text>
                </View>

                {/* Permission Cards */}
                <View style={styles.cardsContainer}>
                    <TouchableOpacity
                        style={[styles.permissionCard, locationStatus === 'granted' && styles.cardActive]}
                        onPress={requestLocation}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, locationStatus === 'granted' && styles.iconBoxActive]}>
                            <MapPin size={24} color={locationStatus === 'granted' ? '#FFFFFF' : Colors.primary} />
                        </View>
                        <View style={styles.permissionInfo}>
                            <Text style={styles.permissionTitle}>Location Access</Text>
                            <Text style={styles.permissionDesc}>Find pharmacies and hospitals near your current position.</Text>
                        </View>
                        {locationStatus === 'granted' ? (
                            <View style={styles.statusBadge}>
                                <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            </View>
                        ) : (
                            <ChevronRight size={20} color={Colors.textLight} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.permissionCard, notificationStatus === 'granted' && styles.cardActive]}
                        onPress={requestNotifications}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, notificationStatus === 'granted' && styles.iconBoxActive]}>
                            <Bell size={24} color={notificationStatus === 'granted' ? '#FFFFFF' : Colors.primary} />
                        </View>
                        <View style={styles.permissionInfo}>
                            <Text style={styles.permissionTitle}>Notifications</Text>
                            <Text style={styles.permissionDesc}>Stay updated on your orders and healthy refill reminders.</Text>
                        </View>
                        {notificationStatus === 'granted' ? (
                            <View style={styles.statusBadge}>
                                <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            </View>
                        ) : (
                            <ChevronRight size={20} color={Colors.textLight} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
                        <Text style={styles.primaryBtnText}>Continue</Text>
                        <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
                        <Text style={styles.skipBtnText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    illustrationCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    cardsContainer: {
        gap: 16,
        marginTop: 20,
    },
    permissionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    cardActive: {
        backgroundColor: '#FFFFFF',
        borderColor: Colors.primary,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        } : {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        }),
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
        }),
    },
    iconBoxActive: {
        backgroundColor: Colors.primary,
    },
    permissionInfo: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    permissionDesc: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 2,
        lineHeight: 18,
    },
    statusBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: `0px 10px 15px ${Colors.primary}33`,
        } : {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
        }),
        gap: 8,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    skipBtn: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textLight,
    },
});
