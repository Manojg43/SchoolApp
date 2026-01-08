import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { mobileApi } from '../lib/api';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Check, X, Calendar, User, MessageSquare, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function LeaveApprovalScreen() {
    const navigation = useNavigation();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            const data = await mobileApi.getPendingLeaves();
            setLeaves(data);
        } catch (e) {
            console.error("Failed to load leaves", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAction = (id: number, action: 'APPROVE' | 'REJECT') => {
        Alert.alert(
            `${action === 'APPROVE' ? 'Approve' : 'Reject'} Leave`,
            `Are you sure you want to ${action.toLowerCase()} this leave application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action,
                    style: action === 'REJECT' ? 'destructive' : 'default',
                    onPress: () => performAction(id, action)
                }
            ]
        );
    };

    const performAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
        setProcessingId(id);
        try {
            await mobileApi.processLeaveAction(id, action);
            Alert.alert('Success', `Leave ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
            loadLeaves();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to process action');
        } finally {
            setProcessingId(null);
        }
    };

    const renderLeaveItem = ({ item }: { item: any }) => (
        <Card style={styles.leaveCard}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <User color={theme.colors.primary} size={20} />
                    </View>
                    <Text style={styles.staffName}>{item.staff_name}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Calendar size={12} color={theme.colors.text.muted} />
                    <Text style={styles.dateText}>{item.start_date} to {item.end_date}</Text>
                </View>
            </View>

            <View style={styles.reasonContainer}>
                <MessageSquare size={16} color={theme.colors.text.light} style={styles.reasonIcon} />
                <Text style={styles.reasonText}>{item.reason || "No reason provided"}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(item.id, 'REJECT')}
                    disabled={processingId === item.id}
                >
                    <X color={theme.colors.error} size={20} />
                    <Text style={[styles.btnText, { color: theme.colors.error }]}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction(item.id, 'APPROVE')}
                    disabled={processingId === item.id}
                >
                    {processingId === item.id ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Check color="white" size={20} />
                            <Text style={[styles.btnText, { color: 'white' }]}>Approve</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={theme.colors.text.main} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Leave Approvals</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={leaves}
                    renderItem={renderLeaveItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLeaves(); }} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No pending leave applications</Text>
                        </View>
                    }
                />
            )}
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.main,
    },
    list: {
        padding: 20,
    },
    leaveCard: {
        marginBottom: 16,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.main,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: theme.colors.text.muted,
        fontWeight: '600',
    },
    reasonContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    reasonIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    reasonText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.muted,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    rejectBtn: {
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    approveBtn: {
        backgroundColor: theme.colors.primary,
    },
    btnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.text.muted,
        fontSize: 16,
    }
});
