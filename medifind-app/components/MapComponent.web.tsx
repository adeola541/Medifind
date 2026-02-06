import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../constants/Colors';
import { MapPin, Navigation } from 'lucide-react-native';

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
    const openInMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url);
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
                <Text style={styles.openMapsText}>Open in Google Maps</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
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
