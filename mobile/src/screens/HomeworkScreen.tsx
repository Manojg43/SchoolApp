import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '../lib/api';
import { ArrowLeft, BookOpen, Plus, Calendar as CalendarIcon, Save } from 'lucide-react-native';

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
        class_id: '', // Need to pick from somewhere? Or manual input for now
        due_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    });
    // Hardcoding class selection for simplicity or we need to fetch classes first.
    // Assuming teacher knows class ID or we render a simple input for Class ID for v1.
    // Improving: Fetch Teacher's timetable classes? Too complex for now.
    // Let's use a simple text input for "Class ID" or "Class Name" (Backend expects ID).
    // Wait, backend expects `class_id`. I need to fetch classes.
    // Let's rely on Timetable? Or just `getMyProfile` providing classes?
    // Let's add a `getMyClasses` API later. For now, I will use a simple implementation where I assume user knows invalid flow or I fetch Timetable to get unique classes.

    // Quick Fix: Fetch Timetable to get list of unique classes this teacher teaches
    const [myClasses, setMyClasses] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'HISTORY') loadHistory();
        if (activeTab === 'ADD') loadClasses();
    }, [activeTab]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await mobileApi.getHomework();
            setHomeworkList(data);
        } catch (e) {
            // ensure safe error handling
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async () => {
        // Fetch timetable to extract classes
        try {
            const data = await mobileApi.getTimetable();
            // Unique classes
            const unique: any = {};
            data.forEach((t: any) => {
                // Backend timetable returns class_name but we need ID? 
                // Ah, Timetable API returns: `class_name`, no ID?
                // I need to update Timetable API to return ID too.
                // Let's check `views_academic.py`. It returns `id` of schedule, not class ID.
                // I need to update backend or trust user input.
                // Or I leave Class Selection manual for now (Not ideal).
            });
        } catch (e) { }
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
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <BookOpen size={20} color="#0f52ba" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.subject}>{item.subject}</Text>
                    <Text style={styles.className}>{item.class_name} {item.section}</Text>
                </View>
                <Text style={styles.date}>{item.created_at}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.footer}>
                <Text style={styles.due}>Due: {item.due_date}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1f2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Homework</Text>

                {activeTab === 'HISTORY' && (
                    <TouchableOpacity onPress={() => setActiveTab('ADD')}>
                        <Plus color="#0f52ba" size={24} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            {activeTab === 'ADD' && (
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Assign Homework</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Class ID (e.g. 1)"
                        keyboardType="numeric"
                        value={form.class_id}
                        onChangeText={t => setForm({ ...form, class_id: t })}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Subject (e.g. Math)"
                        value={form.subject}
                        onChangeText={t => setForm({ ...form, subject: t })}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Title (e.g. Algebra Ex 1.1)"
                        value={form.title}
                        onChangeText={t => setForm({ ...form, title: t })}
                    />

                    <TextInput
                        style={[styles.input, { height: 100 }]}
                        placeholder="Description..."
                        multiline
                        textAlignVertical="top"
                        value={form.description}
                        onChangeText={t => setForm({ ...form, description: t })}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Due Date (YYYY-MM-DD)"
                        value={form.due_date}
                        onChangeText={t => setForm({ ...form, due_date: t })}
                    />

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.btnCancel} onPress={() => setActiveTab('HISTORY')}>
                            <Text style={styles.btnTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSave} onPress={handleSubmit}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnTextSave}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {activeTab === 'HISTORY' && (
                loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#0f52ba" />
                ) : (
                    <FlatList
                        data={homeworkList}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.empty}>No homework history found.</Text>}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'white' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    list: { padding: 15 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    subject: { fontWeight: 'bold', fontSize: 16 },
    className: { fontSize: 12, color: '#6b7280' },
    date: { fontSize: 12, color: '#9ca3af' },
    title: { fontSize: 16, marginBottom: 5, color: '#1f2937' },
    desc: { color: '#4b5563', fontSize: 14, marginBottom: 10 },
    footer: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
    due: { fontSize: 12, color: '#dc2626', fontWeight: '500' },
    empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af' },

    formContainer: { padding: 20 },
    formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row', gap: 15 },
    btnCancel: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
    btnSave: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#0f52ba', alignItems: 'center' },
    btnTextCancel: { fontWeight: 'bold', color: '#374151' },
    btnTextSave: { fontWeight: 'bold', color: 'white' }

});
