import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { mobileApi } from '../lib/api';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react-native';

export default function DailyAttendanceScreen() {
    const navigation = useNavigation();
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, half: 0 });

    useEffect(() => {
        loadData();
    }, [date]);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const loadData = async () => {
        setLoading(true);
        try {
            const dateStr = formatDate(date);
            const res = await mobileApi.getDailyAttendance(dateStr);
            setRecords(res.records);

            // Calculate stats
            const s = { present: 0, absent: 0, leave: 0, half: 0 };
            res.records.forEach((r: any) => {
                if (r.status === 'PRESENT') s.present++;
                else if (r.status === 'ABSENT') s.absent++;
                else if (r.status === 'LEAVE') s.leave++;
                else if (r.status === 'HALF_DAY') s.half++;
            });
            setStats(s);

        } catch (e: any) {
            // console.error(e);
            Alert.alert("Error", e.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <User color="#6b7280" size={20} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.timeRow}>
                        <Clock size={12} color="#9ca3af" />
                        <Text style={styles.timeText}>
                            In: {item.check_in !== '-' ? item.check_in : '--:--'} • Out: {item.check_out !== '-' ? item.check_out : '--:--'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.badge,
                item.status === 'PRESENT' ? styles.bgGreen :
                    item.status === 'ABSENT' ? styles.bgRed :
                        item.status === 'LEAVE' ? styles.bgYellow : styles.bgBlue
                ]}>
                    <Text style={[styles.badgeText,
                    item.status === 'PRESENT' ? styles.textGreen :
                        item.status === 'ABSENT' ? styles.textRed :
                            item.status === 'LEAVE' ? styles.textYellow : styles.textBlue
                    ]}>{item.status}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1f2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Daily Attendance</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Date Selector */}
            <View style={styles.dateBar}>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBtn}>
                    <Calendar color="#3b82f6" size={20} />
                    <Text style={styles.dateText}>{date.toDateString()}</Text>
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.statLabel, { color: '#047857' }]}>Present</Text>
                    <Text style={[styles.statValue, { color: '#047857' }]}>{stats.present}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#fef2f2' }]}>
                    <Text style={[styles.statLabel, { color: '#b91c1c' }]}>Absent</Text>
                    <Text style={[styles.statValue, { color: '#b91c1c' }]}>{stats.absent}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#fffbeb' }]}>
                    <Text style={[styles.statLabel, { color: '#b45309' }]}>Leave</Text>
                    <Text style={[styles.statValue, { color: '#b45309' }]}>{stats.leave}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No records found</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'white' },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

    dateBar: { padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'center' },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
    dateText: { fontSize: 16, fontWeight: '500', color: '#374151' },

    statsContainer: { flexDirection: 'row', padding: 15, gap: 10 },
    statBox: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
    statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: 'bold' },

    list: { padding: 15 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: '#6b7280' },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    bgGreen: { backgroundColor: '#d1fae5' },
    textGreen: { color: '#059669', fontSize: 12, fontWeight: 'bold' },
    bgRed: { backgroundColor: '#fee2e2' },
    textRed: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },
    bgYellow: { backgroundColor: '#fef3c7' },
    textYellow: { color: '#d97706', fontSize: 12, fontWeight: 'bold' },
    bgBlue: { backgroundColor: '#dbeafe' },
    textBlue: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },
    badgeText: { fontSize: 12, fontWeight: 'bold' }, // Added base style for badge text

    empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af' }
});
