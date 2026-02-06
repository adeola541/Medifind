import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    return (
        <View style={[styles.container, { height }]}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: latitude || 6.5244,
                    longitude: longitude || 3.3792,
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
});
