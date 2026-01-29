import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
    onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
    // Animation Values
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const gradientOpacity = useSharedValue(1);

    const [barStyle, setBarStyle] = React.useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Animation Sequence

        // 1. Logo Pop in (on Green Gradient)
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });
        opacity.value = withTiming(1, { duration: 500 });

        // 2. Fade out Gradient to Reveal White (at 800ms)
        gradientOpacity.value = withDelay(800, withTiming(0, { duration: 600 }));

        // Switch Status Bar to dark when white background appears
        const barTimeout = setTimeout(() => {
            setBarStyle('dark');
        }, 1100);

        // 3. Text Slide Up & Fade In (at 1200ms) - Dark Text on White
        textOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
        textTranslateY.value = withDelay(1200, withSpring(0, { damping: 12 }));

        // 4. Exit Animation (After 2800ms)
        const timeout = setTimeout(() => {
            onFinish();
        }, 2800);

        return () => {
            clearTimeout(timeout);
            clearTimeout(barTimeout);
        };
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const gradientStyle = useAnimatedStyle(() => ({
        opacity: gradientOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar style={barStyle} />

            {/* White Background (Base) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

            {/* Gradient Background (Overlay) */}
            <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
                <LinearGradient
                    colors={[Colors.gradientStart, Colors.gradientEnd]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Logo Container */}
            <View style={styles.contentContainer}>
                <Animated.View style={[styles.logoCircle, logoStyle]}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Text Container */}
                <Animated.View style={[styles.textContainer, textStyle]}>
                    <Text style={styles.appName}>MediFind</Text>
                    <Text style={styles.tagline}>Your Health, Simplified</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // Base color
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logoCircle: {
        width: 120,
        height: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Subtle shadow for white-on-white (later) or white-on-green
        shadowRadius: 10,
        elevation: 10,
        marginBottom: 20,
    },
    logo: {
        width: 70,
        height: 70,
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.text, // Dark text for White background
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    tagline: {
        fontSize: 14,
        color: Colors.textLight, // Darker text for White background
        marginTop: 5,
        opacity: 0.9,
    },
});
