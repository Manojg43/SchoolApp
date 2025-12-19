'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
            <Card hoverEffect className="h-full border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
                <CardHeader className="mb-2">
                    <CardTitle className="text-sm font-medium text-text-muted uppercase tracking-wider">{title}</CardTitle>
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                        {icon}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-text-main">{value}</div>
                    <div className="flex items-center text-xs text-success mt-2 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +12% from last month
                    </div>
                </CardContent>
            </Card>
        </Animate>
    );

    return (
        <AnimatePage>
            <div className="space-y-8 p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Dashboard</h1>
                        <p className="text-text-muted mt-1">Overview for {user?.first_name || 'User'}</p>
                    </div>
                    <div className="text-sm text-text-muted bg-surface px-4 py-2 rounded-lg border border-border shadow-sm">
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
                        colorClass="bg-primary/10"
                    />
                    <StatCard
                        index={1}
                        title="Total Staff"
                        value={stats.staff}
                        icon={<Users className="h-5 w-5 text-secondary" />}
                        colorClass="bg-secondary/10"
                    />
                    <StatCard
                        index={2}
                        title="Fees Collected"
                        value={`₹${stats.collected}`}
                        icon={<IndianRupee className="h-5 w-5 text-success" />}
                        colorClass="bg-success/10"
                    />
                    <StatCard
                        index={3}
                        title="Fees Pending"
                        value={`₹${stats.pending}`}
                        icon={<AlertCircle className="h-5 w-5 text-error" />}
                        colorClass="bg-error/10"
                    />
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Students */}
                    <PermissionGuard perm={['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']}>
                        <Animate animation="fade" delay={0.4}>
                            <Card className="h-full overflow-hidden">
                                <CardHeader className="bg-background/50 px-6 py-4 border-b border-border mb-0">
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle>Recent Admissions</CardTitle>
                                        <button className="text-xs text-primary font-medium hover:underline">View All</button>
                                    </div>
                                </CardHeader>
                                <div className="p-0">
                                    <DataTable columns={studentColumns} data={recentStudents} isLoading={loading} />
                                </div>
                            </Card>
                        </Animate>
                    </PermissionGuard>

                    {/* Recent Fees */}
                    <PermissionGuard perm={['is_superuser', 'SCHOOL_ADMIN', 'ACCOUNTANT']}>
                        <Animate animation="fade" delay={0.5}>
                            <Card className="h-full overflow-hidden">
                                <CardHeader className="bg-background/50 px-6 py-4 border-b border-border mb-0">
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle>Recent Invoices</CardTitle>
                                        <button className="text-xs text-primary font-medium hover:underline">View All</button>
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
