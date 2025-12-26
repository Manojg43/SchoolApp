import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mobileApi } from '../lib/api';
import { QrCode, LogOut, User, Menu, Calendar, IndianRupee, CalendarCheck, Bell, BookOpen, FileText } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

export default function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await mobileApi.getMyProfile();
            setDashboardData(data);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
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
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <LogOut color={theme.colors.text.muted} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Attendance Summary */}
                    <Text style={styles.sectionTitle}>Attendance ({new Date().toLocaleString('default', { month: 'long' })})</Text>
                    <View style={styles.statsRow}>
                        <Card style={[styles.statCard]}>
                            <Text style={styles.cardLabel}>Present</Text>
                            <Text style={[styles.cardValue, { color: theme.colors.success }]}>{att.present || 0}</Text>
                        </Card>
                        <Card style={[styles.statCard]}>
                            <Text style={styles.cardLabel}>Absent</Text>
                            <Text style={[styles.cardValue, { color: theme.colors.error }]}>{att.absent || 0}</Text>
                        </Card>
                        <Card style={[styles.statCard]}>
                            <Text style={styles.cardLabel}>Leaves</Text>
                            <Text style={[styles.cardValue, { color: theme.colors.warning }]}>{att.leaves || 0}</Text>
                        </Card>
                    </View>

                    {/* Salary Card */}
                    <Text style={styles.sectionTitle}>Salary Status</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Salary')}>
                        <Card style={styles.salaryCard}>
                            <View style={styles.salaryHeader}>
                                <View style={styles.iconContainer}>
                                    <IndianRupee color={theme.colors.primary} size={24} />
                                </View>
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
                            <Text style={styles.salaryFooter}>Based on {salary.present_days || 0} Working Days</Text>
                        </Card>
                    </TouchableOpacity>

                    {/* Primary Action */}
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => navigation.navigate('Scan')}
                        activeOpacity={0.9}
                    >
                        <QrCode color="white" size={32} />
                        <View style={styles.scanTextContainer}>
                            <Text style={styles.scanButtonText}>Scan Attendance</Text>
                            <Text style={styles.scanButtonSubText}>Scan School QR to Mark Check-In</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Other Actions */}
                    <View style={styles.grid}>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Profile')}>
                            <Card style={styles.gridItem}>
                                <User color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Profile</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Leave')}>
                            <Card style={styles.gridItem}>
                                <Menu color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Leave</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('DailyAttendance')}>
                            <Card style={styles.gridItem}>
                                <CalendarCheck color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Logs</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Timetable')}>
                            <Card style={styles.gridItem}>
                                <Calendar color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Timetable</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Notices')}>
                            <Card style={styles.gridItem}>
                                <Bell color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Notices</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Homework')}>
                            <Card style={styles.gridItem}>
                                <BookOpen color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>Homework</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('EnquiryList')}>
                            <Card style={styles.gridItem}>
                                <FileText color={theme.colors.secondary} size={28} />
                                <Text style={styles.gridLabel}>Enquiries</Text>
                            </Card>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    schoolName: {
        fontSize: 14,
        color: theme.colors.text.muted,
        marginBottom: 2,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text.main,
    },
    designation: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    logoutBtn: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.main,
        marginBottom: 12,
        marginTop: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    cardLabel: {
        color: theme.colors.text.muted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    salaryCard: {
        marginBottom: 24,
        padding: 20,
    },
    salaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        padding: 8,
        backgroundColor: 'rgba(79, 70, 229, 0.1)', // Primary alpha
        borderRadius: 8,
    },
    salaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.main,
        marginLeft: 12,
    },
    salaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    salaryAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text.main,
    },
    salaryFooter: {
        fontSize: 13,
        color: theme.colors.text.muted,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgePaid: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    badgePending: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textPaid: {
        color: theme.colors.success,
    },
    textPending: {
        color: theme.colors.warning,
    },
    scanButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: theme.borderRadius.l,
        marginBottom: 32,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    scanTextContainer: {
        marginLeft: 16,
    },
    scanButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 20,
        fontWeight: 'bold',
    },
    scanButtonSubText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItemContainer: {
        width: '31%', // 3 column approx
    },
    gridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        padding: 16,
    },
    gridLabel: {
        marginTop: 12,
        color: theme.colors.text.main,
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    }
});
