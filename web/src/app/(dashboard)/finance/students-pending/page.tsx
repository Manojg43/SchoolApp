'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    IndianRupee, Search, Filter, RefreshCw, User, AlertCircle,
    ArrowRight, ChevronDown, Download
} from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api, { getClasses, ClassItem } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatINR } from '@/lib/formatters';

interface StudentWithPending {
    id: number;
    name: string;
    enrollment_number: string;
    class_name: string;
    total_invoiced: number;
    total_paid: number;
    pending_amount: number;
}

interface Summary {
    students_with_pending: number;
    total_pending: number;
}

export default function StudentsPendingPage() {
    const router = useRouter();
    const [students, setStudents] = useState<StudentWithPending[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [minPending, setMinPending] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Add sections state
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        loadClasses();
    }, []);

    // Load sections when class changes
    useEffect(() => {
        if (classFilter) {
            loadSections(classFilter);
        } else {
            setSections([]);
            setSectionFilter('');
        }
    }, [classFilter]);

    useEffect(() => {
        loadData();
    }, [classFilter, sectionFilter, minPending]);

    const loadClasses = async () => {
        try {
            const data = await getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadSections = async (classId: string) => {
        try {
            // Using existing API to get sections (assuming getSections or similar exists, or using direct call)
            // Ideally use api.getSections(classId) if available, or direct:
            const res = await api.get(`/schools/classes/${classId}/sections/`);
            setSections(res.data || []);
        } catch (error) {
            console.error('Failed to load sections', error);
            setSections([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (classFilter) params.append('class_id', classFilter);
            if (sectionFilter) params.append('section_id', sectionFilter);
            if (minPending) params.append('min_pending', minPending);

            const queryString = params.toString() ? `?${params.toString()}` : '';

            const res = await api.get(`/finance/students-pending/${queryString}`);
            const data = res?.data ?? res;

            setStudents(data.students || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load pending fees data');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setClassFilter('');
        setSectionFilter('');
        setMinPending('');
        setSearchQuery('');
    };

    const hasActiveFilters = classFilter || sectionFilter || minPending || searchQuery;

    const filteredStudents = students.filter(s =>
        searchQuery === '' ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Students with Pending Fees</h1>
                        <p className="text-text-muted">View all students who have pending fee balances</p>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-100 rounded-xl">
                                        <User className="w-8 h-8 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Students with Pending</p>
                                        <p className="text-3xl font-bold text-text-main">{summary.students_with_pending}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <IndianRupee className="w-8 h-8 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Total Pending Amount</p>
                                        <p className="text-3xl font-bold text-red-600">{formatINR(summary.total_pending)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by name or enrollment ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>

                            {/* Class Filter */}
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="px-4 py-2 border border-border rounded-lg min-w-[140px]"
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>

                            {/* Section Filter */}
                            <select
                                value={sectionFilter}
                                onChange={(e) => setSectionFilter(e.target.value)}
                                disabled={!classFilter}
                                className="px-4 py-2 border border-border rounded-lg min-w-[140px] disabled:opacity-50"
                            >
                                <option value="">All Sections</option>
                                {sections.map((sec: any) => (
                                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                                ))}
                            </select>

                            {/* Minimum Pending */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min pending"
                                    value={minPending}
                                    onChange={(e) => setMinPending(e.target.value)}
                                    className="w-32 pl-8 pr-2 py-2 border border-border rounded-lg"
                                />
                            </div>

                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main">
                                    <RefreshCw className="w-4 h-4" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-20 text-text-muted">
                                <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No students with pending fees found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Student</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Class</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Total Invoiced</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Pending</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-background/50 cursor-pointer"
                                                onClick={() => router.push(`/finance/students/${student.id}`)}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                            {student.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-text-main">{student.name}</p>
                                                            <p className="text-xs text-text-muted font-mono">{student.enrollment_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">{student.class_name}</td>
                                                <td className="px-4 py-4 text-right text-sm">{formatINR(student.total_invoiced)}</td>
                                                <td className="px-4 py-4 text-right text-sm text-green-600">{formatINR(student.total_paid)}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-lg font-bold text-red-600">{formatINR(student.pending_amount)}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AnimatePage>
    );
}
