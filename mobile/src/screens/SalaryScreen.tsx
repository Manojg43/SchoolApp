import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { mobileApi } from '../lib/api';
import { useNavigation } from '@react-navigation/native';

export default function SalaryScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getMyAttendanceReport(month, year);
            setReport(data);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (delta: number) => {
        let newMonth = month + delta;
        let newYear = year;

        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }

        setMonth(newMonth);
        setYear(newYear);
    };

    const totalSalary = report?.daily_logs?.reduce((sum: number, item: any) => sum + (item.daily_salary || 0), 0) || 0;

    const handleDownload = async (id: number) => {
        try {
            const res = await mobileApi.getPayslipLink(id);
            if (res.url) {
                Linking.openURL(res.url).catch(err => Alert.alert("Error", "Could not open browser"));
            } else {
                Alert.alert("Error", "Failed to generate link");
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to download");
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.row}>
            <View style={styles.dateCol}>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.dayText}>Day {item.day}</Text>
                {/* Download Button for Day? No, payslip is monthly. 
                    Wait, SalaryScreen shows DAILY LOGS.
                    Where is the MONTHLY salary card? 
                    Ah, row 92 is Summary Card. 
                    I should put Download Button inside Summary Card usually.
                    OR does the user want Daily Payslip? No, Monthly.
                    The list is DAILY ATTENDANCE.
                    The Summary Card shows Total Earnings.
                    I should add Download Button to Summary Card.
                */}
            </View>
            <View style={styles.timeCol}>
                {item.status === 'PRESENT' || item.status === 'HALF_DAY' ? (
                    <>
                        <Text style={styles.timeText}>In: {item.check_in?.slice(0, 5) || '--:--'}</Text>
                        <Text style={styles.timeText}>Out: {item.check_out?.slice(0, 5) || '--:--'}</Text>
                    </>
                ) : (
                    <Text style={[
                        styles.statusText,
                        item.status === 'ABSENT' ? styles.textRed :
                            item.status === 'LEAVE' ? styles.textOrange : styles.textGray
                    ]}>{item.status}</Text>
                )}
            </View>
            <View style={styles.salaryCol}>
                <Text style={styles.salaryText}>₹{item.daily_salary}</Text>
            </View>
        </View>
    );

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Salary & Attendance</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>

            {/* Month Selector */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <Text style={styles.navText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{monthName} {year}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <Text style={styles.navText}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Present Days</Text>
                    <Text style={styles.summaryValue}>{report?.stats?.present || 0}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Earnings</Text>
                    <Text style={[styles.summaryValue, styles.textGreen]}>₹{Math.round(totalSalary).toLocaleString()}</Text>
                </View>

                {report?.salary_generated && (
                    <TouchableOpacity onPress={() => handleDownload(report.salary_id)} style={styles.downloadBtn}>
                        <Text style={styles.downloadText}>Download Payslip</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Header Row */}
            <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.dateCol]}>Date</Text>
                <Text style={[styles.th, styles.timeCol]}>Timing / Status</Text>
                <Text style={[styles.th, styles.salaryCol]}>Earned</Text>
            </View>

            <FlatList
                data={report?.daily_logs || []}
                keyExtractor={(item) => item.date}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={loadData}
                ListEmptyComponent={<Text style={styles.emptyText}>No data available</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, paddingTop: 50, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    closeText: { color: '#3B82F6', fontSize: 16 },

    monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', marginBottom: 10 },
    navBtn: { padding: 10 },
    navText: { fontSize: 20, fontWeight: 'bold', color: '#374151' },
    monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    summaryCard: { flexDirection: 'row', backgroundColor: 'white', margin: 15, padding: 15, borderRadius: 10, justifyContent: 'space-around', elevation: 2 },
    summaryItem: { alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: '#6B7280' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#E5E7EB' },
    th: { fontWeight: 'bold', color: '#4B5563', fontSize: 12 },
    list: { paddingHorizontal: 15, paddingBottom: 20 },

    row: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },

    dateCol: { flex: 1.2 },
    timeCol: { flex: 2 },
    salaryCol: { flex: 1, alignItems: 'flex-end' },

    dateText: { fontWeight: '600', color: '#374151', fontSize: 13 },
    dayText: { fontSize: 10, color: '#9CA3AF' },
    timeText: { fontSize: 12, color: '#4B5563' },
    salaryText: { fontWeight: 'bold', color: '#10B981' },

    statusText: { fontSize: 12, fontWeight: 'bold' },
    textRed: { color: '#EF4444' },
    textOrange: { color: '#F59E0B' },
    textGreen: { color: '#10B981' },
    textGray: { color: '#9CA3AF' },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },

    downloadBtn: { position: 'absolute', bottom: -15, alignSelf: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, elevation: 2 },
    downloadText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});
