import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
    ArrowLeft, CheckCircle, XCircle, Clock, Phone, Mail, MapPin,
    Calendar, User, FileText, Building, ChevronRight, ArrowRight
} from 'lucide-react-native';
import { theme } from '../constants/theme';
import { mobileApi } from '../lib/api';

interface EnquiryDetail {
    id: number;
    enquiry_id: string;
    status: string;
    priority: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    class_name: string;
    parent_name: string;
    parent_mobile: string;
    parent_email: string;
    address: string;
    previous_school_name: string;
    workflow_name: string;
    current_stage_name: string;
    filled_by_name: string;
    filled_via: string;
    created_at: string;
    notes: string;
    stage_progress: any[];
    documents: any[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    'PENDING': { bg: '#fef3c7', text: '#92400e', icon: Clock },
    'IN_PROGRESS': { bg: '#dbeafe', text: '#1e40af', icon: Clock },
    'APPROVED': { bg: '#d1fae5', text: '#065f46', icon: CheckCircle },
    'REJECTED': { bg: '#fee2e2', text: '#991b1b', icon: XCircle },
    'CONVERTED': { bg: '#e9d5ff', text: '#6b21a8', icon: CheckCircle },
};

export default function EnquiryDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params as { id: number };

    const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPrincipal, setIsPrincipal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const loadEnquiry = async () => {
        try {
            const profile = await mobileApi.getMyProfile();
            setIsPrincipal(profile.user.designation === 'Principal');

            const data = await mobileApi.getEnquiryDetail(id);
            setEnquiry(data);
        } catch (error) {
            console.error('Failed to load enquiry', error);
            Alert.alert('Error', 'Failed to load enquiry details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadEnquiry();
        }, [id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadEnquiry();
    };

    const handleAdvance = async () => {
        Alert.alert(
            "Advance Stage",
            "Are you sure you want to move this enquiry to the next stage?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Advance",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await mobileApi.advanceEnquiryStage(id);
                            Alert.alert("Success", "Enquiry moved to next stage");
                            loadEnquiry();
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Failed to advance stage");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        Alert.alert(
            "Reject Enquiry",
            "Are you sure you want to reject this enquiry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await mobileApi.rejectEnquiry(id);
                            Alert.alert("Success", "Enquiry rejected");
                            loadEnquiry();
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Failed to reject enquiry");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!enquiry) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Enquiry not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusConfig = STATUS_COLORS[enquiry.status] || STATUS_COLORS['PENDING'];
    const StatusIcon = statusConfig.icon;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Enquiry Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <Text style={styles.enquiryId}>{enquiry.enquiry_id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <StatusIcon size={14} color={statusConfig.text} />
                            <Text style={[styles.statusText, { color: statusConfig.text }]}>
                                {enquiry.status.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.studentName}>{enquiry.full_name}</Text>
                    {enquiry.current_stage_name && (
                        <View style={styles.stageRow}>
                            <Text style={styles.stageLabel}>Current Stage:</Text>
                            <Text style={styles.stageValue}>{enquiry.current_stage_name}</Text>
                        </View>
                    )}
                    {enquiry.workflow_name && (
                        <View style={styles.workflowRow}>
                            <Text style={styles.workflowLabel}>Workflow:</Text>
                            <Text style={styles.workflowValue}>{enquiry.workflow_name}</Text>
                        </View>
                    )}
                </View>

                {/* Student Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Student Information</Text>

                    <View style={styles.infoRow}>
                        <User size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Full Name</Text>
                            <Text style={styles.infoValue}>{enquiry.full_name}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Calendar size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Date of Birth</Text>
                            <Text style={styles.infoValue}>{formatDate(enquiry.date_of_birth)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <FileText size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Gender</Text>
                            <Text style={styles.infoValue}>
                                {enquiry.gender === 'M' ? 'Male' : enquiry.gender === 'F' ? 'Female' : 'Other'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <FileText size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Class Applied</Text>
                            <Text style={styles.infoValue}>{enquiry.class_name || 'Not specified'}</Text>
                        </View>
                    </View>
                </View>

                {/* Parent Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parent / Guardian</Text>

                    <View style={styles.infoRow}>
                        <User size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Parent Name</Text>
                            <Text style={styles.infoValue}>{enquiry.parent_name}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Phone size={18} color={theme.colors.text.muted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Mobile</Text>
                            <Text style={styles.infoValue}>{enquiry.parent_mobile}</Text>
                        </View>
                    </View>

                    {enquiry.parent_email && (
                        <View style={styles.infoRow}>
                            <Mail size={18} color={theme.colors.text.muted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{enquiry.parent_email}</Text>
                            </View>
                        </View>
                    )}

                    {enquiry.address && (
                        <View style={styles.infoRow}>
                            <MapPin size={18} color={theme.colors.text.muted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Address</Text>
                                <Text style={styles.infoValue}>{enquiry.address}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Additional Info */}
                {(enquiry.previous_school_name || enquiry.notes) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>

                        {enquiry.previous_school_name && (
                            <View style={styles.infoRow}>
                                <Building size={18} color={theme.colors.text.muted} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Previous School</Text>
                                    <Text style={styles.infoValue}>{enquiry.previous_school_name}</Text>
                                </View>
                            </View>
                        )}

                        {enquiry.notes && (
                            <View style={styles.infoRow}>
                                <FileText size={18} color={theme.colors.text.muted} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Notes</Text>
                                    <Text style={styles.infoValue}>{enquiry.notes}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Workflow Progress */}
                {enquiry.stage_progress && enquiry.stage_progress.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Workflow Progress</Text>
                        {enquiry.stage_progress.map((stage: any, index: number) => (
                            <View key={stage.id || index} style={styles.stageItem}>
                                <View style={[
                                    styles.stageIndicator,
                                    stage.status === 'COMPLETED' && styles.stageIndicatorCompleted,
                                    stage.status === 'PENDING' && styles.stageIndicatorPending,
                                ]}>
                                    {stage.status === 'COMPLETED' ? (
                                        <CheckCircle size={16} color="#fff" />
                                    ) : (
                                        <Clock size={16} color={theme.colors.text.muted} />
                                    )}
                                </View>
                                <View style={styles.stageContent}>
                                    <Text style={styles.stageName}>{stage.stage_name}</Text>
                                    <Text style={styles.stageStatus}>
                                        {stage.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Meta Info */}
                <View style={styles.metaSection}>
                    <Text style={styles.metaText}>
                        Filled by {enquiry.filled_by_name} via {enquiry.filled_via} on {formatDate(enquiry.created_at)}
                    </Text>
                </View>

                {/* Principal Actions */}
                {isPrincipal && (enquiry.status === 'PENDING' || enquiry.status === 'IN_PROGRESS') && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={handleReject}
                            disabled={actionLoading}
                        >
                            <XCircle size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.advanceBtn]}
                            onPress={handleAdvance}
                            disabled={actionLoading}
                        >
                            <ArrowRight size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>
                                {enquiry.status === 'PENDING' ? 'Start Process' : 'Next Stage'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.text.muted,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
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
    scrollView: {
        flex: 1,
    },
    statusCard: {
        margin: 16,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statusHeader: {
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    studentName: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.main,
        marginBottom: 12,
    },
    stageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    stageLabel: {
        fontSize: 13,
        color: theme.colors.text.muted,
    },
    stageValue: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
        marginLeft: 8,
    },
    workflowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    workflowLabel: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    workflowValue: {
        fontSize: 12,
        color: theme.colors.text.muted,
        marginLeft: 8,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.main,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: theme.colors.text.muted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: theme.colors.text.main,
    },
    stageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    stageIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    stageIndicatorCompleted: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    stageIndicatorPending: {
        backgroundColor: theme.colors.background,
    },
    stageContent: {
        flex: 1,
    },
    stageName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.main,
    },
    stageStatus: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    metaSection: {
        marginHorizontal: 16,
        paddingVertical: 12,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.text.muted,
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    rejectBtn: {
        backgroundColor: theme.colors.error,
    },
    advanceBtn: {
        backgroundColor: theme.colors.success,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
