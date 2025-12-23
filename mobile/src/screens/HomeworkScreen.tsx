import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, BookOpen, Plus, Calendar as CalendarIcon, Save } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';

export default function HomeworkScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'ADD'>('HISTORY');
    const [loading, setLoading] = useState(false);
    const [homeworkList, setHomeworkList] = useState<any[]>([]);

    // Add Form State
    const [form, setForm] = useState({
        subject: '',
        title: '',
        description: '',
        class_id: '',
        due_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (activeTab === 'HISTORY') loadHistory();
    }, [activeTab]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getHomework();
            setHomeworkList(data);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.class_id || !form.subject || !form.title) {
            Alert.alert("Error", "Please fill required fields (Class ID, Subject, Title)");
            return;
        }

        setLoading(true);
        try {
            await mobileApi.addHomework(form);
            Alert.alert("Success", "Homework Added");
            setActiveTab('HISTORY');
            setForm({ subject: '', title: '', description: '', class_id: '', due_date: new Date().toISOString().split('T')[0] });
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to add homework");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <BookOpen size={20} color={theme.colors.primary} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.subject}>{item.subject}</Text>
                    <Text style={styles.className}>{item.class_name} {item.section}</Text>
                </View>
                <Text style={styles.date}>{item.created_at}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
            </View>
            <View style={styles.footer}>
                <View style={styles.dueBox}>
                    <CalendarIcon size={14} color={theme.colors.error} />
                    <Text style={styles.due}>Due: {item.due_date}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={theme.colors.text.main} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Homework</Text>
                {activeTab === 'HISTORY' ? (
                    <TouchableOpacity onPress={() => setActiveTab('ADD')} style={styles.addBtn}>
                        <Plus color={theme.colors.primary} size={24} />
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]}
                    onPress={() => setActiveTab('HISTORY')}
                >
                    <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'ADD' && styles.activeTab]}
                    onPress={() => setActiveTab('ADD')}
                >
                    <Text style={[styles.tabText, activeTab === 'ADD' && styles.activeTabText]}>Assign New</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'ADD' ? (
                <ScrollView contentContainerStyle={styles.formPadding}>
                    <Card style={styles.formCard}>
                        <Text style={styles.formTitle}>Assign Homework</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Class ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 1"
                                placeholderTextColor={theme.colors.text.light}
                                keyboardType="numeric"
                                value={form.class_id}
                                onChangeText={t => setForm({ ...form, class_id: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Subject</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Mathematics"
                                placeholderTextColor={theme.colors.text.light}
                                value={form.subject}
                                onChangeText={t => setForm({ ...form, subject: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Topic Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Algebra Exercise 1.2"
                                placeholderTextColor={theme.colors.text.light}
                                value={form.title}
                                onChangeText={t => setForm({ ...form, title: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Detailed instructions for students..."
                                placeholderTextColor={theme.colors.text.light}
                                multiline
                                textAlignVertical="top"
                                value={form.description}
                                onChangeText={t => setForm({ ...form, description: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.text.light}
                                value={form.due_date}
                                onChangeText={t => setForm({ ...form, due_date: t })}
                            />
                        </View>

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setActiveTab('HISTORY')}>
                                <Text style={styles.btnTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={handleSubmit}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnTextSave}>Post Homework</Text>}
                            </TouchableOpacity>
                        </View>
                    </Card>
                </ScrollView>
            ) : (
                loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} size="large" color={theme.colors.primary} />
                ) : (
                    <FlatList
                        data={homeworkList}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <BookOpen size={48} color={theme.colors.text.light} />
                                <Text style={styles.empty}>No homework history found.</Text>
                            </View>
                        }
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: theme.colors.surface },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.main },
    addBtn: { padding: 5 },

    tabContainer: { flexDirection: 'row', padding: 15, gap: 10 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.m, alignItems: 'center', backgroundColor: theme.colors.surface },
    activeTab: { backgroundColor: theme.colors.primary },
    tabText: { color: theme.colors.text.muted, fontWeight: '600' },
    activeTabText: { color: 'white' },

    list: { padding: 15 },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, marginBottom: 15, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingBottom: 10 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79, 70, 229, 0.1)', alignItems: 'center', justifyContent: 'center' },
    subject: { fontWeight: 'bold', fontSize: 16, color: theme.colors.text.main },
    className: { fontSize: 12, color: theme.colors.text.muted },
    date: { fontSize: 11, color: theme.colors.text.light },

    cardBody: { paddingHorizontal: 15, paddingBottom: 15 },
    title: { fontSize: 15, fontWeight: '600', marginBottom: 5, color: theme.colors.text.main },
    desc: { color: theme.colors.text.muted, fontSize: 14, lineHeight: 20 },

    footer: { padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: 'rgb(250, 250, 255)' },
    dueBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    due: { fontSize: 12, color: theme.colors.error, fontWeight: '600' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    empty: { textAlign: 'center', marginTop: 10, color: theme.colors.text.muted, fontSize: 16 },

    formPadding: { padding: 15 },
    formCard: { padding: 20, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l },
    formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text.main },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.main, marginBottom: 8 },
    input: { backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text.main },
    textArea: { height: 100 },

    btnRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
    btnCancel: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: theme.colors.background, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    btnSave: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center' },
    btnTextCancel: { fontWeight: 'bold', color: theme.colors.text.muted },
    btnTextSave: { fontWeight: 'bold', color: 'white' }
});
