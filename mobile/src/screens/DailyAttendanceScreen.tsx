import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { mobileApi } from '../lib/api';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react-native';

import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

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
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <User color={theme.colors.text.muted} size={20} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.timeRow}>
                        <Clock size={12} color={theme.colors.text.light} />
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
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={theme.colors.text.main} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Daily Attendance</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Date Selector */}
            <View style={styles.dateBar}>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBtn}>
                    <Calendar color={theme.colors.primary} size={20} />
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
                <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.success }]}>Present</Text>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.present}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.error }]}>Absent</Text>
                    <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.absent}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.warning }]}>Leave</Text>
                    <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.leave}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: theme.colors.surface },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.main },

    dateBar: { padding: 15, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', justifyContent: 'center' },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.s },
    dateText: { fontSize: 16, fontWeight: '500', color: theme.colors.text.main },

    statsContainer: { flexDirection: 'row', padding: 15, gap: 10 },
    statBox: { flex: 1, padding: 10, borderRadius: theme.borderRadius.s, alignItems: 'center' },
    statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: 'bold' },

    list: { padding: 15 },
    card: { backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.borderRadius.m, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: theme.colors.text.main, marginBottom: 2 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: theme.colors.text.muted },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    bgGreen: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    textGreen: { color: theme.colors.success, fontSize: 12, fontWeight: 'bold' },
    bgRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    textRed: { color: theme.colors.error, fontSize: 12, fontWeight: 'bold' },
    bgYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    textYellow: { color: theme.colors.warning, fontSize: 12, fontWeight: 'bold' },
    bgBlue: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    textBlue: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
    badgeText: { fontSize: 12, fontWeight: 'bold' },

    empty: { textAlign: 'center', marginTop: 50, color: theme.colors.text.light }
});
