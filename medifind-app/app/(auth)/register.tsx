import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, Lock, ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react-native';

export default function RegisterScreen() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'USER'
            });

            Alert.alert('Success', 'Account created! Please sign in.', [
                { text: 'OK', onPress: () => router.push('/(auth)/login') }
            ]);
        } catch (error: any) {
            console.error('Registration error:', error);
            let msg = 'Registration failed.';

            if (error.response) {
                msg = error.response.data?.error || `Server Error (${error.response.status})`;
            } else if (error.request) {
                msg = 'Network Error. Please check your internet connection or try again later.';
            } else {
                msg = error.message;
            }

            Alert.alert('Registration Failed', msg);
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
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Join MediFind</Text>
                            <Text style={styles.subtitle}>Create an account to start managing your health better</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <User size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.name}
                                        onChangeText={(t) => handleChange('name', t)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Mail size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@example.com"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.email}
                                        onChangeText={(t) => handleChange('email', t)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Lock size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Create a password"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.password}
                                        onChangeText={(t) => handleChange('password', t)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Lock size={20} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm your password"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.confirmPassword}
                                        onChangeText={(t) => handleChange('confirmPassword', t)}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <View style={styles.registerBtnContent}>
                                        <Text style={styles.registerBtnText}>Sign Up</Text>
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
                                onPress={() => router.push('/(auth)/login')}
                            >
                                <Text style={styles.secondaryBtnText}>Already have an account? <Text style={{ color: Colors.primary }}>Sign In</Text></Text>
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
        marginTop: 10,
    },
    header: {
        marginTop: 30,
        marginBottom: 30,
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
        gap: 20,
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
    },
    eyeIcon: {
        padding: 8,
    },
    registerBtn: {
        backgroundColor: Colors.primary,
        height: 64,
        borderRadius: 20,
        marginTop: 10,
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
    registerBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerBtnText: {
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
    },
    secondaryBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
});
