import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MapPin, Save, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { updateUserLocation, geocodeAddress } from '../../services/api';

export default function AddressesScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuthStore((state: any) => state);

    // Manage local state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [addressInput, setAddressInput] = useState(user?.address || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!addressInput.trim()) {
            Alert.alert('Error', 'Address cannot be empty');
            return;
        }

        try {
            setLoading(true);

            // 1. Geocode the address to get coords (Best effort)
            let lat = user?.latitude || 6.5244; // Default to existing or Lagos
            let lng = user?.longitude || 3.3792;

            try {
                const geocodeRes = await geocodeAddress(addressInput);
                if (geocodeRes) {
                    if (geocodeRes.latitude !== undefined) lat = Number(geocodeRes.latitude);
                    else if (geocodeRes.lat !== undefined) lat = Number(geocodeRes.lat);

                    if (geocodeRes.longitude !== undefined) lng = Number(geocodeRes.longitude);
                    else if (geocodeRes.lng !== undefined) lng = Number(geocodeRes.lng);
                }
            } catch (geoError) {
                console.log('Geocoding failed or not found, using valid fallback coordinates');
                // Use default Lagos coordinates if user location is null/invalid
                if (!lat || !lng) {
                    lat = 6.5244;
                    lng = 3.3792;
                }
            }

            // 2. Update Backend
            const updatedUser = await updateUserLocation(lat, lng, addressInput);

            // 3. Update Local Store
            updateUser({ ...user, ...updatedUser });

            setIsEditing(false);
            Alert.alert('Success', 'Address updated successfully');
        } catch (error: any) {
            console.error('Update address failed:', error);
            const msg = error.response?.data?.error || error.message || 'Failed to update address';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            setLoading(true);
            await updateUserLocation(0, 0, ''); // Clear it? Or set null? Backend expects string.
            updateUser({ ...user, address: null, latitude: null, longitude: null });
            setAddressInput('');
            setIsEditing(true); // Switch to edit mode since empty
        } catch (error) {
            console.error('Clear address failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery Addresses</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Note about single address */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        Currently, you can only save one primary delivery address.
                        This address will be used as the default for your orders.
                    </Text>
                </View>

                {/* Address Card */}
                {!isEditing && user?.address ? (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.labelRow}>
                                <MapPin size={18} color={Colors.primary} />
                                <Text style={styles.cardLabel}>Home / Primary</Text>
                            </View>
                            {user.latitude ? (
                                <Text style={styles.coordsText}>{user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}</Text>
                            ) : null}
                        </View>

                        <Text style={styles.addressText}>{user.address}</Text>

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => {
                                    setAddressInput(user.address);
                                    setIsEditing(true);
                                }}
                            >
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={handleClear}
                            >
                                <Trash2 size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Edit Form
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>
                                {user?.address ? 'Edit Address' : 'Add New Address'}
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full street address, city, state"
                                value={addressInput}
                                onChangeText={setAddressInput}
                                multiline
                                numberOfLines={3}
                            />

                            <View style={styles.formActions}>
                                {isEditing && user?.address && (
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setIsEditing(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Save size={18} color="#FFF" />
                                            <Text style={styles.saveBtnText}>Save Address</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 20,
    },
    infoBox: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        color: '#1E40AF',
        fontSize: 13,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    coordsText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    addressText: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        marginBottom: 20,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBtn: {
        backgroundColor: '#F3F4F6',
    },
    editBtnText: {
        color: Colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
        width: 40,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 24,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#6B7280',
        fontWeight: '600',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
