'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    getClasses, getSections, getStudents, getFeeCategories, getFeeStructureAmount, createFee, API_BASE_URL,
    type ClassItem, type SectionItem, type Student, type FeeCategory
} from '@/lib/api';
import { Loader2, Search, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import Link from 'next/link';

export default function CreateInvoicePage() {
    const router = useRouter();
    const { hasPermission } = useAuth();

    // Mode: 'detailed' (Search) or 'quick' (Enrollment ID)
    const [mode, setMode] = useState<'detailed' | 'quick'>('detailed');

    // Loading States
    const [loadingInit, setLoadingInit] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Master Data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]); // Cache for filtering
    const [categories, setCategories] = useState<FeeCategory[]>([]);

    // Form - Selection
    const [selectedClass, setSelectedClass] = useState<number | ''>('');
    const [selectedSection, setSelectedSection] = useState<number | ''>('');
    const [studentSearch, setStudentSearch] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

    // Form - Values
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [quickEnrollment, setQuickEnrollment] = useState('');

    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    // Outcome
    const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoadingInit(true);
        try {
            console.log("Fetching Initial Data for Invoice...");
            const [cData, secData, sData, catData] = await Promise.all([
                getClasses(),
                getSections(),
                getStudents(),
                getFeeCategories()
            ]);

            console.log("Data Received:", { c: cData?.length, s: sData?.length, sec: secData?.length });

            if (Array.isArray(cData)) setClasses(cData);
            if (Array.isArray(secData)) setSections(secData);
            if (Array.isArray(sData)) setAllStudents(sData);
            if (Array.isArray(catData)) setCategories(catData);
        } catch (e) {
            console.error("Failed to load initial data", e);
            toast.error('Failed to load data', 'Please refresh the page');
        } finally {
            setLoadingInit(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        if (mode === 'detailed') {
            let res = allStudents;
            if (selectedClass) res = res.filter(s => s.current_class === Number(selectedClass));
            if (selectedSection) res = res.filter(s => s.section === Number(selectedSection));
            if (studentSearch) {
                const q = studentSearch.toLowerCase();
                res = res.filter(s =>
                    s.first_name.toLowerCase().includes(q) ||
                    s.last_name.toLowerCase().includes(q) ||
                    s.enrollment_number.toLowerCase().includes(q)
                );
            }
            // Limit generic list if no filters to improve perf, but if class selected allow full list
            if (!selectedClass && !studentSearch) {
                setFilteredStudents([]);
            } else {
                setFilteredStudents(res);
            }
        }
    }, [selectedClass, selectedSection, studentSearch, allStudents, mode]);

    // Auto-fetch Fee Structure Logic
    useEffect(() => {
        if (selectedCategory && selectedClass) {
            fetchStructureAmount(Number(selectedClass), Number(selectedCategory));
        }
        // Update Title automatic
        if (selectedCategory) {
            const cat = categories.find(c => c.id === Number(selectedCategory));
            if (cat) setTitle(`${cat.name} Fee`);
        }
    }, [selectedCategory, selectedClass]);

    // Reset section when class changes
    useEffect(() => {
        setSelectedSection('');
    }, [selectedClass]);

    const fetchStructureAmount = async (clsId: number, catId: number) => {
        const amt = await getFeeStructureAmount(clsId, catId);
        if (amt && amt !== "0") {
            setAmount(amt);
        }
    };

    // Quick Mode Logic: Resolve Student from Enrollment
    const handleQuickEnrollmentBlur = () => {
        if (!quickEnrollment) return;
        const q = quickEnrollment.trim().toLowerCase();
        const student = allStudents.find(s => s.enrollment_number.toLowerCase() === q);
        if (student) {
            setSelectedStudentId(student.id);
            // Also try to infer structure amount if we can map student class
            if (selectedCategory && student.current_class) {
                fetchStructureAmount(student.current_class, Number(selectedCategory));
            }
        } else {
            toast.error('Student not found', 'Please check the Enrollment ID');
            setSelectedStudentId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final Validation
        let finalStudentId = selectedStudentId;

        // If Detailed mode, ensure selected
        if (mode === 'detailed' && !selectedStudentId) {
            toast.error('Please select a student', 'Choose from the list or use Quick mode');
            return;
        }

        // If Quick mode, ensure resolved
        if (mode === 'quick') {
            const student = allStudents.find(s => s.enrollment_number === quickEnrollment);
            if (!student) {
                toast.error('Invalid Enrollment ID', 'Student not found');
                return;
            }
            finalStudentId = student.id;
        }

        if (!finalStudentId || !title || !amount) return;

        setSubmitting(true);
        try {
            const res = await createFee({
                student: finalStudentId,
                title,
                amount: parseFloat(amount),
                due_date: dueDate,
                status: 'PENDING'
            });
            // API returns created object? assume yes or we fetch list. 
            // `createFee` in api.ts returns `Promise<Fee>`
            if (res && res.id) {
                setCreatedInvoiceId(res.id);
            } else {
                // Fallback if API wrapper doesn't return full object
                toast.success('Invoice Created!', 'Check the finance list');
                router.push('/finance');
            }
        } catch (e) {
            toast.error('Failed to create invoice', 'Please try again');
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setCreatedInvoiceId(null);
        setSelectedStudentId(null);
        setQuickEnrollment('');
        setStudentSearch('');
        setTitle('');
        setAmount('');
    };

    if (!hasPermission('students.add_fee')) {
        return <div className="p-8 text-center">Access Denied</div>;
    }

    if (createdInvoiceId) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Generated!</h2>
                    <p className="text-gray-500 mb-6">The invoice has been successfully created.</p>

                    <div className="space-y-3">
                        <a
                            href={`${API_BASE_URL}/finance/invoice/${createdInvoiceId}/pdf/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 bg-secondary text-white rounded-lg hover:opacity-90 font-medium flex items-center justify-center gap-2"
                        >
                            <FileText className="w-5 h-5" /> View PDF Invoice
                        </a>

                        <button
                            onClick={resetForm}
                            className="block w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                        >
                            Create Another
                        </button>

                        <Link href="/finance" className="block text-sm text-gray-500 hover:underline mt-4">
                            Back to Finance Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/finance" className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Generate New Invoice</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Student Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Student</h2>

                            {/* Mode Switcher */}
                            <div className="flex gap-4 mb-6 border-b pb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mode"
                                        checked={mode === 'detailed'}
                                        onChange={() => setMode('detailed')}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className={mode === 'detailed' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Search List</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mode"
                                        checked={mode === 'quick'}
                                        onChange={() => setMode('quick')}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className={mode === 'quick' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Quick Enrollment ID</span>
                                </label>
                            </div>

                            {mode === 'detailed' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                            <select
                                                className="w-full rounded-lg border-gray-300"
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
                                                className="w-full rounded-lg border-gray-300"
                                                value={selectedSection}
                                                onChange={(e) => setSelectedSection(Number(e.target.value) || '')}
                                                disabled={!selectedClass}
                                            >
                                                <option value="">All Sections</option>
                                                {sections
                                                    .filter(s => !selectedClass || s.parent_class === Number(selectedClass))
                                                    .map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Student Name</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 rounded-lg border-gray-300"
                                                placeholder="Type name..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Results List */}
                                    <div className="mt-4 border rounded-lg max-h-60 overflow-y-auto">
                                        {filteredStudents.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                {studentSearch || selectedClass ? "No students found." : "Select Class/Section to view students"}
                                            </div>
                                        ) : (
                                            filteredStudents.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => setSelectedStudentId(s.id)}
                                                    className={`p-3 border-b last:border-0 cursor-pointer flex justify-between items-center hover:bg-gray-50 ${selectedStudentId === s.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                                                        <p className="text-xs text-gray-500">ID: {s.enrollment_number}</p>
                                                    </div>
                                                    {selectedStudentId === s.id && <CheckCircle className="w-5 h-5 text-primary" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Quick Mode Input
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg border-gray-300"
                                            placeholder="Enter Student ID"
                                            value={quickEnrollment}
                                            onChange={(e) => setQuickEnrollment(e.target.value)}
                                            onBlur={handleQuickEnrollmentBlur}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleQuickEnrollmentBlur}
                                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    {selectedStudentId && (
                                        <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Student Found:
                                            <span className="font-bold">{allStudents.find(s => s.id === selectedStudentId)?.first_name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Invoice Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Invoice Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                                <select
                                    required
                                    className="w-full rounded-lg border-gray-300"
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
                                    className="w-full rounded-lg border-gray-300"
                                    placeholder="e.g. Tuition Fee"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-lg border-gray-300 font-mono text-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {(selectedClass && selectedCategory) ? "Auto-filled from Fee Structure" : "Select Class & Type to auto-fill"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg border-gray-300"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedStudentId}
                                className="w-full py-3 bg-primary text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-200"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                Generate Invoice
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
