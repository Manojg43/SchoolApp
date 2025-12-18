'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { FileBarChart, Users, DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { getAttendanceAnalytics, getFinanceAnalytics, AttendanceAnalytics, FinanceAnalytics } from "@/lib/api";

export default function ReportsPage() {
    const { t } = useLanguage();
    const [attData, setAttData] = useState<AttendanceAnalytics | null>(null);
    const [finData, setFinData] = useState<FinanceAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [att, fin] = await Promise.all([
                    getAttendanceAnalytics(),
                    getFinanceAnalytics()
                ]);
                setAttData(att);
                setFinData(fin);
            } catch (e) {
                console.error("Failed to load reports", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8">Loading Analytics...</div>;

    const collectionRate = finData?.overview.collection_rate || 0;
    const pendingFees = finData?.overview.pending || 0;
    const attPercentage = attData?.students.percentage || 0;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-500">Real-time system insights for {attData?.date}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Metric Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className={`text-sm font-bold ${attPercentage >= 90 ? 'text-green-500' : 'text-orange-500'}`}>
                            {attPercentage}%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{attData?.students.present}/{attData?.students.total}</h3>
                    <p className="text-sm text-gray-500">Students Present Today</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-green-50 p-3 rounded-lg text-green-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        {/* Staff Present Metric */}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{attData?.staff.present}/{attData?.staff.total_marked}</h3>
                    <p className="text-sm text-gray-500">Staff Present Today</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className={`text-sm font-bold ${collectionRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {collectionRate}% Collected
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">₹{finData?.overview.total_collected.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">Total Fees Collected</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-red-50 p-3 rounded-lg text-red-600">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-red-600">₹{pendingFees.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">Pending Dues</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attendance Chart (Simple Bar) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Class-wise Distribution</h2>
                    <div className="space-y-4">
                        {attData?.class_distribution.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{item.current_class__name}</span>
                                    <span className="text-gray-500">{item.count} Students</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${Math.min((item.count / (attData.students.total || 1)) * 100 * 5, 100)}%` }} // Scaling for visibility
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Financial Overview</h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Total Invoiced</p>
                                <p className="text-lg font-bold text-gray-900">₹{finData?.overview.total_invoiced.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="text-gray-400" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                            <div>
                                <p className="text-sm text-green-700">Collected</p>
                                <p className="text-lg font-bold text-green-900">₹{finData?.overview.total_collected.toLocaleString()}</p>
                            </div>
                            <DollarSign className="text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                            <div>
                                <p className="text-sm text-red-700">Outstanding</p>
                                <p className="text-lg font-bold text-red-900">₹{finData?.overview.pending.toLocaleString()}</p>
                            </div>
                            <Clock className="text-red-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
