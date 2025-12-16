'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, PermissionGuard } from '@/context/AuthContext';
import KPICard from '@/components/ui/KPICard';
import { getDashboardStats, getStudents, getStaff, getFees, type Student, type Fee } from '@/lib/api';
import { BarChart3, Users, GraduationCap, IndianRupee, AlertCircle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { motion } from "framer-motion";

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
        // Parallel fetching
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
          schools: 1, // Static for single tenant
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
    { header: "Review", accessorKey: (row) => row.is_active ? "Active" : "Inactive" },
  ];

  const feeColumns: Column<Fee>[] = [
    { header: "Title", accessorKey: "title" },
    { header: "Amount", accessorKey: (row) => `₹${row.amount}` },
    { header: "Status", accessorKey: "status" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.first_name || 'User'}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total Students"
          value={stats.students}
          icon={GraduationCap}
          className="bg-blue-50 text-blue-700"
        />
        <KPICard
          label="Total Staff"
          value={stats.staff}
          icon={Users}
          className="bg-purple-50 text-purple-700"
        />
        <KPICard
          label="Fees Collected"
          value={`₹${stats.collected}`}
          icon={IndianRupee}
          color="success"
        />
        <KPICard
          label="Fees Pending"
          value={`₹${stats.pending}`}
          icon={AlertCircle}
          color="error"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Students */}
        <PermissionGuard perm={['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']}>
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-md font-semibold text-gray-900">Recent Admissions</h3>
            </div>
            <DataTable columns={studentColumns} data={recentStudents} isLoading={loading} />
          </div>
        </PermissionGuard>

        {/* Recent Fees */}
        <PermissionGuard perm={['is_superuser', 'SCHOOL_ADMIN', 'ACCOUNTANT']}>
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-md font-semibold text-gray-900">Recent Invoices</h3>
            </div>
            <DataTable columns={feeColumns} data={recentFees} isLoading={loading} />
          </div>
        </PermissionGuard>
      </div>
    </div>
  );
}
