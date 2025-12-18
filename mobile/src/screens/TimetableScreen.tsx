import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, Clock, BookOpen, User } from 'lucide-react-native';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function TimetableScreen() {
    const navigation = useNavigation();
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'MONDAY');
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => {
        loadSchedule();
    }, [selectedDay]);

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getTimetable(selectedDay);
            setSchedule(data);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{item.start_time}</Text>
                <Text style={styles.timeEnd}>{item.end_time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoCol}>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.classInfo}>{item.class_name} {item.section ? `(${item.section})` : ''}</Text>
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
                <Text style={styles.title}>My Timetable</Text>
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
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={schedule}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <BookOpen color="#9ca3af" size={48} />
                            <Text style={styles.emptyText}>No classes scheduled for {selectedDay}</Text>
                        </View>
                    }
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

    daySelector: { backgroundColor: 'white', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    dayList: { paddingHorizontal: 15, gap: 10 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
    activeDayChip: { backgroundColor: '#3b82f6' },
    dayText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    activeDayText: { color: 'white' },

    list: { padding: 15 },
    card: { backgroundColor: 'white', flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    timeCol: { width: 60, alignItems: 'center', justifyContent: 'center' },
    timeStart: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    timeEnd: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    divider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 15 },
    infoCol: { flex: 1, justifyContent: 'center' },
    subject: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    classInfo: { fontSize: 14, color: '#6b7280', fontWeight: '500' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, fontSize: 16, color: '#9ca3af' }
});
