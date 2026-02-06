import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, Star, ShoppingCart, MapPin, Plus, Minus, Heart, ShieldCheck, Truck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { searchDrugs, fetchDrugs, saveItem, removeSavedItem, getSavedItems } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import SmartImage from '../../components/SmartImage';

const { width } = Dimensions.get('window');

export default function MedicineDetailsScreen() {
    const { id, lat, lng } = useLocalSearchParams<{ id: string, lat: string, lng: string }>();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);
    const [drugInfo, setDrugInfo] = useState<any>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentDrugId, setCurrentDrugId] = useState<string | null>(null);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        loadDrugDetails();
    }, [id, lat, lng]);

    const checkFavoriteStatus = async (targetId: string) => {
        try {
            const savedItems = await getSavedItems();
            const isSaved = savedItems.some((item: any) => item.id === targetId);
            setIsFavorite(isSaved);
        } catch (e) {
            console.warn('Failed to check favorite status:', e);
        }
    };

    const handleToggleFavorite = async () => {
        if (!currentDrugId) return;
        try {
            if (isFavorite) {
                await removeSavedItem(currentDrugId);
                setIsFavorite(false);
            } else {
                await saveItem(currentDrugId);
                setIsFavorite(true);
            }
        } catch (e) {
            alert('Failed to update favorites. Please try again.');
        }
    };

    const loadDrugDetails = async () => {
        setLoading(true);
        try {
            let offers = [];


            // 1. Try fetching pharmacy offers if we have location (or use default)
            // Default to Lagos (Ikeja) if no location provided to ensure we get results
            const DEFAULT_LAT = 6.6018;
            const DEFAULT_LNG = 3.3515;

            const latitude = lat ? parseFloat(lat) : DEFAULT_LAT;
            const longitude = lng ? parseFloat(lng) : DEFAULT_LNG;

            if (latitude && longitude) {
                try {
                    offers = await searchDrugs(id || '', latitude, longitude);
                } catch (err) {
                    console.warn('Pharmacy search skipped or failed:', err);
                }
            }

            // 2. If offers found, use them
            if (offers.length > 0) {
                const dId = offers[0].drugId;
                setCurrentDrugId(dId);
                checkFavoriteStatus(dId);

                setResults(offers);
                setDrugInfo({
                    name: offers[0].drugName,
                    description: offers[0].description || 'High-quality medication for effective treatment. Please consult with your pharmacist for dosage and administration instructions.',
                    image: offers[0].image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop',
                    dosage: '500mg',
                    packSize: '10 Tablets',
                });
            } else {
                // 3. Fallback: Fetch from Master Catalog
                const masterData = await fetchDrugs({ search: id });

                if (masterData && masterData.length > 0) {
                    const match = masterData.find((d: any) => d.name.toLowerCase() === (id?.toLowerCase() || '')) || masterData[0];
                    setCurrentDrugId(match.id);
                    checkFavoriteStatus(match.id);

                    setDrugInfo({
                        name: match.name,
                        description: match.description || 'High-quality medication for effective treatment.',
                        image: match.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop',
                        dosage: 'N/A',
                        packSize: 'N/A',
                    });
                    setResults([]);
                }
            }
        } catch (error) {
            console.error('Failed to load drug details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (offer: any) => {
        addItem({
            drugId: offer.drugId,
            drugName: offer.drugName,
            pharmacyName: offer.pharmacyName,
            pharmacyId: offer.pharmacyId,
            pharmacyAddress: offer.pharmacyAddress,
            price: offer.price,
            quantity: quantity,
            image: drugInfo?.image
        });
        alert(`Added ${quantity} x ${offer.drugName} to cart!`);
    };

    const renderPharmacyItem = ({ item, index }: { item: any, index: number }) => (
        <View key={index} style={[styles.pharmacyCard, index === 0 && styles.featuredPharmacy]}>
            <SmartImage uri={item.pharmacyImage} category="PHARMACY" style={styles.pharmacyImage} iconSize={24} />

            <View style={styles.cardContent}>
                {/* Top Row: Name and Price */}
                <View style={styles.cardTopRow}>
                    <View style={styles.nameColumn}>
                        <View style={styles.nameRow}>
                            <Text style={styles.pharmacyName} numberOfLines={1}>{item.pharmacyName}</Text>
                            {index === 0 && (
                                <View style={styles.bestPriceBadge}>
                                    <Text style={styles.bestPriceText}>Best Value</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.ratingRow}>
                            <Star size={12} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '4.5'} ({item.ratingCount || '1.2k'})</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.distanceText}>{item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : '0.5 km'}</Text>
                        </View>
                    </View>

                    <Text style={styles.priceText}>₦{item.price.toLocaleString()}</Text>
                </View>

                {/* Bottom Row: Badges and Add Button */}
                <View style={styles.cardBottomRow}>
                    <View style={styles.badgeGroup}>
                        <View style={styles.deliveryBadge}>
                            <Truck size={12} color={Colors.textLight} />
                            <Text style={styles.deliveryText}>30 min</Text>
                        </View>

                        {item.savingsPercentage > 0 && (
                            <View style={styles.savingsPill}>
                                <Text style={styles.savingsText}>Save ₦{item.savingsAmount.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToCart(item)}
                    >
                        <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!drugInfo) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.text }}>Drug not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen
                options={{
                    title: drugInfo?.name || 'Medicine Details',
                    headerShown: true,
                    headerTransparent: false,
                    headerStyle: { backgroundColor: Colors.white },
                    headerTintColor: Colors.primary,
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header (Hidden when Stack header is shown, but keep logic if needed) */}
                {/* 
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Medicine Details</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                            <Heart size={24} color={isFavorite ? Colors.error : Colors.text} fill={isFavorite ? Colors.error : 'none'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/cart')}>
                            <ShoppingCart size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                </View> 
                */}

                {/* Drug Image Section */}
                <View style={styles.imageSection}>
                    <View style={styles.imageBackground}>
                        <SmartImage uri={drugInfo.image} category={drugInfo.category || 'TABLET'} style={styles.drugImage} iconSize={64} />
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <View style={styles.mainInfo}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.drugName}>{drugInfo.name}</Text>
                            <Text style={styles.pillInfo}>{drugInfo.dosage} • {drugInfo.packSize}</Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={16} color={Colors.primary} />
                            <Text style={styles.verifiedText}>GMP Verified</Text>
                        </View>
                    </View>

                    <Text style={styles.descriptionTitle}>About Medicine</Text>
                    <Text style={styles.drugDescription}>{drugInfo.description}</Text>

                    {results.length > 0 && results[0].marketAvg > 0 && (
                        <View style={styles.savingsCard}>
                            <View style={styles.savingsHeader}>
                                <Text style={styles.savingsTitle}>Market Comparison</Text>
                                <View style={styles.savingsBadge}>
                                    <Text style={styles.savingsBadgeText}>
                                        Save up to {Math.max(...results.map(r => r.savingsPercentage))}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.comparisonRow}>
                                <View style={styles.comparisonItem}>
                                    <Text style={styles.comparisonLabel}>Average Price</Text>
                                    <Text style={styles.comparisonValueST}>₦{results[0].marketAvg.toLocaleString()}</Text>
                                </View>
                                <View style={styles.dividerV} />
                                <View style={styles.comparisonItem}>
                                    <Text style={styles.comparisonLabel}>Our Best Deal</Text>
                                    <Text style={styles.comparisonValue}>₦{Math.min(...results.map(r => r.price)).toLocaleString()}</Text>
                                </View>
                            </View>
                            <View style={styles.savingsFooter}>
                                <View style={styles.footerIcon}>
                                    <ShieldCheck size={12} color="#059669" />
                                </View>
                                <Text style={styles.footerText}>Found the cheapest price for you in your area.</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionHeading}>Quantity needed</Text>
                        <View style={styles.counter}>
                            <TouchableOpacity
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                style={[styles.countBtn, quantity === 1 && styles.countBtnDisabled]}
                            >
                                <Minus size={20} color={quantity === 1 ? '#CCC' : Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.countText}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.countBtn}>
                                <Plus size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.comparisonHeader}>
                        <Text style={styles.sectionHeading}>Available Prices Nearby</Text>
                        <Text style={styles.resultCount}>{results.length} pharmacies</Text>
                    </View>

                    {results.length > 0 ? (
                        <View style={styles.pharmacyList}>
                            {results.map((item, index) => renderPharmacyItem({ item, index }))}
                        </View>
                    ) : (
                        <View style={styles.noResults}>
                            <Text style={styles.noResultsText}>No pharmacies found with this drug nearby.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomSpace} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: 0, // Removed top padding since header is now shown via Stack
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        height: 280,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    imageBackground: {
        width: width * 0.8,
        height: width * 0.6,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        }),
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    drugImage: {
        width: '100%',
        height: '100%',
    },
    detailsSection: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
    },
    mainInfo: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
    },
    drugName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    pillInfo: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#065F46',
        marginLeft: 4,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    drugDescription: {
        fontSize: 15,
        color: Colors.textLight,
        lineHeight: 24,
        marginBottom: 32,
    },
    savingsCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    savingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    savingsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#166534',
    },
    savingsBadge: {
        backgroundColor: '#DCFCE7',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    savingsBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#15803d',
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    comparisonItem: {
        alignItems: 'center',
    },
    comparisonLabel: {
        fontSize: 10,
        color: Colors.textLight,
        marginBottom: 4,
    },
    comparisonValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    comparisonValueST: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textLight,
        textDecorationLine: 'line-through',
    },
    dividerV: {
        width: 1,
        height: '60%',
        backgroundColor: '#F3F4F6',
    },
    savingsFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    footerText: {
        fontSize: 11,
        color: '#166534',
        opacity: 0.8,
    },
    quantitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 20,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    countBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBtnDisabled: {
        opacity: 0.5,
    },
    countText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        paddingHorizontal: 16,
    },
    comparisonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    resultCount: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    pharmacyList: {
        gap: 16,
    },
    pharmacyCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
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
    featuredPharmacy: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
    },
    pharmacyImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    nameColumn: {
        flex: 1,
        marginRight: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Align bottom to keep add button grounded
    },
    badgeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 4,
    },
    deliveryText: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '500',
    },
    savingsPill: {
        backgroundColor: '#F0FDF4',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    savingsText: {
        fontSize: 11,
        color: '#166534',
        fontWeight: 'bold',
    },
    dot: {
        fontSize: 12,
        color: '#D1D5DB',
        marginHorizontal: 6,
    },
    // Keep essential styles
    pharmacyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        flexShrink: 1,
    },
    bestPriceBadge: {
        backgroundColor: Colors.primary,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    bestPriceText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    ratingText: {
        fontSize: 12,
        color: Colors.textLight,
        marginLeft: 4,
    },
    distanceText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    noResults: {
        padding: 40,
        alignItems: 'center',
    },
    noResultsText: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 14,
    },
    bottomSpace: {
        height: 40,
    },
});
