'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { getStudents, getStaff, getFees, type Student, type Fee } from '@/lib/api';
import { GraduationCap, Users, IndianRupee, AlertCircle, ArrowUpRight } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import Animate, { AnimatePage } from '@/components/ui/Animate';
import { BarChart, MultiBarChart } from '@/components/ui/charts/BarChart';
import { PermissionGuard } from '@/context/AuthContext';

export default function Dashboard() {
    const { user, hasPermission } = useAuth();
    const [stats, setStats] = useState({ students: 0, schools: 0, staff: 0, collected: 0, pending: 0 });
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);
    const [recentFees, setRecentFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [sList, stList, fList] = await Promise.all([
                    hasPermission(['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']) ? getStudents() : Promise.resolve([]),
                    hasPermission(['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']) ? getStaff() : Promise.resolve([]),
                    hasPermission(['is_superuser', 'SCHOOL_ADMIN', 'ACCOUNTANT']) ? getFees() : Promise.resolve([])
                ]);

                const totalStudents = sList.length;
                const totalStaff = stList.length;
                const collected = fList.filter(f => f.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0);
                const pending = fList.filter(f => f.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0);

                setStats({
                    students: totalStudents,
                    schools: 1,
                    staff: totalStaff,
                    collected,
                    pending
                });

                setRecentStudents(sList.slice(0, 5));
                setRecentFees(fList.slice(0, 5));

            } catch (e) {
                console.error("Dashboard Load Error", e);
            } finally {
                setLoading(false);
            }
        }

        if (user) load();
    }, [user, hasPermission]);

    const studentColumns: Column<Student>[] = [
        { header: "Name", accessorKey: (row) => `${row.first_name} ${row.last_name}` },
        {
            header: "Review", accessorKey: (row) => row.is_active ?
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">Active</span> :
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-text-muted/10 text-text-muted">Inactive</span>
        },
    ];

    const feeColumns: Column<Fee>[] = [
        { header: "Title", accessorKey: "title" },
        { header: "Amount", accessorKey: (row) => `₹${row.amount}` },
        {
            header: "Status", accessorKey: (row) =>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {row.status}
                </span>
        },
    ];

    const StatCard = ({ title, value, icon, colorClass, index }: any) => (
        <Animate animation="slideUp" delay={index * 0.1}>
            <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${colorClass}`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium opacity-90">{title}</p>
                        <h3 className="text-3xl font-bold mt-2">{value}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        {icon}
                    </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium opacity-80">
                    <span className="bg-white/20 px-2 py-1 rounded text-white flex gap-1 items-center">
                        <ArrowUpRight className="w-3 h-3" /> 12%
                    </span>
                    <span className="ml-2">from last month</span>
                </div>
            </div>
        </Animate>
    );

    return (
        <AnimatePage>
            <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-text-main tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-secondary">Dashboard</h1>
                        <p className="text-text-muted mt-1 font-medium">Overview & Analytics for {user?.first_name || 'User'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/50 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        index={0}
                        title="Total Students"
                        value={stats.students}
                        icon={<GraduationCap className="h-6 w-6 text-white" />}
                        colorClass="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
                    />
                    <StatCard
                        index={1}
                        title="Total Staff"
                        value={stats.staff}
                        icon={<Users className="h-6 w-6 text-white" />}
                        colorClass="bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20"
                    />
                    <StatCard
                        index={2}
                        title="Fees Collected"
                        value={`₹${stats.collected}`}
                        icon={<IndianRupee className="h-6 w-6 text-white" />}
                        colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    />
                    <StatCard
                        index={3}
                        title="Fees Pending"
                        value={`₹${stats.pending}`}
                        icon={<AlertCircle className="h-6 w-6 text-white" />}
                        colorClass="bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20"
                    />
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Animate animation="fade" delay={0.2}>
                        <Card className="h-full border border-white/40 shadow-lg bg-surface/50 backdrop-blur-md overflow-hidden">
                            <CardHeader className="border-b border-border/50 p-6">
                                <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Student Enrollment</CardTitle>
                                <p className="text-xs text-text-muted mt-1">New students per month (2024)</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <BarChart
                                    data={[12, 19, 15, 25, 32, 20]}
                                    labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
                                    height={220}
                                />
                            </CardContent>
                        </Card>
                    </Animate>

                    <Animate animation="fade" delay={0.3}>
                        <Card className="h-full border border-white/40 shadow-lg bg-surface/50 backdrop-blur-md overflow-hidden">
                            <CardHeader className="border-b border-border/50 p-6">
                                <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">Revenue Overview</CardTitle>
                                <p className="text-xs text-text-muted mt-1">Collection vs Pending (Last 6 Months)</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <MultiBarChart
                                    datasets={[
                                        { label: 'Collected', data: [45, 52, 38, 65, 48, 60], color: 'bg-emerald-500' },
                                        { label: 'Pending', data: [12, 15, 8, 20, 10, 12], color: 'bg-amber-400' }
                                    ]}
                                    labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
                                    height={220}
                                />
                            </CardContent>
                        </Card>
                    </Animate>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Students */}
                    {/* Recent Details */}
                    <Animate animation="fade" delay={0.4} className="h-full">
                        <Card className="h-full border border-white/40 shadow-xl bg-white/60 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-6">
                                <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">Recent Activity</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">New Admissions</h3>
                                        <Link href="/students" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View All</Link>
                                    </div>
                                    <DataTable columns={studentColumns} data={recentStudents} isLoading={loading} />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Fee Collections</h3>
                                        <Link href="/fees" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View All</Link>
                                    </div>
                                    <DataTable columns={feeColumns} data={recentFees} isLoading={loading} />
                                </div>
                            </div>
                        </Card>
                    </Animate>
                </div>
            </div>
        </AnimatePage>
    );
}
