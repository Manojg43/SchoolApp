import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { mobileApi } from '../lib/api';

interface Enquiry {
    id: number;
    enquiry_id: string;
    full_name: string;
    class_name: string;
    parent_mobile: string;
    status: string;
    current_stage_name: string; // Added for workflow stage display
    created_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    'PENDING': { bg: '#fef3c7', text: '#92400e', icon: Clock },
    'IN_PROGRESS': { bg: '#dbeafe', text: '#1e40af', icon: Clock },
    'APPROVED': { bg: '#d1fae5', text: '#065f46', icon: CheckCircle },
    'REJECTED': { bg: '#fee2e2', text: '#991b1b', icon: XCircle },
    'CONVERTED': { bg: '#e9d5ff', text: '#6b21a8', icon: CheckCircle },
};

export default function EnquiryListScreen() {
    const navigation = useNavigation<any>();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadEnquiries = async () => {
        try {
            const data = await mobileApi.getMyEnquiries();
            setEnquiries(data);
        } catch (error) {
            console.error('Failed to load enquiries', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadEnquiries();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadEnquiries();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderItem = ({ item }: { item: Enquiry }) => {
        const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS['PENDING'];
        const StatusIcon = statusConfig.icon;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('EnquiryDetail', { id: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.enquiryId}>{item.enquiry_id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <StatusIcon size={12} color={statusConfig.text} />
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>
                            {item.status.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <Text style={styles.studentName}>{item.full_name}</Text>

                {/* Workflow Stage Display */}
                {item.current_stage_name && (
                    <View style={styles.stageRow}>
                        <Text style={styles.stageLabel}>Stage:</Text>
                        <Text style={styles.stageValue}>{item.current_stage_name}</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerLabel}>Class: {item.class_name || 'N/A'}</Text>
                        <Text style={styles.footerLabel}>•</Text>
                        <Text style={styles.footerLabel}>{formatDate(item.created_at)}</Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.text.muted} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Enquiries</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('EnquiryForm')}
                    style={styles.addBtn}
                >
                    <Plus size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : enquiries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FileText size={48} color={theme.colors.text.muted} style={{ opacity: 0.3 }} />
                    <Text style={styles.emptyText}>No enquiries yet</Text>
                    <TouchableOpacity
                        style={styles.newEnquiryBtn}
                        onPress={() => navigation.navigate('EnquiryForm')}
                    >
                        <Plus size={18} color="#fff" />
                        <Text style={styles.newEnquiryText}>New Enquiry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={enquiries}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB */}
            {enquiries.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('EnquiryForm')}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.main,
    },
    addBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    enquiryId: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
        fontFamily: 'monospace',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.main,
        marginBottom: 8,
    },
    stageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stageLabel: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    stageValue: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
        marginLeft: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerInfo: {
        flexDirection: 'row',
        gap: 8,
    },
    footerLabel: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.text.muted,
    },
    newEnquiryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    newEnquiryText: {
        color: '#fff',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
});
