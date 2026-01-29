import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background Image/Gradient */}
            <View style={styles.backgroundWrapper}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?q=80&w=2070&auto=format&fit=crop' }}
                    style={styles.bgImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.4)', 'rgba(6, 95, 70, 0.95)']}
                    style={styles.gradientOverlay}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Top Branding */}
                    <View style={styles.brandBox}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/images/logo-icon.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.brandName}>MediFind</Text>
                    </View>

                    {/* Bottom Info */}
                    <View style={styles.bottomSection}>
                        <Text style={styles.title}>Your Health,{"\n"}Our Priority.</Text>
                        <Text style={styles.subtitle}>
                            Find, compare and order medications from verified pharmacies near you with ease.
                        </Text>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push('/(auth)/login')}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                                <View style={styles.btnIcon}>
                                    <ArrowRight size={18} color={Colors.primary} strokeWidth={3} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push('/(auth)/register')}
                            >
                                <Text style={styles.secondaryButtonText}>Create an account</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.footerText}>
                            By continuing you agree to our <Text style={styles.footerLink}>Terms of Service</Text>
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#065F46',
    },
    backgroundWrapper: {
        position: 'absolute',
        width: width,
        height: height,
    },
    bgImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    brandBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    logoCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoImage: {
        width: 28,
        height: 28,
    },
    brandName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    bottomSection: {
        marginBottom: 30,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 56,
        letterSpacing: -1,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 24,
        marginBottom: 40,
        maxWidth: '90%',
    },
    buttonGroup: {
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#FFFFFF',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.2)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
        }),
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        marginRight: 8,
    },
    btnIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButton: {
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    footerText: {
        marginTop: 32,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
    },
    footerLink: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
