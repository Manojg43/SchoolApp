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
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { theme } from '../constants/theme';

const LoginScreen = ({ navigation }: any) => {
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetMobile, setResetMobile] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPass, setNewPass] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

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
            await AsyncStorage.setItem('auth_token', response.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            if (navigation && navigation.replace) {
                navigation.replace('Home');
            } else {
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
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Welcome Back</Text>
                        <Text style={styles.headerSubtitle}>Sign in to your account</Text>
                    </View>

                    <BlurView intensity={30} tint="light" style={styles.glassCard}>
                        <View style={styles.formHeader}>
                            <Text style={styles.cardTitle}>Staff Login</Text>
                        </View>

                        {/* Username */}
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

                        {/* Password */}
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
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>Login</Text>
                                        <LogIn color="white" size={20} style={{ marginLeft: 8 }} />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowResetModal(true)}>
                            <Text style={styles.footerText}>
                                Forgot Password? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reset Here</Text>
                            </Text>
                        </TouchableOpacity>
                    </BlurView>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Reset Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showResetModal}
                onRequestClose={() => setShowResetModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
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
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    headerContent: {
        marginBottom: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    glassCard: {
        overflow: 'hidden',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.75)',
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.main,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 60,
    },
    icon: {
        marginRight: 12,
        opacity: 0.5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.main,
    },
    eyeButton: {
        padding: 8,
    },
    button: {
        height: 60,
        borderRadius: 16,
        marginTop: 12,
        overflow: 'hidden',
        ...theme.shadows.glass
    },
    gradientButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
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
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        elevation: 20,
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
    },
    modalInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
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
    }
});

export default LoginScreen;
