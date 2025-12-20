'use client';

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getLeaveApplications, processLeaveApplication, type LeaveApplication } from "@/lib/api";
import { Check, X, Calendar, User, FileText } from "lucide-react";

export default function LeavesPage() {
    const { hasPermission } = useAuth();
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');

    useEffect(() => {
        loadLeaves();
    }, [filter]);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await getLeaveApplications(filter);
            setLeaves(data);
        } catch (e) {
            console.error("Failed to load leaves", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
        const isPaid = action === 'APPROVE' ? confirm("Should this leave be PAiD? OK = Paid, Cancel = Unpaid (LWP)") : false;

        try {
            await processLeaveApplication(id, action, isPaid);
            loadLeaves();
        } catch (e) {
            alert("Failed to process leave");
        }
    };

    if (!hasPermission('core.view_coreuser')) { // Assuming basic staff view permission needed
        return <div className="p-10 text-center">Unauthorized Access</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Leave Applications</h1>
                <p className="text-gray-500">Review and manage staff leave requests</p>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setFilter('PENDING')}
                    className={`pb-2 px-1 text-sm font-medium ${filter === 'PENDING' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending Requests
                </button>
                <button
                    onClick={() => setFilter('ALL')}
                    className={`pb-2 px-1 text-sm font-medium ${filter === 'ALL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All History
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-dashed border-gray-300">
                    <p className="text-gray-500">No {filter === 'PENDING' ? 'pending' : ''} leave applications found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {leaves.map((leave) => (
                        <div key={leave.id} className="bg-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{leave.staff_name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar size={16} />
                                    <span>{leave.start_date} <span className="text-gray-400">to</span> {leave.end_date}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <FileText size={16} className="mt-0.5 shrink-0" />
                                    <p className="italic">"{leave.reason}"</p>
                                </div>
                            </div>

                            {leave.status === 'PENDING' && (
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAction(leave.id, 'APPROVE')}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex justify-center items-center gap-2 text-sm font-medium"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(leave.id, 'REJECT')}
                                        className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-md hover:bg-red-100 flex justify-center items-center gap-2 text-sm font-medium"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            )}

                            {leave.status === 'APPROVED' && (
                                <div className="text-xs text-gray-500 text-center border-t pt-2">
                                    {leave.is_paid ? 'Paid Leave (Salary Unaffected)' : 'Unpaid Leave (Salary Deducted)'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
