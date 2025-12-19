import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Platform, ActivityIndicator } from 'react-native';
import { mobileApi } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

export default function LeaveScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'APPLY' | 'HISTORY'>('APPLY');
    const [loading, setLoading] = useState(false);

    // Form State
    // Format YYYY-MM-DD for API
    const [startObj, setStartObj] = useState(new Date());
    const [endObj, setEndObj] = useState(new Date());

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [reason, setReason] = useState('');

    // History Data
    const [leaves, setLeaves] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'HISTORY') {
            loadLeaves();
        }
    }, [activeTab]);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getMyLeaves();
            setLeaves(data);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to load leaves");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const onStartChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios'); // Keep open on iOS? No, usually close.
        if (Platform.OS === 'android') setShowStartPicker(false);

        if (selectedDate) {
            setStartObj(selectedDate);
        }
    };

    const onEndChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowEndPicker(false);

        if (selectedDate) {
            setEndObj(selectedDate);
        }
    };

    const handleApply = async () => {
        if (!reason) {
            Alert.alert("Error", "Please provide a reason");
            return;
        }

        const sDate = formatDate(startObj);
        const eDate = formatDate(endObj);

        if (sDate > eDate) {
            Alert.alert("Error", "Start date cannot be after end date");
            return;
        }

        setLoading(true);
        try {
            await mobileApi.applyLeave(sDate, eDate, reason);
            Alert.alert("Success", "Leave Application Sent!", [
                {
                    text: "OK", onPress: () => {
                        setReason('');
                        setActiveTab('HISTORY');
                    }
                }
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to apply");
        } finally {
            setLoading(false);
        }
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.dateRange}>{item.start_date} to {item.end_date}</Text>
                <Text style={[
                    styles.statusBadge,
                    item.status === 'APPROVED' ? styles.statusApproved :
                        item.status === 'REJECTED' ? styles.statusRejected : styles.statusPending
                ]}>
                    {item.status}
                </Text>
            </View>
            <Text style={styles.reason}>"{item.reason}"</Text>
            {item.status === 'APPROVED' && (
                <Text style={styles.metaInfo}>{item.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</Text>
            )}
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Leave Management</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'APPLY' && styles.activeTab]}
                    onPress={() => setActiveTab('APPLY')}
                >
                    <Text style={[styles.tabText, activeTab === 'APPLY' && styles.activeTabText]}>Apply New</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]}
                    onPress={() => setActiveTab('HISTORY')}
                >
                    <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>My History</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'APPLY' ? (
                <View style={styles.form}>
                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
                        <Text style={styles.inputText}>{formatDate(startObj)}</Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startObj}
                            mode="date"
                            display="default"
                            onChange={onStartChange}
                            minimumDate={new Date()}
                        />
                    )}

                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
                        <Text style={styles.inputText}>{formatDate(endObj)}</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                        <DateTimePicker
                            value={endObj}
                            mode="date"
                            display="default"
                            onChange={onEndChange}
                            minimumDate={startObj} // Min end date = start date
                        />
                    )}

                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g. Sick Leave / Family Function"
                        placeholderTextColor={theme.colors.text.light}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleApply}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitText}>Submit Application</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={leaves}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={loadLeaves}
                    ListEmptyComponent={<Text style={styles.emptyText}>No leave history found.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20, paddingTop: 50, backgroundColor: theme.colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.main },
    closeText: { color: theme.colors.primary, fontSize: 16 },

    tabs: { flexDirection: 'row', padding: 15, gap: 10 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.m, alignItems: 'center', backgroundColor: theme.colors.background },
    activeTab: { backgroundColor: theme.colors.primary },
    tabText: { color: theme.colors.text.muted, fontWeight: '600' },
    activeTabText: { color: 'white' },

    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.main, marginBottom: 8 },
    input: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.s, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
    inputText: { color: theme.colors.text.main },
    textArea: { height: 100, textAlignVertical: 'top', color: theme.colors.text.main },
    submitBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: theme.borderRadius.m, alignItems: 'center', marginTop: 10 },
    disabledBtn: { backgroundColor: theme.colors.text.light },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    list: { padding: 15 },
    card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.m, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dateRange: { fontWeight: 'bold', color: theme.colors.text.main, fontSize: 16 },
    statusBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: theme.colors.warning },
    statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: theme.colors.success },
    statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: theme.colors.error },
    reason: { color: theme.colors.text.muted, fontStyle: 'italic', marginBottom: 8 },
    metaInfo: { fontSize: 12, color: theme.colors.text.light },
    emptyText: { textAlign: 'center', marginTop: 50, color: theme.colors.text.muted }
});
