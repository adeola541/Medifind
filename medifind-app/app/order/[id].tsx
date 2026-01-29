import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { CheckCircle, Clock, MapPin, Phone, MessageSquare, ChevronLeft, Truck, Package, Bike, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrder } from '../../services/api';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const TRACKING_STEPS = [
    { title: 'Order Placed', desc: 'We have received your order.', status: 'PENDING' },
    { title: 'Confirmed', desc: 'Pharmacy has confirmed your order.', status: 'CONFIRMED' },
    { title: 'Rider Assigned', desc: 'Samuel has accepted your delivery.', status: 'RIDER' },
    { title: 'Out for Delivery', desc: 'Rider is on the way to you.', status: 'DELIVERY' },
    { title: 'Delivered', desc: 'Package delivered successfully.', status: 'COMPLETED' },
];

export default function OrderTrackingScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            const data = await fetchOrder(id as string);
            setOrder(data);

            // Simulation Logic based on Time
            // For demo purposes, we can accelerate or force steps based on "Simulation"
            const created = new Date(data.createdAt).getTime();
            const now = Date.now();
            const diffMins = (now - created) / 1000 / 60;

            if (data.status === 'COMPLETED') {
                setCurrentStep(4);
            } else {
                // Accelerate simulation: 
                // 0-0.5m: Placed
                // 0.5-1m: Confirmed
                // 1-2m: Rider
                // 2m+: Delivery
                if (diffMins > 2) setCurrentStep(3);
                else if (diffMins > 1) setCurrentStep(2);
                else if (diffMins > 0.5) setCurrentStep(1);
                else setCurrentStep(0);
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load order tracking.');
        } finally {
            setLoading(false);
        }
    };

    // Live update for simulation effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (!order) return;
            const created = new Date(order.createdAt).getTime();
            const now = Date.now();
            const diffMins = (now - created) / 1000 / 60;

            if (currentStep < 4) {
                if (diffMins > 2 && currentStep < 3) setCurrentStep(3);
                else if (diffMins > 1 && currentStep < 2) setCurrentStep(2);
                else if (diffMins > 0.5 && currentStep < 1) setCurrentStep(1);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [order, currentStep]);


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!order) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order.id.substring(0, 8)}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Map Placeholder */}
                <View style={styles.mapContainer}>
                    {/* Simulated Map Visuals */}
                    <View style={[styles.mapBackground, { backgroundColor: '#E5F3FD' }]}>
                        <View style={styles.road} />
                        <View style={[styles.road, { transform: [{ rotate: '90deg' }], width: '100%', top: 100, left: 0 }]} />

                        {/* Pharmacy Pin */}
                        <View style={{ position: 'absolute', top: 40, left: 60, alignItems: 'center' }}>
                            <View style={[styles.pin, { backgroundColor: Colors.primary }]}>
                                <Package size={14} color="white" />
                            </View>
                            <Text style={styles.pinLabel}>Pharmacy</Text>
                        </View>

                        {/* Rider - Animated Position Simulation (simplified as static for now, or use state) */}
                        <View style={{ position: 'absolute', top: 100, left: width / 2, alignItems: 'center' }}>
                            <View style={[styles.pin, { backgroundColor: '#F59E0B', borderRadius: 20, padding: 8 }]}>
                                <Bike size={20} color="white" />
                            </View>
                        </View>

                        {/* Destination Pin */}
                        <View style={{ position: 'absolute', bottom: 60, right: 60, alignItems: 'center' }}>
                            <View style={[styles.pin, { backgroundColor: '#EF4444' }]}>
                                <MapPin size={14} color="white" />
                            </View>
                            <Text style={styles.pinLabel}>You</Text>
                        </View>
                    </View>

                    {/* Status Overlay */}
                    <View style={styles.statusCard}>
                        <Text style={styles.statusTitle}>
                            {currentStep === 4 ? 'Arrived' : currentStep === 3 ? 'Arriving in 15 mins' : TRACKING_STEPS[currentStep].title}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Rider Info (Visible only if Rider Assigned or later) */}
                {currentStep >= 2 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Agent</Text>
                        <View style={styles.riderCard}>
                            <View style={styles.riderAvatar}>
                                <User size={24} color={Colors.text} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.riderName}>Samuel Okon</Text>
                                <Text style={styles.riderBike}>Bajaj Boxer • LAG-123-XY</Text>
                            </View>
                            <TouchableOpacity style={styles.iconButton} onPress={() => Linking.openURL('tel:123')}>
                                <Phone size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <MessageSquare size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Tracking Steps */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.timeline}>
                        {TRACKING_STEPS.map((step, index) => {
                            const isActive = index <= currentStep;
                            const isLast = index === TRACKING_STEPS.length - 1;
                            return (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.dot, isActive && styles.activeDot]}>
                                            {isActive && <CheckCircle size={12} color="white" />}
                                        </View>
                                        {!isLast && <View style={[styles.line, isActive && index < currentStep && styles.activeLine]} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[styles.stepTitle, isActive && styles.activeStepTitle]}>{step.title}</Text>
                                        <Text style={styles.stepDesc}>{step.desc}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Order Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {order.items && order.items.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.qtyBadge}>{item.quantity}x</Text>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.itemName}>{item.drug?.name || 'Medication'}</Text>
                                {/* <Text style={styles.itemPharmacy}>Sold by {order.pharmacy?.name}</Text> */}
                            </View>
                            <Text style={styles.itemPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalAmount}>₦{parseFloat(order.totalAmount).toLocaleString()}</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },

    mapContainer: { height: 250, width: '100%', position: 'relative', marginBottom: 20 },
    mapBackground: { width: '100%', height: '100%', overflow: 'hidden' },
    road: { position: 'absolute', backgroundColor: 'white', height: 20, width: 300, top: 120, left: 50, borderRadius: 10 },
    pin: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    pinLabel: { fontSize: 10, fontWeight: 'bold', color: Colors.text, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 4, borderRadius: 4 },

    statusCard: {
        position: 'absolute', bottom: 20, left: 20, right: 20,
        backgroundColor: 'white', borderRadius: 12, padding: 15,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    statusTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
    progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.primary },

    section: { paddingHorizontal: 20, marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },

    riderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    riderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    riderName: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
    riderBike: { fontSize: 13, color: Colors.textLight },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

    timeline: { marginLeft: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 25, position: 'relative' },
    timelineLeft: { alignItems: 'center', marginRight: 15, width: 20 },
    dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    activeDot: { backgroundColor: Colors.primary },
    line: { width: 2, height: 50, backgroundColor: '#E5E7EB', position: 'absolute', top: 20, left: 9 },
    activeLine: { backgroundColor: Colors.primary },
    timelineRight: { flex: 1, paddingBottom: 5 },
    stepTitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
    activeStepTitle: { color: Colors.text, fontWeight: 'bold' },
    stepDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },

    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
    qtyBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 10, fontSize: 12, fontWeight: 'bold' },
    itemName: { fontSize: 15, color: Colors.text },
    itemPrice: { fontSize: 15, fontWeight: 'bold', color: Colors.text },

    footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
    totalText: { fontSize: 18, color: Colors.text },
    totalAmount: { fontSize: 18, fontWeight: 'bold', color: Colors.primary }
});
