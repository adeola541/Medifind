import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Trash2, Heart } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { getSavedItems, removeSavedItem } from '../../services/api';
import { useCartStore } from '../../store/cartStore';

export default function SavedItemsScreen() {
    const router = useRouter();
    const { addItem } = useCartStore();
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = async () => {
        try {
            setLoading(true);
            const data = await getSavedItems();
            // Backend returns array of Drug objects directly
            setSavedItems(data);
        } catch (error) {
            console.error('Failed to fetch saved items', error);
            Alert.alert('Error', 'Could not load your saved items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    const handleRemove = async (drugId: string) => {
        try {
            await removeSavedItem(drugId);
            setSavedItems(prev => prev.filter(item => item.id !== drugId));
        } catch (error) {
            Alert.alert('Error', 'Could not remove item.');
        }
    };

    const handleItemPress = (item: any) => {
        if (item.id) {
            router.push({ pathname: '/drug/[id]', params: { id: item.id } });
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const drug = item; // Access directly as backend returns Drug[]
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleItemPress(drug)}
            >
                <Image
                    source={{ uri: drug.image || 'https://via.placeholder.com/100' }}
                    style={styles.drugImage}
                />
                <View style={styles.cardContent}>
                    <Text style={styles.drugName} numberOfLines={1}>{drug.name || 'Unknown Drug'}</Text>
                    <Text style={styles.manufacturer}>{drug.manufacturer || 'Generic'}</Text>
                    <Text style={styles.price}>{drug.avgPrice ? `~₦${Number(drug.avgPrice).toLocaleString()}` : 'Price varies'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(drug.id)}
                >
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Items</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={savedItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Heart size={64} color="#E5E7EB" />
                            <Text style={styles.emptyText}>No saved items yet</Text>
                            <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
                                <Text style={styles.shopButtonText}>Explore Drugs</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    drugImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
    },
    drugName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    manufacturer: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    removeBtn: {
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
        marginBottom: 24,
    },
    shopButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    shopButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
