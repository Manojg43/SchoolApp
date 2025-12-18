import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react-native';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        address: '',
        designation: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getMyProfile();
            const u = data.user || {};
            setFormData({
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                email: u.email || '',
                mobile: u.mobile || '',
                address: u.address || '', // Assuming backend sends this now, or we need to check if profile_data has it
                designation: u.designation || ''
            });
        } catch (e: any) {
            Alert.alert("Error", "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await mobileApi.updateProfile(formData);
            Alert.alert("Success", "Profile Update Successful");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Update Failed");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0f52ba" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1f2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>My Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Read Only designation */}
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{formData.designation || 'Staff'}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <View style={styles.inputContainer}>
                            <User size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                value={formData.first_name}
                                onChangeText={t => handleChange('first_name', t)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <View style={styles.inputContainer}>
                            <User size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                value={formData.last_name}
                                onChangeText={t => handleChange('last_name', t)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={t => handleChange('email', t)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                value={formData.mobile}
                                onChangeText={t => handleChange('mobile', t)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                value={formData.address}
                                onChangeText={t => handleChange('address', t)}
                                multiline
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.disabledBtn]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save color="white" size={20} />
                                <Text style={styles.saveText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'white' },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    content: { padding: 20 },

    badgeContainer: { alignSelf: 'center', backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 20 },
    badgeText: { color: '#1e40af', fontWeight: 'bold' },

    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, gap: 10 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#111827' },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f52ba', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 },
    disabledBtn: { backgroundColor: '#93c5fd' },
    saveText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
