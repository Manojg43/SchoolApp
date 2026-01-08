'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, Calendar, Award, TrendingUp, TrendingDown, FileText, User, Bus } from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import { fetchWithSchool, API_BASE_URL, downloadReportCard, getStudentSubscriptions, TransportSubscription } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Student {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    current_class: number;
    class_name: string;
    section_name: string;
    date_of_birth: string;
    photo: string;
}

interface HistoryRecord {
    id: number;
    academic_year: number;
    year_name: string;
    class_enrolled: number;
    class_name: string;
    section_name: string;
    total_marks: number;
    max_marks: number;
    percentage: number;
    grade: string;
    class_rank: number;
    section_rank: number;
    days_present: number;
    total_working_days: number;
    attendance_percentage: number;
    promotion_status: string;
    promoted_to_class_name: string;
    conduct: string;
    remarks: string;
    detention_reason: string;
    recorded_at: string;
}

const GRADE_COLORS: Record<string, string> = {
    'A+': 'bg-green-500',
    'A': 'bg-green-400',
    'B+': 'bg-blue-500',
    'B': 'bg-blue-400',
    'C+': 'bg-yellow-500',
    'C': 'bg-yellow-400',
    'D': 'bg-orange-500',
    'E': 'bg-red-400',
    'F': 'bg-red-600',
};

const STATUS_COLORS: Record<string, string> = {
    'PROMOTED': 'bg-green-100 text-green-700',
    'DETAINED': 'bg-red-100 text-red-700',
    'GRADUATED': 'bg-purple-100 text-purple-700',
    'TRANSFERRED': 'bg-gray-100 text-gray-700',
    'WITHDRAWN': 'bg-gray-100 text-gray-600',
};

export default function StudentHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [subscriptions, setSubscriptions] = useState<TransportSubscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [studentId]);

    const loadData = async () => {
        try {
            const [studentData, historyData, subData] = await Promise.all([
                fetchWithSchool(`/students/${studentId}/`),
                fetchWithSchool(`/student-history/?student=${studentId}`),
                getStudentSubscriptions(Number(studentId))
            ]);
            setStudent(studentData);
            setHistory(Array.isArray(historyData) ? historyData : (historyData?.results || []));
            setSubscriptions(subData);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReportCard = async () => {
        try {
            const blob = await downloadReportCard(Number(studentId));
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_card_${studentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error('Failed to download report card');
        }
    };

    const handleGenerateIDCard = async () => {
        try {
            const token = localStorage.getItem('school_token');
            const schoolId = localStorage.getItem('school_id') || '';

            // Generate ID Card using standard fetch to handle Blob response
            const res = await fetch(`${API_BASE_URL}/certificates/generate/${studentId}/ID_CARD/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                    'X-School-ID': schoolId
                },
                body: JSON.stringify({})
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to generate ID Card');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ID_Card_${student?.first_name}_${student?.student_id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('ID Card generated successfully');
        } catch (error: any) {
            console.error('ID Card generation failed', error);
            toast.error(error.message || 'Failed to generate ID Card');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-text-muted">Student not found</p>
            </div>
        );
    }

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        {student.photo ? (
                            <img src={student.photo} alt="" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-text-main">
                                {student.first_name} {student.last_name}
                            </h1>
                            <p className="text-text-muted">
                                {student.class_name} {student.section_name && `- ${student.section_name}`} | {student.student_id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transport Section */}
                {subscriptions.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Bus className="w-5 h-5 text-primary" />
                                Transport Subscriptions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {subscriptions.map(sub => (
                                    <div key={sub.id} className="p-4 border border-border rounded-lg bg-surface/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold">{sub.route_details?.name || `Route #${sub.route}`}</h4>
                                                <p className="text-sm text-text-muted">{sub.route_details?.vehicle_number}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><span className="text-text-muted">Pickup:</span> {sub.pickup_point || 'N/A'}</p>
                                            <p><span className="text-text-muted">Fee:</span> ₹{sub.monthly_fee}/month</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* History Title */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-main">Academic History</h2>
                    <button
                        onClick={handleDownloadReportCard}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        <FileText className="w-4 h-4" />
                        Download Report Card
                    </button>
                    <button
                        onClick={() => handleGenerateIDCard()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ml-2"
                    >
                        <Award className="w-4 h-4" />
                        ID Card
                    </button>
                </div>

                {/* History Timeline */}
                {history.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
                            <p className="text-text-muted">No academic history recorded yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {history.map((record, index) => (
                            <Card key={record.id} className="overflow-hidden">
                                <div className="flex">
                                    {/* Year Badge */}
                                    <div className="w-32 bg-primary/5 flex flex-col items-center justify-center p-4 border-r border-border">
                                        <span className="text-lg font-bold text-primary">{record.year_name}</span>
                                        <span className="text-sm text-text-muted">{record.class_name}</span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[record.promotion_status]}`}>
                                                    {record.promotion_status}
                                                </span>
                                                {record.promoted_to_class_name && (
                                                    <span className="text-sm text-text-muted">
                                                        → {record.promoted_to_class_name}
                                                    </span>
                                                )}
                                            </div>
                                            {record.grade && (
                                                <div className={`w-12 h-12 rounded-lg ${GRADE_COLORS[record.grade]} flex items-center justify-center`}>
                                                    <span className="text-white font-bold text-lg">{record.grade}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {record.percentage !== null && (
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Percentage</p>
                                                    <p className="text-xl font-bold text-text-main">{record.percentage?.toFixed(1)}%</p>
                                                    <p className="text-xs text-text-muted">
                                                        {record.total_marks}/{record.max_marks}
                                                    </p>
                                                </div>
                                            )}
                                            {record.class_rank && (
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Class Rank</p>
                                                    <p className="text-xl font-bold text-text-main">#{record.class_rank}</p>
                                                </div>
                                            )}
                                            {record.attendance_percentage !== null && (
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Attendance</p>
                                                    <p className="text-xl font-bold text-text-main">{record.attendance_percentage?.toFixed(1)}%</p>
                                                    <p className="text-xs text-text-muted">
                                                        {record.days_present}/{record.total_working_days} days
                                                    </p>
                                                </div>
                                            )}
                                            {record.conduct && (
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Conduct</p>
                                                    <p className="text-lg font-medium text-text-main">{record.conduct.replace('_', ' ')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {record.remarks && (
                                            <div className="mt-4 p-3 bg-background rounded-lg">
                                                <p className="text-sm text-text-muted">{record.remarks}</p>
                                            </div>
                                        )}

                                        {record.detention_reason && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700">
                                                    <strong>Detention Reason:</strong> {record.detention_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
