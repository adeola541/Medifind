import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { email, type } = useLocalSearchParams();

    // 4-digit OTP
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (keyStr: string, index: number) => {
        if (keyStr === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 4) {
            Alert.alert('Error', 'Please enter the complete 4-digit code');
            return;
        }

        setLoading(true);
        try {
            // Simulate verification
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (type === 'reset') {
                // Proceed to Reset Password (simplified directly here for now or nav to reset-password)
                Alert.alert('Success', 'Email verified. Please check your email for the temporary password.', [
                    { text: 'OK', onPress: () => router.navigate('/(auth)/login') }
                ]);
            } else {
                // Account verification
                Alert.alert('Success', 'Account verified! Logging you in...', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Verify Account</Text>
                <Text style={styles.subtitle}>
                    We sent a code to {email || 'your email'}. Enter it below to verify your identity.
                </Text>
            </View>

            <View style={styles.form}>
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                if (ref) inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null
                            ]}
                            value={digit}
                            onChangeText={(val) => handleOtpChange(val, index)}
                            onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Verify Code</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => Alert.alert('Sent', 'A new code has been sent.')}
                >
                    <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    form: {
        alignItems: 'center',
        gap: 30,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    otpInput: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    otpInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
    resendButton: {
        padding: 10,
    },
    resendText: {
        color: Colors.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
});
