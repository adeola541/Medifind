import React from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/Colors';
import { MapPin, Navigation } from 'lucide-react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

interface MapComponentProps {
    latitude: number;
    longitude: number;
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        title: string;
        description: string;
        isPartner?: boolean;
    }>;
    height?: number;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function MapComponent({ latitude, longitude, markers = [], height = 300 }: MapComponentProps) {
    // Check for Web only
    if (Platform.OS === 'web') {
        const openInMaps = () => {
            const url = Platform.select({
                ios: `maps:0,0?q=${latitude},${longitude}`,
                android: `geo:0,0?q=${latitude},${longitude}`,
                web: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
            });
            if (url) Linking.openURL(url);
        };

        return (
            <View style={[styles.fallbackContainer, { height }]}>
                <MapPin size={40} color={Colors.primary} />
                <Text style={styles.fallbackTitle}>Map View</Text>
                <Text style={styles.fallbackSubtext}>
                    {markers.length > 0 ? `${markers.length} pharmacies nearby` : 'Your location'}
                </Text>
                <TouchableOpacity style={styles.openMapsBtn} onPress={openInMaps}>
                    <Navigation size={16} color="#FFFFFF" />
                    <Text style={styles.openMapsText}>Open in Maps</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={{ latitude, longitude }}
                    title="Your Location"
                    pinColor={Colors.primary}
                />
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                        title={marker.title}
                        description={marker.description}
                        pinColor={marker.isPartner ? '#059669' : '#EF4444'}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    fallbackContainer: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fallbackTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginTop: 12,
    },
    fallbackSubtext: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
    openMapsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 12,
        gap: 6,
    },
    openMapsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
