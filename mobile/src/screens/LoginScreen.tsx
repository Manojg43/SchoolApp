import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { theme } from '../constants/theme';

// Assuming this is part of a functional component, e.g., function LoginScreen() { ... }
// Adding a placeholder for the component structure to make it syntactically correct
const LoginScreen = ({ navigation }: any) => {
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetMobile, setResetMobile] = useState('');
    const [resetCode, setResetCode] = useState(''); // 6 Digit Admin Code
    const [newPass, setNewPass] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    // Assuming these states are defined elsewhere in the component
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setLoading(true);
        try {
            const response = await mobileApi.login(username, password);
            await AsyncStorage.setItem('token', response.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            // Navigate to Main App
            // Assuming the parent navigator has a 'Main' stack or 'Dashboard' screen
            // We'll use replace to prevent going back to login
            if (navigation && navigation.replace) {
                navigation.replace('Main');
            } else {
                // Fallback if navigation prop is missing types (should cause error if not handled)
                console.error("Navigation prop missing");
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!resetMobile || !resetCode || !newPass) {
            Alert.alert("Error", "All fields are required");
            return;
        }
        setResetLoading(true);
        try {
            await mobileApi.resetPassword(resetMobile, resetCode, newPass);
            Alert.alert("Success", "Password reset successfully. Login now.", [
                { text: "OK", onPress: () => setShowResetModal(false) }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Reset failed");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* ... Existing Login UI ... */}
            {/* Decorative Background Curve */}
            <View style={styles.headerContainer}>
                <Svg
                    height="100%"
                    width="100%"
                    viewBox="0 0 1440 320"
                    preserveAspectRatio="none"
                >
                    <Path
                        fill={theme.colors.primary}
                        d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                    />
                </Svg>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Welcome Back!</Text>
                    <Text style={styles.headerSubtitle}>Sign in to your account</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.card}>
                        <View style={styles.formHeader}>
                            <Text style={styles.cardTitle}>Staff Login</Text>
                        </View>

                        {/* Username Input */}
                        <View style={styles.inputContainer}>
                            <User color={theme.colors.text.muted} size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username (Email)"
                                placeholderTextColor={theme.colors.text.light}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Lock color={theme.colors.text.muted} size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={theme.colors.text.light}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                {showPassword ? (
                                    <EyeOff color={theme.colors.text.muted} size={20} />
                                ) : (
                                    <Eye color={theme.colors.text.muted} size={20} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Login</Text>
                                    <LogIn color="white" size={20} style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowResetModal(true)}>
                            <Text style={styles.footerText}>
                                Forgot Password? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reset Here</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Reset Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showResetModal}
                onRequestClose={() => setShowResetModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <Text style={styles.modalSubtitle}>Enter the 6-digit code provided by your Admin</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Mobile Number"
                            value={resetMobile}
                            onChangeText={setResetMobile}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Reset Code (from Admin)"
                            value={resetCode}
                            onChangeText={setResetCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="New Password"
                            value={newPass}
                            onChangeText={setNewPass}
                            secureTextEntry
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowResetModal(false)} style={styles.modalCancel}>
                                <Text style={{ color: theme.colors.text.muted }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleReset} style={styles.modalSubmit} disabled={resetLoading}>
                                {resetLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Reset Password</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        height: 350,
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 0,
    },
    headerContent: {
        position: 'absolute',
        top: 100,
        left: 24,
        right: 24,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    keyboardView: {
        flex: 1,
        marginTop: 220,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: theme.colors.surfaceGlass,
        borderRadius: 24,
        padding: 32,
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.main,
        marginBottom: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    icon: {
        marginRight: 12,
        opacity: 0.5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.main,
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    button: {
        height: 60,
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.text.light,
        shadowOpacity: 0.1,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text.muted,
        marginTop: 24,
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Darker overlay using slate-900
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.colors.text.main
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.colors.text.muted,
        marginBottom: 24,
        lineHeight: 20,
    },
    modalInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: theme.colors.text.main,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16
    },
    modalCancel: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modalSubmit: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        elevation: 2,
    }
});
