'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search, Filter, Eye, CheckCircle, XCircle, ArrowRight, Phone, Calendar, Clock } from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface Enquiry {
    id: number;
    enquiry_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    class_name: string;
    parent_mobile: string;
    status: string;
    priority: string;
    current_stage_name: string;
    filled_by_name: string;
    filled_via: string;
    filled_at: string;
    created_at: string;
    documents_count: number;
}

interface Stats {
    total: number;
    pending: number;
    in_progress: number;
    approved: number;
    rejected: number;
    converted: number;
}

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'ON_HOLD': 'bg-gray-100 text-gray-800',
    'APPROVED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
    'CONVERTED': 'bg-purple-100 text-purple-800',
    'WITHDRAWN': 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
    'LOW': 'bg-gray-100 text-gray-600',
    'NORMAL': 'bg-blue-100 text-blue-700',
    'HIGH': 'bg-orange-100 text-orange-700',
    'URGENT': 'bg-red-100 text-red-700',
};

export default function AdmissionsPage() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            const [enquiriesRes, statsRes] = await Promise.all([
                api.get(`/admissions/enquiries/${statusFilter ? `?status=${statusFilter}` : ''}`),
                api.get('/admissions/stats/')
            ]);
            setEnquiries(enquiriesRes.data.results || enquiriesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to load enquiries', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const filteredEnquiries = enquiries.filter(e =>
        searchQuery === '' ||
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.enquiry_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.parent_mobile.includes(searchQuery)
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Admission Enquiries</h1>
                        <p className="text-text-muted">Manage student admission enquiries and workflow</p>
                    </div>
                    <button
                        onClick={() => router.push('/admissions/create')}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Enquiry
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                                <p className="text-sm text-text-muted">Total</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('PENDING')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                                <p className="text-sm text-text-muted">Pending</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('IN_PROGRESS')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
                                <p className="text-sm text-text-muted">In Progress</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('APPROVED')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                                <p className="text-sm text-text-muted">Approved</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('REJECTED')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                                <p className="text-sm text-text-muted">Rejected</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('CONVERTED')}>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-purple-600">{stats.converted}</p>
                                <p className="text-sm text-text-muted">Admitted</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search & Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="CONVERTED">Converted</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Enquiries List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredEnquiries.length === 0 ? (
                            <div className="text-center py-20 text-text-muted">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No enquiries found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredEnquiries.map((enquiry) => (
                                    <div
                                        key={enquiry.id}
                                        className="p-4 hover:bg-background/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/admissions/${enquiry.id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-mono text-sm text-primary">{enquiry.enquiry_id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[enquiry.status]}`}>
                                                        {enquiry.status.replace('_', ' ')}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[enquiry.priority]}`}>
                                                        {enquiry.priority}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-text-main">{enquiry.full_name}</h3>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        Class: {enquiry.class_name || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {enquiry.parent_mobile}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(enquiry.created_at)}
                                                    </span>
                                                </div>
                                                {enquiry.current_stage_name && (
                                                    <div className="mt-2 text-sm">
                                                        <span className="text-text-muted">Current Stage:</span>
                                                        <span className="ml-2 text-primary font-medium">{enquiry.current_stage_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right text-xs text-text-muted">
                                                    <p>Filled by</p>
                                                    <p className="font-medium text-text-main">{enquiry.filled_by_name}</p>
                                                    <p className="text-xs">{enquiry.filled_via}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-text-muted" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AnimatePage>
    );
}
