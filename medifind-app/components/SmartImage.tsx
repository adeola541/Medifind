import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Pill, Syringe, Droplets, Activity, Eye, HeartPulse, HelpCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface SmartImageProps {
    uri?: string;
    category?: string;
    style?: ImageStyle | ViewStyle;
    iconSize?: number;
}

export default function SmartImage({ uri, category, style, iconSize = 24 }: SmartImageProps) {
    const [error, setError] = React.useState(false);

    const getFallbackIcon = () => {
        switch (category?.toUpperCase()) {
            case 'TABLET':
            case 'CAPSULE':
                return <Pill size={iconSize} color={Colors.primary} />;
            case 'INJECTION':
                return <Syringe size={iconSize} color={Colors.primary} />;
            case 'LIQUID':
            case 'SYRUP':
                return <Droplets size={iconSize} color={Colors.primary} />;
            case 'EYE':
                return <Eye size={iconSize} color={Colors.primary} />;
            case 'BONE':
            case 'ACTIVITY':
                return <Activity size={iconSize} color={Colors.primary} />;
            case 'STOMACH':
                return <HeartPulse size={iconSize} color={Colors.primary} />;
            default:
                return <HelpCircle size={iconSize} color={Colors.primary} />;
        }
    };

    if (!uri || error || uri.includes('placehold.co') || uri.includes('via.placeholder.com')) {
        return (
            <View style={[styles.fallbackContainer, style]}>
                {getFallbackIcon()}
            </View>
        );
    }

    return (
        <Image
            source={{ uri }}
            style={style as ImageStyle}
            onError={() => setError(true)}
            resizeMode="contain"
        />
    );
}

const styles = StyleSheet.create({
    fallbackContainer: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
});
