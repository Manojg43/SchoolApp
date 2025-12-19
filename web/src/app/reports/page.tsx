'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { FileBarChart, Users, DollarSign, TrendingUp, TrendingDown, Clock, Activity, PieChart } from "lucide-react";
import { getAttendanceAnalytics, getFinanceAnalytics, AttendanceAnalytics, FinanceAnalytics } from "@/lib/api";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";

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

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Activity className="w-8 h-8 text-primary animate-pulse" />
                <p className="text-text-muted text-sm font-medium">Generating Analytics...</p>
            </div>
        </div>
    );

    const collectionRate = finData?.overview.collection_rate || 0;
    const pendingFees = finData?.overview.pending || 0;
    const attPercentage = attData?.students.percentage || 0;

    const MetricCard = ({ title, value, subtext, icon, colorClass, delay }: any) => (
        <Animate animation="slideUp" delay={delay}>
            <Card className="h-full border-border">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                        {icon}
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-text-main">{value}</h3>
                <p className="text-sm font-medium text-text-muted mt-1">{title}</p>
                {subtext && <p className="text-xs text-text-muted mt-2">{subtext}</p>}
            </Card>
        </Animate>
    );

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-8">
                <header className="border-b border-border pb-6">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Reports & Analytics</h1>
                    <p className="text-text-muted mt-1">Real-time system insights for {attData?.date}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard
                        title="Student Attendance"
                        value={`${attData?.students.present}/${attData?.students.total}`}
                        subtext={`${attPercentage}% Participation Rate`}
                        icon={<Users className="w-6 h-6 text-primary" />}
                        colorClass="bg-primary/10"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Staff Attendance"
                        value={`${attData?.staff.present}/${attData?.staff.total_marked}`}
                        subtext="Teachers & Staff On-site"
                        icon={<Clock className="w-6 h-6 text-warning" />}
                        colorClass="bg-warning/10"
                        delay={0.2}
                    />
                    <MetricCard
                        title="Fees Collected"
                        value={`₹${finData?.overview.total_collected.toLocaleString()}`}
                        subtext={`${collectionRate}% of Invoiced Amount`}
                        icon={<DollarSign className="w-6 h-6 text-success" />}
                        colorClass="bg-success/10"
                        delay={0.3}
                    />
                    <MetricCard
                        title="Pending Dues"
                        value={`₹${pendingFees.toLocaleString()}`}
                        subtext="Outstanding Receivables"
                        icon={<TrendingDown className="w-6 h-6 text-error" />}
                        colorClass="bg-error/10"
                        delay={0.4}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Attendance Chart */}
                    <Animate animation="fade" delay={0.5}>
                        <Card className="h-full border-border">
                            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                                <h2 className="text-lg font-bold text-text-main">Class-wise Attendance</h2>
                                <PieChart className="w-5 h-5 text-text-muted" />
                            </div>
                            <div className="p-6 space-y-5">
                                {attData?.class_distribution.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-semibold text-text-main">{item.current_class__name}</span>
                                            <span className="text-text-muted font-mono">{item.count} Students</span>
                                        </div>
                                        <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-2.5 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min((item.count / (attData.students.total || 1)) * 100 * 5, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Animate>

                    {/* Financial Summary */}
                    <Animate animation="fade" delay={0.6}>
                        <Card className="h-full border-border">
                            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                                <h2 className="text-lg font-bold text-text-main">Financial Overview</h2>
                                <TrendingUp className="w-5 h-5 text-text-muted" />
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                                    <div>
                                        <p className="text-xs text-text-muted uppercase font-semibold">Total Invoiced</p>
                                        <p className="text-xl font-bold text-text-main mt-1">₹{finData?.overview.total_invoiced.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-background rounded-lg text-text-muted"><FileBarChart size={20} /></div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-success/5 rounded-xl border border-success/20">
                                    <div>
                                        <p className="text-xs text-success uppercase font-semibold">Collected Revenue</p>
                                        <p className="text-xl font-bold text-success mt-1">₹{finData?.overview.total_collected.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg text-success"><DollarSign size={20} /></div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-error/5 rounded-xl border border-error/20">
                                    <div>
                                        <p className="text-xs text-error uppercase font-semibold">Outstanding Amount</p>
                                        <p className="text-xl font-bold text-error mt-1">₹{finData?.overview.pending.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg text-error"><Clock size={20} /></div>
                                </div>
                            </div>
                        </Card>
                    </Animate>
                </div>
            </div>
        </AnimatePage>
    );
}
