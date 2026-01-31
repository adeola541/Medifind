import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, Star, MapPin, Phone, Globe, Clock, Navigation, ShieldCheck, CheckCircle2, ShoppingBag, ChevronRight, Plus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchPharmacyById, fetchPharmacyReviews } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { LinearGradient } from 'expo-linear-gradient';
import MapComponent from '../../components/MapComponent';
import SmartImage from '../../components/SmartImage';

const { width } = Dimensions.get('window');

export default function PharmacyDetailsScreen() {
    const { id, name, address, latitude, longitude, image, rating, isPartner } = useLocalSearchParams<{
        id: string,
        name?: string,
        address?: string,
        latitude?: string,
        longitude?: string,
        image?: string,
        rating?: string,
        isPartner?: string
    }>();

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [pharmacy, setPharmacy] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        loadPharmacyDetails();
        loadReviews();
    }, [id]);

    const loadPharmacyDetails = async () => {
        setLoading(true);
        try {
            const data = await fetchPharmacyById(id);
            setPharmacy(data);
        } catch (error) {
            console.log('Pharmacy not in DB, using passed params');
            // Mock data for non-partners using passed params
            setPharmacy({
                id,
                name: name || 'Pharmacy Details',
                address: address || 'Address not available',
                latitude: latitude ? parseFloat(latitude) : 0,
                longitude: longitude ? parseFloat(longitude) : 0,
                image: image || 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=800&q=80',
                rating: rating ? parseFloat(rating) : 4.5,
                ratingCount: 120,
                isPartner: isPartner === 'true',
                phone: '+234 800 MEDIFIND',
                hours: '8:00 AM - 10:00 PM',
                drugs: [] // Non-partners have no inventory in our system
            });
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            const data = await fetchPharmacyReviews(id);
            setReviews(data);
        } catch (error) {
            console.warn('Failed to load reviews:', error);
        }
    };

    const openDirections = () => {
        if (!pharmacy?.latitude || !pharmacy?.longitude) return;

        const label = pharmacy.name;
        const lat = pharmacy.latitude;
        const lng = pharmacy.longitude;

        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${lat},${lng}`,
            android: `geo:0,0?q=${lat},${lng}(${label})`,
            web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        });

        if (url) Linking.openURL(url);
    };

    const renderDrugItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.drugCard}
            onPress={() => router.push({
                pathname: `/drug/${item.drug.name}`,
                params: { lat: pharmacy.latitude, lng: pharmacy.longitude }
            } as any)}
        >
            <SmartImage
                uri={item.drug.image}
                category={item.drug.category}
                style={styles.drugImage}
                iconSize={32}
            />
            <View style={styles.drugInfo}>
                <Text style={styles.drugName} numberOfLines={1}>{item.drug.name}</Text>
                <Text style={styles.drugCategory}>{item.drug.category || 'Medication'}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.drugPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
                    {item.inStock ? (
                        <TouchableOpacity
                            style={styles.addSmallBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                addItem({
                                    drugId: item.drug.id,
                                    drugName: item.drug.name,
                                    pharmacyId: pharmacy.id,
                                    pharmacyName: pharmacy.name,
                                    price: parseFloat(item.price),
                                    quantity: 1,
                                    image: item.drug.image
                                });
                            }}
                        >
                            <Plus size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.outOfStock}>Out of Stock</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && !pharmacy) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Stack.Screen
                options={{
                    title: pharmacy?.name || 'Pharmacy Details',
                    headerShown: true,
                    headerTransparent: false,
                    headerStyle: { backgroundColor: Colors.white },
                    headerTintColor: Colors.primary,
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: pharmacy?.image }} style={styles.headerImage} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.contentCard}>
                    <View style={styles.mainInfo}>
                        <View style={styles.titleRow}>
                            <Text style={styles.name}>{pharmacy?.name}</Text>
                            {pharmacy?.isPartner && (
                                <View style={styles.partnerBadge}>
                                    <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={3} />
                                    <Text style={styles.partnerText}>Partner</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.ratingRow}>
                            <Text style={styles.ratingCount}>({pharmacy?.ratingCount || reviews.length || '0'} reviews)</Text>
                        </View>

                        {(pharmacy?.latitude || pharmacy?.longitude) && (
                            <View style={{ marginTop: 16 }}>
                                <MapComponent
                                    latitude={pharmacy.latitude}
                                    longitude={pharmacy.longitude}
                                    markers={[{
                                        id: pharmacy.id,
                                        latitude: pharmacy.latitude,
                                        longitude: pharmacy.longitude,
                                        title: pharmacy.name,
                                        description: pharmacy.address,
                                        isPartner: pharmacy.isPartner
                                    }]}
                                    height={150}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.detailsList}>
                        <View style={styles.detailItem}>
                            <MapPin size={20} color={Colors.primary} />
                            <Text style={styles.detailText}>{pharmacy?.address}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Clock size={20} color={Colors.primary} />
                            <Text style={styles.detailText}>{pharmacy?.hours || 'Open 24/7'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Phone size={20} color={Colors.primary} />
                            <Text style={styles.detailText}>{pharmacy?.phone || '+234 800 MEDIFIND'}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.primaryAction} onPress={openDirections}>
                            <Navigation size={20} color="#FFFFFF" />
                            <Text style={styles.primaryActionText}>Get Directions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryAction} onPress={() => Linking.openURL(`tel:${pharmacy?.phone}`)}>
                            <Phone size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Verification Badge */}
                {pharmacy?.isPartner && (
                    <View style={styles.verifiedBox}>
                        <ShieldCheck size={24} color="#059669" />
                        <View style={styles.verifiedTextContainer}>
                            <Text style={styles.verifiedTitle}>Verified Pharmacy</Text>
                            <Text style={styles.verifiedDesc}>This pharmacy is part of our trusted network. Medicines are 100% authentic.</Text>
                        </View>
                    </View>
                )}

                {/* Available Drugs Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Medication</Text>
                        {pharmacy?.isPartner && pharmacy?.drugs?.length > 0 && (
                            <Text style={styles.itemCount}>{pharmacy.drugs.length} items</Text>
                        )}
                    </View>

                    {!pharmacy?.isPartner ? (
                        <View style={styles.nonPartnerEmpty}>
                            <ShoppingBag size={40} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>Inventory not available</Text>
                            <Text style={styles.emptySubtitle}>We don't have real-time inventory for this pharmacy yet. Visit them directly at the address above.</Text>
                        </View>
                    ) : pharmacy?.drugs?.length === 0 ? (
                        <View style={styles.nonPartnerEmpty}>
                            <ShoppingBag size={40} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>Nothing in stock</Text>
                            <Text style={styles.emptySubtitle}>This pharmacy hasn't listed any drugs in their inventory yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={pharmacy.drugs}
                            renderItem={renderDrugItem}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.drugsList}
                        />
                    )}
                </View>

                {/* Reviews Section */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.length === 0 ? (
                        <View style={styles.reviewPlaceholder}>
                            <Text style={styles.reviewText}>No reviews available for this location yet.</Text>
                        </View>
                    ) : (
                        reviews.map((rev, index) => (
                            <View key={index} style={styles.reviewPlaceholder}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.avatarPlaceholder} />
                                    <View>
                                        <Text style={styles.reviewerName}>Medifind User</Text>
                                        <View style={styles.miniStars}>
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} color="#F59E0B" fill="#F59E0B" />)}
                                        </View>
                                        <Text style={{ fontSize: 10, color: Colors.textLight }}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>{rev.text}</Text>
                            </View>
                        ))
                    )}
                    <TouchableOpacity style={styles.allReviewsBtn}>
                        <Text style={styles.allReviewsText}>View All Reviews</Text>
                        <ChevronRight size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        height: 280,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentCard: {
        backgroundColor: '#FFFFFF',
        marginTop: -30,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px -10px 20px rgba(0,0,0,0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
        }),
    },
    mainInfo: {
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
        marginRight: 10,
    },
    partnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    partnerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 6,
    },
    ratingCount: {
        fontSize: 14,
        color: Colors.textLight,
        marginLeft: 4,
    },
    detailsList: {
        gap: 16,
        marginBottom: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontSize: 15,
        color: Colors.text,
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryAction: {
        flex: 1,
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryAction: {
        width: 56,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBox: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        marginHorizontal: 24,
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
    },
    verifiedTextContainer: {
        flex: 1,
    },
    verifiedTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#065F46',
    },
    verifiedDesc: {
        fontSize: 13,
        color: '#047857',
        marginTop: 2,
    },
    section: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    itemCount: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '600',
    },
    drugsList: {
        paddingRight: 24,
        gap: 16,
    },
    drugCard: {
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    drugImage: {
        width: '100%',
        height: 100,
        marginBottom: 12,
    },
    drugInfo: {
        gap: 4,
    },
    drugName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
    },
    drugCategory: {
        fontSize: 12,
        color: Colors.textLight,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    drugPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    addSmallBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStock: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: 'bold',
    },
    nonPartnerEmpty: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    reviewPlaceholder: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    miniStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    allReviewsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 8,
        gap: 4,
    },
    allReviewsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
});
