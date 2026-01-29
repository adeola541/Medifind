import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Mail, ArrowLeft, ChevronRight, Lock } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            // Simulate success for demo
            await new Promise(resolve => setTimeout(resolve, 1500));

            router.push({
                pathname: '/(auth)/verify-otp',
                params: { email, type: 'reset' }
            });
        } catch (error: any) {
            Alert.alert('Error', 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.content}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <View style={styles.iconBox}>
                                <Lock size={32} color={Colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.title}>Recovery Mode</Text>
                            <Text style={styles.subtitle}>
                                Lost your password? Enter your email and we'll help you get back into your account.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconBox}>
                                        <Mail size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your registered email"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                                onPress={handleSendCode}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <View style={styles.sendBtnContent}>
                                        <Text style={styles.sendBtnText}>Send Reset Link</Text>
                                        <View style={styles.btnIconBox}>
                                            <ChevronRight size={18} color={Colors.primary} strokeWidth={3} />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }} />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
        alignItems: 'center',
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        height: 60,
        paddingHorizontal: 12,
    },
    inputIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
        }),
    },
    input: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: Colors.primary,
        height: 64,
        borderRadius: 20,
        marginTop: 16,
        elevation: 4,
        ...(Platform.OS === 'web' ? {
            boxShadow: `0px 8px 12px ${Colors.primary}33`,
        } : {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
        }),
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer', // For web
    } as any,
    sendBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginRight: 10,
    },
    btnIconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
