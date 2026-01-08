import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, Bell, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';

import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function NoticeBoardScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [notices, setNotices] = useState<any[]>([]);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getNotices();
            setNotices(data);
        } catch (e: any) {
            Alert.alert("Error", "Failed to load notices");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedIds.includes(id)) {
            setExpandedIds(prev => prev.filter(i => i !== id));
        } else {
            setExpandedIds(prev => [...prev, id]);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
            <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.9}
            >
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBox}>
                            <Bell size={20} color={theme.colors.primary} />
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                        <View>
                            {isExpanded ? <ChevronUp size={20} color={theme.colors.text.light} /> : <ChevronDown size={20} color={theme.colors.text.light} />}
                        </View>
                    </View>
                    {isExpanded && (
                        <View style={styles.cardBody}>
                            <Text style={styles.content}>{item.content}</Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={theme.colors.text.main} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Notice Board</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && notices.length === 0 ? (
                <View style={styles.list}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={[styles.card, { opacity: 0.5, height: 100 }]} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={notices}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No new notices.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: theme.colors.surface },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.main },

    list: { padding: 15 },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79, 70, 229, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.main },
    date: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
    cardBody: { padding: 15, paddingTop: 0, borderTopWidth: 1, borderTopColor: theme.colors.border },
    content: { fontSize: 14, color: theme.colors.text.main, lineHeight: 22, marginTop: 10 },
    emptyText: { color: theme.colors.text.muted, fontSize: 16 }
});
