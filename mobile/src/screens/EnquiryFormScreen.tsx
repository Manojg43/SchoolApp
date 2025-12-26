import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Save, User, Phone, Mail, Calendar, MapPin, BookOpen, Building } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { mobileApi } from '../lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ClassOption {
    id: number;
    name: string;
}

export default function EnquiryFormScreen() {
    const navigation = useNavigation();
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: new Date(new Date().getFullYear() - 6, 0, 1), // Default 6 years ago
        gender: 'M',
        class_applied: '',
        parent_name: '',
        parent_mobile: '',
        parent_email: '',
        address: '',
        previous_school_name: '',
        referred_by: '',
        notes: '',
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const data = await mobileApi.getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            handleChange('date_of_birth', selectedDate);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.first_name.trim()) {
            Alert.alert('Error', 'First name is required');
            return;
        }
        if (!formData.last_name.trim()) {
            Alert.alert('Error', 'Last name is required');
            return;
        }
        if (!formData.parent_name.trim()) {
            Alert.alert('Error', 'Parent name is required');
            return;
        }
        if (!formData.parent_mobile.trim() || formData.parent_mobile.length < 10) {
            Alert.alert('Error', 'Valid mobile number is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
                class_applied: formData.class_applied || null,
            };

            await mobileApi.createEnquiry(payload);
            Alert.alert(
                'Success',
                'Enquiry submitted successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit enquiry');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Enquiry</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Student Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Student Details</Text>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>First Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.first_name}
                                onChangeText={(v) => handleChange('first_name', v)}
                                placeholder="First name"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Last Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.last_name}
                                onChangeText={(v) => handleChange('last_name', v)}
                                placeholder="Last name"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth *</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Calendar size={18} color={theme.colors.text.muted} />
                            <Text style={styles.dateText}>{formatDate(formData.date_of_birth)}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.date_of_birth}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender *</Text>
                        <View style={styles.genderRow}>
                            {['M', 'F', 'O'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderBtn,
                                        formData.gender === g && styles.genderBtnActive
                                    ]}
                                    onPress={() => handleChange('gender', g)}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        formData.gender === g && styles.genderTextActive
                                    ]}>
                                        {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Class Applied For</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.classRow}>
                                {classes.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.classBtn,
                                            formData.class_applied === String(c.id) && styles.classBtnActive
                                        ]}
                                        onPress={() => handleChange('class_applied', String(c.id))}
                                    >
                                        <Text style={[
                                            styles.classText,
                                            formData.class_applied === String(c.id) && styles.classTextActive
                                        ]}>
                                            {c.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Parent Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parent / Guardian</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Parent Name *</Text>
                        <View style={styles.inputWithIcon}>
                            <User size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={styles.inputInner}
                                value={formData.parent_name}
                                onChangeText={(v) => handleChange('parent_name', v)}
                                placeholder="Parent/Guardian name"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number *</Text>
                        <View style={styles.inputWithIcon}>
                            <Phone size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={styles.inputInner}
                                value={formData.parent_mobile}
                                onChangeText={(v) => handleChange('parent_mobile', v)}
                                placeholder="10-digit mobile"
                                keyboardType="phone-pad"
                                maxLength={10}
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email (Optional)</Text>
                        <View style={styles.inputWithIcon}>
                            <Mail size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={styles.inputInner}
                                value={formData.parent_email}
                                onChangeText={(v) => handleChange('parent_email', v)}
                                placeholder="Email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <View style={[styles.inputWithIcon, { alignItems: 'flex-start', paddingTop: 12 }]}>
                            <MapPin size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={[styles.inputInner, { height: 60, textAlignVertical: 'top' }]}
                                value={formData.address}
                                onChangeText={(v) => handleChange('address', v)}
                                placeholder="Full address"
                                multiline
                                numberOfLines={2}
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>
                </View>

                {/* Additional Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Info</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Previous School</Text>
                        <View style={styles.inputWithIcon}>
                            <Building size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={styles.inputInner}
                                value={formData.previous_school_name}
                                onChangeText={(v) => handleChange('previous_school_name', v)}
                                placeholder="Previous school name"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Referred By</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.referred_by}
                            onChangeText={(v) => handleChange('referred_by', v)}
                            placeholder="Who referred this student?"
                            placeholderTextColor={theme.colors.text.muted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={formData.notes}
                            onChangeText={(v) => handleChange('notes', v)}
                            placeholder="Any additional notes..."
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={theme.colors.text.muted}
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Save size={20} color="#fff" />
                            <Text style={styles.submitText}>Submit Enquiry</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.main,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 20,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.main,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    inputGroup: {
        marginTop: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.main,
        marginBottom: 6,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: theme.colors.text.main,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    inputInner: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.main,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 15,
        color: theme.colors.text.main,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
    },
    genderBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    genderBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    genderText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.main,
    },
    genderTextActive: {
        color: '#fff',
    },
    classRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 2,
    },
    classBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    classBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    classText: {
        fontSize: 14,
        color: theme.colors.text.main,
    },
    classTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
