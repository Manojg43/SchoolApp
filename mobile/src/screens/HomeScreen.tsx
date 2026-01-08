import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mobileApi } from '../lib/api';
import { QrCode, LogOut, User, Menu, Calendar, IndianRupee, CalendarCheck, Bell, BookOpen, FileText, CheckSquare, Users, GraduationCap, ClipboardList } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';

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
        // Just clear token to logout
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
    const adminStats = dashboardData?.admin_stats;
    const isPrincipal = user.designation === 'Principal';

    const renderStaffDashboard = () => (
        <>
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
                style={styles.scanButtonWrapper}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={theme.linearGradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scanButton}
                >
                    <QrCode color="white" size={32} />
                    <View style={styles.scanTextContainer}>
                        <Text style={styles.scanButtonText}>Scan Attendance</Text>
                        <Text style={styles.scanButtonSubText}>Scan School QR to Mark Check-In</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </>
    );

    const renderPrincipalDashboard = () => (
        <>
            {/* School Overview Stats */}
            <Text style={styles.sectionTitle}>School Overview</Text>
            <View style={styles.grid}>
                <Card style={[styles.statCard, { width: '48%' }]}>
                    <Users color={theme.colors.primary} size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.cardLabel}>Total Staff</Text>
                    <Text style={styles.cardValue}>{adminStats.staff_count || 0}</Text>
                </Card>
                <Card style={[styles.statCard, { width: '48%' }]}>
                    <GraduationCap color={theme.colors.secondary} size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.cardLabel}>Students</Text>
                    <Text style={styles.cardValue}>{adminStats.student_count || 0}</Text>
                </Card>
                <Card style={[styles.statCard, { width: '48%' }]}>
                    <CalendarCheck color={theme.colors.success} size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.cardLabel}>Staff Present</Text>
                    <Text style={styles.cardValue}>{adminStats.staff_present_today || 0}</Text>
                </Card>
                <Card style={[styles.statCard, { width: '48%' }]}>
                    <ClipboardList color={theme.colors.warning} size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.cardLabel}>Enquiries</Text>
                    <Text style={styles.cardValue}>{adminStats.pending_enquiries || 0}</Text>
                </Card>
            </View>

            {/* Principal Special Actions */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Management Tools</Text>
            <View style={styles.managementStats}>
                <TouchableOpacity
                    style={styles.manageCard}
                    onPress={() => navigation.navigate('LeaveApproval')}
                >
                    <Card style={[styles.innerManageCard, { borderColor: theme.colors.warning + '40', borderWidth: 1 }]}>
                        <View style={styles.manageIconContainer}>
                            <CheckSquare color={theme.colors.warning} size={28} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.manageTitle}>Leave Approvals</Text>
                            <Text style={styles.manageSub}>{adminStats.pending_leaves || 0} Requests Pending</Text>
                        </View>
                        <Text style={[styles.manageCount, { color: theme.colors.warning }]}>{adminStats.pending_leaves || 0}</Text>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.manageCard}
                    onPress={() => navigation.navigate('EnquiryList')}
                >
                    <Card style={[styles.innerManageCard, { borderColor: theme.colors.secondary + '40', borderWidth: 1 }]}>
                        <View style={[styles.manageIconContainer, { backgroundColor: theme.colors.secondary + '10' }]}>
                            <FileText color={theme.colors.secondary} size={28} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.manageTitle}>Admission Enquiries</Text>
                            <Text style={styles.manageSub}>Track new leads</Text>
                        </View>
                        <Text style={[styles.manageCount, { color: theme.colors.secondary }]}>{adminStats.pending_enquiries || 0}</Text>
                    </Card>
                </TouchableOpacity>
            </View>
        </>
    );

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
                <View>
                    {isPrincipal ? renderPrincipalDashboard() : renderStaffDashboard()}

                    {/* Common Grid Actions */}
                    <Text style={styles.sectionTitle}>Application Features</Text>
                    <View style={styles.grid}>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Profile')}>
                            <Card style={styles.gridItem}>
                                <User color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>My Profile</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('Leave')}>
                            <Card style={styles.gridItem}>
                                <Menu color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>My Leave</Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItemContainer} onPress={() => navigation.navigate('DailyAttendance')}>
                            <Card style={styles.gridItem}>
                                <CalendarCheck color={theme.colors.primary} size={28} />
                                <Text style={styles.gridLabel}>My Logs</Text>
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
                    </View>
                </View>
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
        // Removed border for cleaner look
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
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // Primary Alpha
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
    scanButtonWrapper: {
        marginBottom: 32,
        borderRadius: theme.borderRadius.l,
        ...theme.shadows.glass,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: theme.borderRadius.l,
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
        color: 'rgba(255, 255, 255, 0.9)',
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
    },
    managementStats: {
        gap: 16,
    },
    manageCard: {
        width: '100%',
    },
    innerManageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    manageIconContainer: {
        padding: 12,
        backgroundColor: theme.colors.warning + '10',
        borderRadius: 12,
    },
    manageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.main,
        marginBottom: 2,
    },
    manageSub: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    manageCount: {
        fontSize: 20,
        fontWeight: 'bold',
    }
});
