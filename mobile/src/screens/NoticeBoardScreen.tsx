import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, Bell, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';

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
                style={styles.card}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <Bell size={20} color="#0f52ba" />
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.date}>{item.date}</Text>
                    </View>
                    <View>
                        {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                    </View>
                </View>
                {isExpanded && (
                    <View style={styles.cardBody}>
                        <Text style={styles.content}>{item.content}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1f2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Notice Board</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0f52ba" />
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
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'white' },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

    list: { padding: 15 },
    card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerContent: { flex: 1 },
    date: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    cardBody: { padding: 15, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    content: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 10 },
    emptyText: { color: '#9ca3af', fontSize: 16 }
});
