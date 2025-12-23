'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSettlementSummary, type SettlementSummary } from '@/lib/api';
import KPICard from '@/components/ui/KPICard';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function SettlementDashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<SettlementSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number>(1); // Default year ID

    useEffect(() => {
        loadSummary();
    }, [selectedYear]);

    async function loadSummary() {
        setLoading(true);
        try {
            const data = await getSettlementSummary(selectedYear);
            setSummary(data);
        } catch (error) {
            console.error('Failed to load settlement summary:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Fee Settlement Dashboard</h1>
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white p-6 rounded-lg h-32"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Fee Settlement Dashboard</h1>
                    <div className="bg-white p-8 rounded-lg text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No data available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fee Settlement Dashboard</h1>
                        <p className="text-gray-500 mt-2">Academic Year: {summary.academic_year}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = '/finance/settlement/yearend'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Generate Year-End Fees
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        label="Total Invoices"
                        value={summary.total_invoices.toString()}
                        color="primary"
                        icon={<BarChart3 className="w-6 h-6" />}
                    />
                    <KPICard
                        label="Total Amount"
                        value={`₹${(summary.total_amount / 100000).toFixed(2)}L`}
                        color="primary"
                        icon={<TrendingUp className="w-6 h-6" />}
                    />
                    <KPICard
                        label="Collected"
                        value={`${summary.collection_percentage.toFixed(1)}%`}
                        color="success"
                        icon={<CheckCircle className="w-6 h-6" />}
                    />
                    <KPICard
                        label="Pending"
                        value={`₹${(summary.total_pending / 100000).toFixed(2)}L`}
                        color="error"
                        icon={<AlertCircle className="w-6 h-6" />}
                    />
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{summary.status_breakdown.pending}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{summary.status_breakdown.partial}</p>
                            <p className="text-sm text-gray-600">Partial</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{summary.status_breakdown.paid}</p>
                            <p className="text-sm text-gray-600">Paid</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{summary.status_breakdown.overdue}</p>
                            <p className="text-sm text-gray-600">Overdue</p>
                        </div>
                    </div>
                </div>

                {/* Class-wise Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Class-wise Collection</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Class</th>
                                    <th className="text-right py-3 px-4">Total</th>
                                    <th className="text-right py-3 px-4">Collected</th>
                                    <th className="text-right py-3 px-4">Pending</th>
                                    <th className="text-right py-3 px-4">%</th>
                                    <th className="text-center py-3 px-4">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.classwise.map((cls) => (
                                    <tr key={cls.class} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{cls.class}</td>
                                        <td className="text-right py-3 px-4">₹{cls.total_amount.toLocaleString()}</td>
                                        <td className="text-right py-3 px-4 text-green-600">
                                            ₹{cls.paid_amount.toLocaleString()}
                                        </td>
                                        <td className="text-right py-3 px-4 text-red-600">
                                            ₹{cls.pending_amount.toLocaleString()}
                                        </td>
                                        <td className="text-right py-3 px-4 font-semibold">
                                            {cls.percentage_collected.toFixed(1)}%
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${cls.percentage_collected}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
