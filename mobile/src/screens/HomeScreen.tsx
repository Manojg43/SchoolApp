import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mobileApi } from '../lib/api';
import { QrCode, LogOut, User, Menu, Calendar, IndianRupee, CalendarCheck } from 'lucide-react-native';

export default function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await mobileApi.getMyProfile(); // This now returns { user, attendance, salary }
            setDashboardData(data);
        } catch (e) {
            // console.log("Failed to load dashboard", e);
        }
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('auth_token');
        navigation.replace('Login');
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const user = dashboardData?.user || {};
    const att = dashboardData?.attendance || {};
    const salary = dashboardData?.salary || {};

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.schoolName}>{user.school || 'My School'}</Text>
                    <Text style={styles.userName}>{user.first_name || 'Staff'} {user.last_name || ''}</Text>
                    <Text style={styles.designation}>{user.designation || 'Teacher'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <LogOut color="#6b7280" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Attendance Summary */}
                <Text style={styles.sectionTitle}>Attendance ({new Date().toLocaleString('default', { month: 'long' })})</Text>
                <View style={styles.statsRow}>
                    <View style={[styles.card, styles.statCard]}>
                        <Text style={styles.cardLabel}>Present</Text>
                        <Text style={[styles.cardValue, { color: '#059669' }]}>{att.present || 0}</Text>
                    </View>
                    <View style={[styles.card, styles.statCard]}>
                        <Text style={styles.cardLabel}>Absent</Text>
                        <Text style={[styles.cardValue, { color: '#dc2626' }]}>{att.absent || 0}</Text>
                    </View>
                    <View style={[styles.card, styles.statCard]}>
                        <Text style={styles.cardLabel}>Leaves</Text>
                        <Text style={[styles.cardValue, { color: '#d97706' }]}>{att.leaves || 0}</Text>
                    </View>
                </View>

                {/* Salary Card */}
                <Text style={styles.sectionTitle}>Salary Status</Text>
                <TouchableOpacity style={styles.salaryCard} onPress={() => navigation.navigate('Salary')}>
                    <View style={styles.salaryHeader}>
                        <IndianRupee color="#0f52ba" size={24} />
                        <Text style={styles.salaryTitle}>Last Month: {salary.month || '-'}</Text>
                    </View>
                    <View style={styles.salaryContent}>
                        <Text style={styles.salaryAmount}>₹{salary.net_salary || '0.00'}</Text>
                        <View style={[styles.badge, salary.is_paid ? styles.badgePaid : styles.badgePending]}>
                            <Text style={[styles.badgeText, salary.is_paid ? styles.textPaid : styles.textPending]}>
                                {salary.is_paid ? 'PAID' : 'PENDING'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.salaryFooter}>Based on {salary.present_days || 0} Present Days</Text>
                </TouchableOpacity>

                {/* Primary Action */}
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => navigation.navigate('Scan')}
                >
                    <QrCode color="white" size={32} />
                    <View style={styles.scanTextContainer}>
                        <Text style={styles.scanButtonText}>Scan Attendance</Text>
                        <Text style={styles.scanButtonSubText}>Scan School QR to Mark Check-In</Text>
                    </View>
                </TouchableOpacity>

                {/* Other Actions */}
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => Alert.alert("Coming Soon", "Profile edit coming soon.")}>
                        <User color="#0f52ba" size={24} />
                        <Text style={styles.gridLabel}>My Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Leave')}>
                        <Menu color="#0f52ba" size={24} />
                        <Text style={styles.gridLabel}>Apply Leave</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DailyAttendance')}>
                        <Calendar color="#0f52ba" size={24} />
                        <Text style={styles.gridLabel}>Daily Attendance</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    schoolName: {
        fontSize: 14,
        color: '#6b7280',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    designation: {
        fontSize: 14,
        color: '#0f52ba',
        fontWeight: '500',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 10,
        marginTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statCard: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    salaryCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    salaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    salaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    salaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    salaryAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    salaryFooter: {
        fontSize: 12,
        color: '#6b7280',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgePaid: {
        backgroundColor: '#ecfdf5',
    },
    badgePending: {
        backgroundColor: '#fffbeb',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textPaid: {
        color: '#059669',
    },
    textPending: {
        color: '#d97706',
    },
    scanButton: {
        backgroundColor: '#0f52ba',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 30,
        shadowColor: '#0f52ba',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    scanTextContainer: {
        marginLeft: 15,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scanButtonSubText: {
        color: '#bfdbfe',
        fontSize: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    gridItem: {
        width: '30%',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    gridLabel: {
        marginTop: 10,
        color: '#374151',
        fontWeight: '500',
        fontSize: 12,
        textAlign: 'center',
    }
});
