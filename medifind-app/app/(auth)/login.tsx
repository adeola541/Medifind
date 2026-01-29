import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';
import { useAuthStore, AuthState } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react-native';

export default function LoginScreen() {
    const router = useRouter();
    const signIn = useAuthStore((state: AuthState) => state.signIn);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        console.log('Login attempt started for:', email);
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending request to API...');
            const response = await api.post('/auth/login', { email, password });
            console.log('API Response received:', response.status);

            const { token, user } = response.data;

            console.log('Storing session...');
            await signIn(token, user);

            console.log('Navigating to Home...');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error detail:', error);
            const msg = error.response?.data?.error || 'Login failed. Please check your credentials.';
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>Enter your credentials to continue searching for medications</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Mail size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Password</Text>
                                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                                        <Text style={styles.forgotText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Lock size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <View style={styles.loginBtnContent}>
                                        <Text style={styles.loginBtnText}>Sign In</Text>
                                        <View style={styles.btnIconBox}>
                                            <ChevronRight size={18} color={Colors.primary} strokeWidth={3} />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerBox}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => router.push('/(auth)/register')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.secondaryBtnText}>Don't have an account? <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Sign Up</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Platform.OS === 'web' ? 20 : 10,
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
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
        marginTop: 8,
        lineHeight: 22,
        maxWidth: '85%',
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 10,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary,
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
    iconBox: {
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
        outlineStyle: 'none', // For web
    } as any,
    eyeIcon: {
        padding: 8,
    },
    loginBtn: {
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
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginBtnText: {
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
    dividerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        color: '#D1D5DB',
        fontWeight: 'bold',
    },
    secondaryBtn: {
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        cursor: 'pointer', // For web
    } as any,
    secondaryBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
});
