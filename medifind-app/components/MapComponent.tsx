import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/Colors';

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

export default function MapComponent({ latitude, longitude, markers = [], height = 300 }: MapComponentProps) {
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.webPlaceholder, { height }]}>
                <Text style={styles.webText}>Map View is not supported on Web in this demo.</Text>
                <Text style={styles.webSubtext}>Visit on Android or iOS to see real-time pharmacy locations.</Text>
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
                {/* User Location Marker */}
                <Marker
                    coordinate={{ latitude, longitude }}
                    title="Your Location"
                    pinColor={Colors.primary}
                />

                {/* Pharmacy Markers */}
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
    webPlaceholder: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    webText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    webSubtext: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 8,
    }
});
