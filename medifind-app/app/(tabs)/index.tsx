import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator, Modal, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Search, MapPin, ChevronRight, Star, Syringe, Droplets, Pill, Eye, Activity, HeartPulse, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Constants, { ExecutionEnvironment } from 'expo-constants';
// import * as Notifications from 'expo-notifications'; // Disabled for Expo Go Android compatibility
let Notifications: any = null;
import { fetchNearbyPharmacies, getOrders, fetchFoursquarePlacesNearby, getEnrichedPharmacies, fetchDrugs, updateUserLocation, geocodeAddress, reverseGeocodeLocation, fetchSuggestions, searchDrugs } from '../../services/api';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo)) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Set notification handler failed or module missing:', e);
  }
}

const CATEGORIES = [
  { id: '1', name: 'Stomach', icon: HeartPulse, color: '#FEF3F2' },
  { id: '2', name: 'Bone', icon: Activity, color: '#F0F9FF' },
  { id: '3', name: 'Eye', icon: Eye, color: '#ECFDF5' },
  { id: '4', name: 'Injection', icon: Syringe, color: '#FFFBEB' },
  { id: '5', name: 'Liquid', icon: Droplets, color: '#EEF2FF' },
  { id: '6', name: 'Tablet', icon: Pill, color: '#FDF2F9' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<string>('Finding location...');
  const [locationCoords, setLocationCoords] = useState<Location.LocationObject | null>(null);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);
  const [exploreDrugs, setExploreDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualLocationModal, setManualLocationModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // NEW SEARCH STATE
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const performSearch = async (query: string) => {
    setLoading(true);
    setIsSearching(true);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions
    try {
      const lat = locationCoords?.coords.latitude;
      const lng = locationCoords?.coords.longitude;
      const results = await searchDrugs(query, lat, lng);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
      Alert.alert('Search Error', 'Could not find medicines.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length === 0) {
      if (isSearching) {
        setIsSearching(false); // Creating a cleaner exit from search mode
      }
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimer) clearTimeout(searchTimer);

    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(text);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    setSearchTimer(timer);
  };

  const renderSearchResultItem = ({ item }: { item: any }) => {
    const isCheapest = searchResults.length > 0 && item.price === Math.min(...searchResults.map(r => r.price));

    return (
      <TouchableOpacity
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 3 },
            web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
          })
        }}
        onPress={() => router.push({
          pathname: `/drug/[id]`,
          params: {
            id: item.drugName,
            lat: locationCoords?.coords.latitude || '',
            lng: locationCoords?.coords.longitude || ''
          }
        })}
      >
        <View style={{ flexDirection: 'row' }}>
          <Image source={{ uri: item.image || 'https://placehold.co/150x150/png' }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text }}>{item.drugName}</Text>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textLight, marginTop: 2 }}>{item.pharmacyName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={{ fontSize: 11, color: Colors.textLight, marginLeft: 4 }}>{item.distanceKm?.toFixed(1)} km away</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isCheapest && <View style={{ backgroundColor: '#FEF3F2', padding: 4, borderRadius: 4, marginBottom: 4 }}><Text style={{ fontSize: 9, color: '#B42318', fontWeight: 'bold' }}>CHEAPEST</Text></View>}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.primary }}>₦{item.price.toLocaleString()}</Text>
            {item.savingsPercentage > 0 && (
              <View style={{ backgroundColor: '#F0FDF4', padding: 4, borderRadius: 4, marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>Save {item.savingsPercentage}%</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let pollingInterval: any = null;
    let lastOrderStatuses: Record<string, string> = {};

    (async () => {
      // Default Lagos coordinates as fallback
      const DEFAULT_LAT = 6.5244;
      const DEFAULT_LNG = 3.3792;

      const updateLocationData = async (loc: Location.LocationObject) => {
        setLocationCoords(loc);

        // PARALLEL OPTIMIZATION: Fetch Geocoding, Pharmacies, and Medicines simultaneously
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        console.log(`[Frontend] Starting parallel fetch for: ${lat}, ${lng}`);

        // Helper to safely handle promises without throwing
        const p = <T,>(promise: Promise<T>): Promise<[T | null, any | null]> =>
          promise
            .then(data => [data, null] as [T, null])
            .catch(err => [null, err] as [null, any]);

        // Fire requests in parallel
        const [
          [addressData, _addressErr],
          [pharmacyRaw, pharmacyErr],
          [drugsData, drugsErr]
        ] = await Promise.all([
          // 1. Geocoding (Skip on Web)
          Platform.OS === 'web' ? Promise.resolve([null, null] as const) : p(reverseGeocodeLocation(lat, lng)),
          // 2. Pharmacies (Foursquare)
          p(fetchFoursquarePlacesNearby(lat, lng)),
          // 3. Drugs (Only fetch if exploreDrugs is empty, or refresh)
          p(fetchDrugs({ category: 'ALL' }))
        ]);

        // --- PROCESS ADDRESS ---
        if (addressData && addressData.length > 0) {
          const { region, country, city } = addressData[0];
          const locStr = (region && country) ? `${region}, ${country}` :
            (city && country) ? `${city}, ${country}` : country || 'Current Location';
          setLocation(locStr);
        } else if (Platform.OS === 'web') {
          setLocation('Lagos, Nigeria (Web)');
        } else {
          setLocation('Current Location');
        }

        // --- PROCESS PHARMACIES ---
        if (pharmacyRaw && pharmacyRaw.length > 0) {
          try {
            // Enrich parallel search results
            const partners = await getEnrichedPharmacies(pharmacyRaw);
            const merged = pharmacyRaw.map((p: any) => {
              const partner = partners.find((pt: any) => pt.foursquare_id === p.fsq_id || pt.name.toLowerCase() === p.name.toLowerCase());
              return {
                ...p,
                id: p.fsq_id || Math.random().toString(),
                name: p.name,
                image: p.image,
                isPartner: !!partner,
                ...(partner && partner),
                distance: p.distance || 0.5,
                rating: partner?.rating || p.rating || 4.5
              };
            });
            merged.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
            setNearbyPharmacies(merged);
          } catch (e) {
            console.warn('Enrichment failed, using raw data');
            setNearbyPharmacies(pharmacyRaw);
          }
        } else {
          // Fallback to Database if Foursquare fails/empty
          try {
            const dbPharmacies = await fetchNearbyPharmacies(lat, lng, 10);
            if (dbPharmacies && dbPharmacies.length > 0) {
              setNearbyPharmacies(dbPharmacies.map((p: any) => ({
                ...p, image: null, isPartner: true, distance: p.distance || 0.5
              })));
            } else {
              setNearbyPharmacies([]);
            }
          } catch (e) {
            setNearbyPharmacies([]);
          }
        }

        // --- PROCESS DRUGS ---
        if (drugsData) {
          setExploreDrugs(drugsData.slice(0, 4));
        }
      };
      let { status: locStatus } = await Location.requestForegroundPermissionsAsync();

      let notifStatus = 'denied';

      if (Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo) && Notifications) {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          notifStatus = status;
        } catch (e) {
          console.warn('Request notification permissions failed:', e);
        }
      }

      // Handle location permission denial - use default Lagos coordinates
      if (locStatus !== 'granted') {
        setLocation('Lagos, Nigeria (Default)');
        // Use default Lagos coordinates to fetch pharmacies
        const defaultLocation = {
          coords: {
            latitude: DEFAULT_LAT,
            longitude: DEFAULT_LNG,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as Location.LocationObject;

        await updateLocationData(defaultLocation);

        // Fetch medicines
        try {
          const drugs = await fetchDrugs({ category: 'ALL' });
          setExploreDrugs(drugs.slice(0, 4));
        } catch (error) {
          console.error('Failed to fetch medicines:', error);
        }
        setLoading(false);
        return;
      }



      // 1. GET INITIAL POSITION (FAST)
      try {
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await updateLocationData(initialLoc);
      } catch (e) {
        console.warn('Initial location fetch failed:', e);
        setLocation('Lagos, Nigeria (Default)');
        // Use default coordinates as fallback
        const defaultLocation = {
          coords: {
            latitude: DEFAULT_LAT,
            longitude: DEFAULT_LNG,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as Location.LocationObject;

        await updateLocationData(defaultLocation);
      }

      // 2. WATCH REAL-TIME LOCATION (only if permission granted)
      if (locStatus === 'granted') {
        try {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 500, // Update every 500 meters to save battery
            },
            updateLocationData
          );
        } catch (e) {
          console.warn('Location watch failed:', e);
        }
      }

      // 3. INITIAL DATA FETCH (Medicines and Orders)
      try {
        const drugs = await fetchDrugs({ category: 'ALL' });
        setExploreDrugs(drugs.slice(0, 4));

        // Initial orders fetch to seed "lastStatus"
        try {
          const initialOrders = await getOrders();
          initialOrders.forEach((o: any) => {
            lastOrderStatuses[o.id] = o.status;
          });
        } catch (orderError) {
          console.warn('Failed to fetch initial orders:', orderError);
          // Continue without orders - user might not be logged in
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      } finally {
        setLoading(false);
      }

      // 4. START ORDER POLLING FOR NOTIFICATIONS
      pollingInterval = setInterval(async () => {
        try {
          const currentOrders = await getOrders();
          for (const order of currentOrders) {
            const lastStatus = lastOrderStatuses[order.id];
            if (lastStatus && lastStatus !== order.status) {
              // Trigger Notification
              if (Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo) && Notifications) {
                try {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Order Status Updated! 💊",
                      body: `Your order #${order.id.slice(0, 8).toUpperCase()} is now ${order.status.toLowerCase()}.`,
                      data: { orderId: order.id },
                    },
                    trigger: null, // show immediately
                  });
                } catch (e) {
                  console.warn('Schedule notification failed:', e);
                }
              } else {
                console.log(`[Web Notification] Order ${order.id} status changed to ${order.status}`);
              }
            }
            lastOrderStatuses[order.id] = order.status;
          }
        } catch (e) {
          console.warn('Order polling failed:', e);
          // Continue polling even if one attempt fails
        }
      }, 30000); // Poll every 30 seconds
    })();

    return () => {
      if (locationSubscription) {
        try {
          // Guard for web as removeSubscription can be missing/broken in some SDK environments
          if (Platform.OS !== 'web') {
            locationSubscription.remove();
          }
        } catch (e) {
          console.warn('Location cleanup error:', e);
        }
      }
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const handleManualLocationUpdate = async () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }

    setUpdatingLocation(true);
    try {
      // Use Backend Geocoding Service (Avoids Google SDK limits and Web compatibility issues)
      const geocoded = await geocodeAddress(manualAddress);

      if (geocoded) {
        const { latitude, longitude, displayName } = geocoded;

        // 1. Update Backend
        await updateUserLocation(latitude, longitude, manualAddress);

        // 2. Update Local State
        setLocation(manualAddress);
        setLocationCoords({
          coords: { latitude, longitude, altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0 },
          timestamp: Date.now()
        });

        // 3. Refresh Pharmacies (Simulated "Effect")
        setLoading(true);
        const rawPharmacies = await fetchFoursquarePlacesNearby(latitude, longitude);
        if (rawPharmacies && rawPharmacies.length > 0) {
          const partners = await getEnrichedPharmacies(rawPharmacies);
          const merged = rawPharmacies.map((p: any) => {
            const partner = partners.find((pt: any) => pt.foursquare_id === p.fsq_id || pt.name.toLowerCase() === p.name.toLowerCase());
            return {
              ...p,
              id: p.fsq_id || Math.random().toString(),
              name: p.name,
              image: p.image,
              isPartner: !!partner,
              ...(partner && partner),
              distance: p.distance || 0.5,
              rating: partner?.rating || p.rating || 4.5
            };
          });
          merged.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
          setNearbyPharmacies(merged);
        } else {
          // Reuse database fallback logic
          const dbPharmacies = await fetchNearbyPharmacies(latitude, longitude, 10);
          if (dbPharmacies && dbPharmacies.length > 0) {
            setNearbyPharmacies(dbPharmacies.map((p: any) => ({ ...p, isPartner: true })));
          } else {
            setNearbyPharmacies([]);
          }
        }
        setLoading(false);
        setManualLocationModal(false);
        Alert.alert('Success', 'Location updated successfully!');

      } else {
        Alert.alert('Error', 'Could not find location. Please try a different address.');
      }
    } catch (error) {
      console.error("Manual Update Error:", error);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />

      {/* Header / Banner Section */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <View style={styles.topRow}>
          {isSearching ? (
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.locationLabel}>Your Location</Text>
              <TouchableOpacity style={styles.locationSelector} onPress={() => setManualLocationModal(true)}>
                <MapPin size={16} color={Colors.white} />
                <Text style={styles.locationText}>{location}</Text>
              </TouchableOpacity>
            </View>
          )}


        </View>

        <View style={[styles.searchContainer, { zIndex: 100 }]}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textLight} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 16, color: Colors.text }}
              placeholder="Search medicines, pharmacies..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={() => performSearch(searchQuery)}
            />
            {isSearching && (
              <TouchableOpacity onPress={() => performSearch(searchQuery)}>
                <View style={{ backgroundColor: Colors.primary, padding: 8, borderRadius: 8 }}>
                  <Search size={16} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={{
              position: 'absolute',
              top: 55,
              left: 20,
              right: 20,
              backgroundColor: 'white',
              borderRadius: 12,
              paddingVertical: 8,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
                android: { elevation: 5 },
                web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
              }),
              zIndex: 1000
            }}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}-${index}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                    borderBottomColor: '#F3F4F6'
                  }}
                  onPress={() => {
                    setSearchQuery(item.name);
                    performSearch(item.name);
                  }}
                >
                  <Image
                    source={{ uri: item.image || 'https://placehold.co/50x50/png' }}
                    style={{ width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: '#F3F4F6' }}
                  />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: item.type === 'pharmacy' ? Colors.primary : Colors.textLight, marginTop: 2 }}>
                      {item.type === 'pharmacy' ? 'Pharmacy' : 'Medicine'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {!isSearching && (
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Find the best price for your medicine</Text>
            <Text style={styles.bannerSubtitle}>Save up to 10% on every purchase</Text>
          </View>
        )}
      </LinearGradient>

      {isSearching ? (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Search Results</Text>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : searchResults.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.textLight }}>No results found.</Text>
          ) : (
            searchResults.map((item, index) => <View key={index}>{renderSearchResultItem({ item })}</View>)
          )}
        </View>
      ) : (
        <>
          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>


            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, isSelected && { borderColor: Colors.primary, borderWidth: 1, borderRadius: 12 }]}
                    onPress={async () => {
                      const newCategory = isSelected ? null : cat.name;
                      setSelectedCategory(newCategory);

                      // Fetch drugs for this category immediately
                      try {
                        setLoading(true);
                        const drugs = await fetchDrugs({ category: newCategory || 'ALL' });
                        setExploreDrugs(drugs.slice(0, 4));
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: isSelected ? Colors.primary : cat.color }]}>
                      <cat.icon size={28} color={isSelected ? 'white' : Colors.primary} />
                    </View>
                    <Text style={[styles.categoryName, isSelected && { color: Colors.primary, fontWeight: 'bold' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Nearby Pharmacies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Finding nearby pharmacies...</Text>
              </View>
            ) : nearbyPharmacies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pharmacies found nearby</Text>
                <Text style={styles.emptySubtext}>
                  We're working on adding pharmacies in your area. Check back soon!
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pharmacyScroll}>
                {nearbyPharmacies.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.pharmacyCard}
                    onPress={() => router.push({
                      pathname: `/pharmacy/${item.fsq_id || item.id}`,
                      params: {
                        name: item.name,
                        address: item.address,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        image: item.image,
                        rating: item.rating,
                        isPartner: item.isPartner ? 'true' : 'false'
                      }
                    } as any)}
                  >
                    {item.isPartner && (
                      <View style={styles.partnerBadge}>
                        <CheckCircle2 size={10} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.partnerText}>Partner</Text>
                      </View>
                    )}


                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.pharmacyImage}
                      />
                    ) : (
                      <View style={[styles.pharmacyImage, { backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }]}>
                        <Activity color={Colors.primary} size={32} />
                      </View>
                    )}

                    <View style={styles.pharmacyInfo}>
                      <Text style={styles.pharmacyName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.ratingRow}>
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {item.rating?.toFixed(1) || '4.5'} • {item.distance?.toFixed(1) || '0.5'} km
                        </Text>
                      </View>
                      {item.isPartner && (
                        <View style={styles.partnerFooter}>
                          <Text style={styles.bestPriceText}>Best Price Guaranteed</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Explore Medicines */}
          <View style={[styles.section, { marginBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Medicines</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {exploreDrugs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No medicines available yet</Text>
                <Text style={styles.emptySubtext}>
                  We're building our medicine catalog. Check back soon!
                </Text>
              </View>
            ) : (
              <View style={styles.exploreGrid}>
                {exploreDrugs.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.drugCard}
                    onPress={() => router.push({
                      pathname: '/drug/[id]',
                      params: {
                        id: item.name,
                        lat: locationCoords?.coords.latitude || '',
                        lng: locationCoords?.coords.longitude || ''
                      }
                    } as any)}
                  >
                    <Image
                      source={{ uri: item.image || 'https://placehold.co/150x150/png' }}
                      style={styles.drugImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.drugName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.drugPrice}>
                      ₦{item.avgPrice ? parseFloat(item.avgPrice).toLocaleString('en-NG') : '1,200'}
                    </Text>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => router.push({
                        pathname: '/drug/[id]',
                        params: {
                          id: item.name,
                          lat: locationCoords?.coords.latitude || '',
                          lng: locationCoords?.coords.longitude || ''
                        }
                      } as any)}
                    >
                      <Text style={styles.addBtnText}>view</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}


      {/* Manual Location Modal */}
      <Modal
        visible={manualLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setManualLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Location</Text>
            <Text style={styles.modalSubtitle}>Enter your address to find pharmacies near you</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 123 Main St, Lagos"
              value={manualAddress}
              onChangeText={setManualAddress}
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setManualLocationModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleManualLocationUpdate}
                disabled={updatingLocation}
              >
                {updatingLocation ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: Colors.textLight,
    fontSize: 14,
  },
  bannerContent: {
    marginTop: 10,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    width: '70%',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  pharmacyScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  pharmacyCard: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  pharmacyImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6', // Add background color to see if it renders
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pharmacyInfo: {
    padding: 12,
  },
  pharmacyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  partnerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  partnerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  partnerFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bestPriceText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  drugCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  drugImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  drugName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  drugPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
