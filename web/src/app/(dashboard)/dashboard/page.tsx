'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { getStudents, getStaff, getFees, type Student, type Fee } from '@/lib/api';
import { GraduationCap, Users, IndianRupee, AlertCircle, ArrowUpRight } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import Animate, { AnimatePage } from '@/components/ui/Animate';
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
            <Card hoverEffect className="h-full border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-surface border-l-4 border-l-primary group overflow-hidden relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{title}</CardTitle>
                        <div className={`p-2 rounded-lg bg-background/50 text-primary transition-transform duration-300 group-hover:scale-110`}>
                            {icon}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-text-main tracking-tight">{value}</div>
                    <div className="flex items-center text-xs text-text-muted mt-2">
                        <span className="font-medium text-success mr-2">+12%</span>
                        <span>from last month</span>
                    </div>
                </CardContent>
            </Card>
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
                        icon={<GraduationCap className="h-5 w-5 text-primary" />}
                        colorClass="bg-primary/10 shadow-inner"
                    />
                    <StatCard
                        index={1}
                        title="Total Staff"
                        value={stats.staff}
                        icon={<Users className="h-5 w-5 text-secondary" />}
                        colorClass="bg-secondary/10 shadow-inner"
                    />
                    <StatCard
                        index={2}
                        title="Fees Collected"
                        value={`₹${stats.collected}`}
                        icon={<IndianRupee className="h-5 w-5 text-success" />}
                        colorClass="bg-success/10 shadow-inner"
                    />
                    <StatCard
                        index={3}
                        title="Fees Pending"
                        value={`₹${stats.pending}`}
                        icon={<AlertCircle className="h-5 w-5 text-error" />}
                        colorClass="bg-error/10 shadow-inner"
                    />
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Students */}
                    <PermissionGuard perm={['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']}>
                        <Animate animation="fade" delay={0.4}>
                            <Card className="h-full overflow-hidden border-border/60 shadow-lg bg-surface/80 backdrop-blur-sm">
                                <CardHeader className="bg-surface/50 px-6 py-4 border-b border-border/50 mb-0">
                                    import Link from 'next/link'; // Added import

                                    // ... inside component

                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className=" text-lg font-bold">Recent Admissions</CardTitle>
                                        <Link href="/students" className="text-xs text-primary font-bold hover:underline bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">View Directory</Link>
                                    </div>

// ... inside fees card

                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className="text-lg font-bold">Recent Invoices</CardTitle>
                                        <Link href="/fees" className="text-xs text-primary font-bold hover:underline bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">View Finance</Link>
                                    </div>
                                </CardHeader>
                                <div className="p-0">
                                    <DataTable columns={feeColumns} data={recentFees} isLoading={loading} />
                                </div>
                            </Card>
                        </Animate>
                    </PermissionGuard>
                </div>
            </div>
        </AnimatePage>
    );
}
