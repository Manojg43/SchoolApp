import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { mobileApi } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
        <View style={styles.card}>
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
        </View>
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
                        <Text>{formatDate(startObj)}</Text>
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
                        <Text>{formatDate(endObj)}</Text>
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
                        value={reason}
                        onChangeText={setReason}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleApply}
                        disabled={loading}
                    >
                        <Text style={styles.submitText}>{loading ? "Submitting..." : "Submit Application"}</Text>
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
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, paddingTop: 50, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    closeText: { color: '#3B82F6', fontSize: 16 },

    tabs: { flexDirection: 'row', padding: 15, gap: 10 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#E5E7EB' },
    activeTab: { backgroundColor: '#3B82F6' },
    tabText: { color: '#374151', fontWeight: '600' },
    activeTabText: { color: 'white' },

    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
    input: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#D1D5DB' },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    disabledBtn: { backgroundColor: '#6EE7B7' },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    list: { padding: 15 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    dateRange: { fontWeight: 'bold', color: '#111827' },
    statusBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
    statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    statusApproved: { backgroundColor: '#D1FAE5', color: '#065F46' },
    statusRejected: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    reason: { color: '#6B7280', fontStyle: 'italic', marginBottom: 5 },
    metaInfo: { fontSize: 10, color: '#9CA3AF' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' }
});
