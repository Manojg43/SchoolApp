import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import {
    getClasses, getSections, getStudents, getFeeCategories, getFeeStructureAmount, createFee,
    type ClassItem, type SectionItem, type Student, type FeeCategory
} from '@/lib/api';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Master Data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);

    // Form State
    const [selectedClass, setSelectedClass] = useState<number | ''>('');
    const [selectedSection, setSelectedSection] = useState<number | ''>('');
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

    // Values
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [cData, secData, sData, catData] = await Promise.all([
                getClasses(),
                getSections(),
                getStudents(),
                getFeeCategories()
            ]);
            setClasses(cData);
            setSections(secData);
            setStudents(sData);
            setCategories(catData);
        } catch (e) {
            console.error("Failed to load initial data", e);
        } finally {
            setLoading(false);
        }
    };

    // Filter students based on selection
    const filteredStudents = students.filter(s => {
        if (selectedClass && s.current_class !== Number(selectedClass)) return false;
        if (selectedSection && s.section !== Number(selectedSection)) return false;
        return true;
    });

    // Auto-fetch Amount when Class & Category change
    useEffect(() => {
        if (selectedClass && selectedCategory) {
            fetchStructureAmount();
        }
    }, [selectedClass, selectedCategory]);

    const fetchStructureAmount = async () => {
        const amt = await getFeeStructureAmount(Number(selectedClass), Number(selectedCategory));
        if (amt && amt !== "0") {
            setAmount(amt);
        }
    };

    // Update Title automatically if category selected
    useEffect(() => {
        if (selectedCategory) {
            const cat = categories.find(c => c.id === Number(selectedCategory));
            if (cat) setTitle(`${cat.name} Fee`);
        }
    }, [selectedCategory, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !title || !amount) return;

        setSubmitting(true);
        try {
            await createFee({
                student: Number(selectedStudent),
                title,
                amount: parseFloat(amount),
                due_date: dueDate,
                status: 'PENDING'
            });
            onSuccess();
            onClose();
        } catch (e) {
            alert("Failed to create Invoice.");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional Filter)</label>
                            <select
                                className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(Number(e.target.value) || '')}
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select
                                className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(Number(e.target.value) || '')}
                            >
                                <option value="">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
                        <select
                            required
                            className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(Number(e.target.value) || '')}
                        >
                            <option value="">-- Choose Student --</option>
                            {filteredStudents.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.first_name} {s.last_name} ({s.enrollment_number})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Showing {filteredStudents.length} students based on filters.</p>
                    </div>

                    {/* Invoice Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type (Fee Category) *</label>
                        <select
                            required
                            className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(Number(e.target.value) || '')}
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Title *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Tuition Fee Term 1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-filled from structure if available</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                            <input
                                type="date"
                                required
                                className="w-full rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
