'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, ArrowRight, Phone, Mail, MapPin, Calendar, FileText, User, Clock, Building, Upload, ExternalLink } from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api, { uploadEnquiryDocument } from '@/lib/api';
import { toast } from '@/lib/toast';

interface EnquiryDetail {
    id: number;
    enquiry_id: string;
    status: string;
    priority: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    age: number;
    gender: string;
    class_applied: number;
    class_name: string;
    parent_name: string;
    parent_mobile: string;
    parent_email: string;
    parent_occupation: string;
    address: string;
    previous_school_name: string;
    previous_class: string;
    previous_percentage: number;
    workflow_name: string;
    current_stage: number;
    current_stage_name: string;
    filled_by_name: string;
    filled_via: string;
    filled_at: string;
    referred_by: string;
    notes: string;
    rejection_reason: string;
    stage_progress: any[];
    documents: any[];
    created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
    'ON_HOLD': 'bg-gray-100 text-gray-800 border-gray-200',
    'APPROVED': 'bg-green-100 text-green-800 border-green-200',
    'REJECTED': 'bg-red-100 text-red-800 border-red-200',
    'CONVERTED': 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function EnquiryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const enquiryId = params.id as string;

    const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Document Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('');
    const [docRemarks, setDocRemarks] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEnquiry();
    }, [enquiryId]);

    const loadEnquiry = async () => {
        setError(null);
        try {
            const res = await api.get(`/admissions/enquiries/${enquiryId}/`);
            setEnquiry(res.data);
        } catch (err: any) {
            console.error('Failed to load enquiry', err);
            const message = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to load enquiry';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdvanceStage = async () => {
        if (!enquiry) return;
        setActionLoading(true);
        try {
            const res = await api.post(`/admissions/enquiries/${enquiryId}/advance_stage/`);
            toast.success(res.data.new_stage ? `Advanced to: ${res.data.new_stage}` : 'Enquiry approved!');
            loadEnquiry();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to advance stage');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!enquiry) return;
        setActionLoading(true);
        try {
            await api.post(`/admissions/enquiries/${enquiryId}/reject/`, { reason: rejectReason });
            toast.success('Enquiry rejected');
            setRejectDialogOpen(false);
            loadEnquiry();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvert = async () => {
        if (!enquiry) return;
        setActionLoading(true);
        try {
            const res = await api.post(`/admissions/enquiries/${enquiryId}/convert_to_student/`);
            toast.success(res.data.message);
            router.push(`/students`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to convert');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !docType || !enquiry) return;

        setIsUploading(true);
        try {
            await uploadEnquiryDocument(enquiry.id, {
                document_type: docType,
                file: uploadFile,
                remarks: docRemarks
            });
            toast.success('Document uploaded');
            setUploadFile(null);
            setDocType('');
            setDocRemarks('');
            loadEnquiry(); // Reload to show new doc
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setIsUploading(false);
        }
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!enquiry) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-text-muted">{error || 'Enquiry not found'}</p>
                <button onClick={() => router.back()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-text-main">{enquiry.full_name}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[enquiry.status]}`}>
                                    {enquiry.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-text-muted font-mono">{enquiry.enquiry_id}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {enquiry.status === 'APPROVED' && (
                            <button
                                onClick={handleConvert}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <User className="w-4 h-4" />
                                Convert to Student
                            </button>
                        )}
                        {['PENDING', 'IN_PROGRESS'].includes(enquiry.status) && (
                            <>
                                <button
                                    onClick={() => setRejectDialogOpen(true)}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleAdvanceStage}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {enquiry.current_stage_name ? 'Complete Stage' : 'Approve'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Student Details */}
                        <Card>
                            <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-text-muted">Full Name</p>
                                    <p className="font-medium">{enquiry.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted">Date of Birth</p>
                                    <p className="font-medium">{formatDate(enquiry.date_of_birth)} ({enquiry.age} years)</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted">Gender</p>
                                    <p className="font-medium">{enquiry.gender === 'M' ? 'Male' : enquiry.gender === 'F' ? 'Female' : 'Other'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted">Class Applied</p>
                                    <p className="font-medium">{enquiry.class_name || 'Not specified'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Document List */}
                                <div className="space-y-3 mb-6">
                                    {(enquiry.documents || []).length === 0 ? (
                                        <p className="text-text-muted text-sm italic">No documents uploaded</p>
                                    ) : (
                                        (enquiry.documents || []).map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{doc.document_type}</p>
                                                        <p className="text-xs text-text-muted">{formatDate(doc.uploaded_at)}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={doc.file}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 hover:bg-surface rounded-full text-primary"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Upload Form */}
                                <div className="bg-surface/50 p-4 rounded-lg border border-border">
                                    <h4 className="text-sm font-semibold mb-3">Upload Document</h4>
                                    <form onSubmit={handleUpload} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Document Type (e.g. Birth Certificate)"
                                                value={docType}
                                                onChange={(e) => setDocType(e.target.value)}
                                                className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Remarks (Optional)"
                                                value={docRemarks}
                                                onChange={(e) => setDocRemarks(e.target.value)}
                                                className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                className="flex-1 text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isUploading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                                Upload
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Parent Details */}
                        <Card>
                            <CardHeader><CardTitle>Parent / Guardian</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-text-muted" />
                                    <span className="font-medium">{enquiry.parent_name}</span>
                                    {enquiry.parent_occupation && <span className="text-text-muted">({enquiry.parent_occupation})</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-text-muted" />
                                    <a href={`tel:${enquiry.parent_mobile}`} className="text-primary">{enquiry.parent_mobile}</a>
                                </div>
                                {enquiry.parent_email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-text-muted" />
                                        <a href={`mailto:${enquiry.parent_email}`} className="text-primary">{enquiry.parent_email}</a>
                                    </div>
                                )}
                                {enquiry.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-text-muted mt-0.5" />
                                        <span>{enquiry.address}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Previous School */}
                        {enquiry.previous_school_name && (
                            <Card>
                                <CardHeader><CardTitle>Previous School</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-text-muted">School Name</p>
                                        <p className="font-medium">{enquiry.previous_school_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Class</p>
                                        <p className="font-medium">{enquiry.previous_class || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Percentage</p>
                                        <p className="font-medium">{enquiry.previous_percentage ? `${enquiry.previous_percentage}%` : 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Workflow Progress */}
                        <Card>
                            <CardHeader><CardTitle>Workflow Progress</CardTitle></CardHeader>
                            <CardContent>
                                {enquiry.current_stage_name ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-text-muted">Current Stage</p>
                                        <p className="font-semibold text-primary text-lg">{enquiry.current_stage_name}</p>
                                        {enquiry.stage_progress.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {enquiry.stage_progress.map((sp: any) => (
                                                    <div key={sp.id} className="flex items-center gap-2 text-sm">
                                                        {sp.status === 'COMPLETED' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        ) : sp.status === 'FAILED' ? (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-yellow-500" />
                                                        )}
                                                        <span className={sp.status === 'COMPLETED' ? 'text-green-700' : ''}>{sp.stage_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-text-muted">No workflow assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tracking Info */}
                        <Card>
                            <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-text-muted">Filled By</p>
                                    <p className="font-medium">{enquiry.filled_by_name}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted">Source</p>
                                    <p className="font-medium">{enquiry.filled_via}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted">Created</p>
                                    <p className="font-medium">{formatDate(enquiry.created_at)}</p>
                                </div>
                                {enquiry.referred_by && (
                                    <div>
                                        <p className="text-text-muted">Referred By</p>
                                        <p className="font-medium">{enquiry.referred_by}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {enquiry.notes && (
                            <Card>
                                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{enquiry.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Reject Dialog */}
                {rejectDialogOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Reject Enquiry</h3>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows={4}
                                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none resize-none"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setRejectDialogOpen(false)}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
