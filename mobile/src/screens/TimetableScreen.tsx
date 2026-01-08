import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, Clock, BookOpen, User } from 'lucide-react-native';

import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function TimetableScreen() {
    const navigation = useNavigation();
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'MONDAY');
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isPrincipal, setIsPrincipal] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, [selectedDay]);

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const profile = await mobileApi.getMyProfile();
            setIsPrincipal(profile.user.designation === 'Principal');

            const data = await mobileApi.getTimetable(selectedDay);
            setSchedule(data);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{item.start_time}</Text>
                <Text style={styles.timeEnd}>{item.end_time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoCol}>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.classInfo}>
                    {item.class_name} {item.section ? `(${item.section})` : ''}
                    {isPrincipal && ` • ${item.teacher_name}`}
                </Text>
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
                <Text style={styles.title}>{isPrincipal ? 'School Timetable' : 'My Timetable'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Day Selector */}
            <View style={styles.daySelector}>
                <FlatList
                    horizontal
                    data={DAYS}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.dayChip, selectedDay === item && styles.activeDayChip]}
                            onPress={() => setSelectedDay(item)}
                        >
                            <Text style={[styles.dayText, selectedDay === item && styles.activeDayText]}>
                                {item.slice(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.dayList}
                />
            </View>

            {/* Schedule List */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={schedule}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <BookOpen color={theme.colors.text.light} size={48} />
                            <Text style={styles.emptyText}>No classes scheduled for {selectedDay}</Text>
                        </View>
                    }
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

    daySelector: { backgroundColor: theme.colors.surface, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    dayList: { paddingHorizontal: 15, gap: 10 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background, marginRight: 8 },
    activeDayChip: { backgroundColor: theme.colors.primary },
    dayText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.muted },
    activeDayText: { color: 'white' },

    list: { padding: 15 },
    card: { backgroundColor: theme.colors.surface, flexDirection: 'row', padding: 15, borderRadius: theme.borderRadius.m, marginBottom: 10 },
    timeCol: { width: 60, alignItems: 'center', justifyContent: 'center' },
    timeStart: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.main },
    timeEnd: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
    divider: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: 15 },
    infoCol: { flex: 1, justifyContent: 'center' },
    subject: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.main, marginBottom: 4 },
    classInfo: { fontSize: 14, color: theme.colors.text.muted, fontWeight: '500' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, fontSize: 16, color: theme.colors.text.muted }
});
