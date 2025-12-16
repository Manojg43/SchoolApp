'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth, PermissionGuard } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Briefcase, QrCode } from "lucide-react";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import DataTable, { Column } from "@/components/ui/DataTable";
import { getStaff, type Staff } from "@/lib/api";

export default function StaffPage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.school_id) {
            setQrValue(JSON.stringify({
                school_id: user.school_id,
                type: 'staff_attendance_static'
            }));
        }

        async function load() {
            try {
                const data = await getStaff();
                setStaffList(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (hasPermission(['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL'])) {
            load();
        } else {
            setLoading(false);
        }

    }, [user, hasPermission]);

    const columns: Column<Staff>[] = [
        { header: "Name", accessorKey: (row) => `${row.first_name} ${row.last_name}`, className: "font-medium" },
        { header: "Role", accessorKey: "role" },
        { header: "Mobile", accessorKey: "mobile" },
        { header: "Email", accessorKey: "email" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff & Payroll</h1>
                    <p className="text-gray-500">Manage teachers, staff, and salaries</p>
                </div>
                {hasPermission(['is_superuser', 'SCHOOL_ADMIN']) && (
                    <button className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700" onClick={() => alert("Add Staff Modal")}>
                        + Add Staff
                    </button>
                )}
            </header>

            <div className="space-y-6">
                {/* QR Code Section - Only for Principal/Admin */}
                <PermissionGuard perm={['is_superuser', 'PRINCIPAL', 'SCHOOL_ADMIN']}>
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-blue-600" />
                                    Attendance QR Code
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Print this QR code for staff to scan for attendance.
                                    Contains School ID: <span className="font-mono bg-gray-100 px-1 rounded">{user?.school_id}</span>
                                </p>
                            </div>
                            {qrValue && <QRCodeDisplay value={qrValue} size={150} />}
                        </div>
                    </div>
                </PermissionGuard>

                {/* Staff List Area */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Staff Directory</h2>
                    </div>
                    {hasPermission(['is_superuser', 'SCHOOL_ADMIN', 'PRINCIPAL']) ? (
                        <DataTable
                            columns={columns}
                            data={staffList}
                            isLoading={loading}
                            onEdit={hasPermission(['is_superuser', 'SCHOOL_ADMIN']) ? (row) => alert(`Edit ${row.first_name}`) : undefined}
                            onDelete={hasPermission(['is_superuser', 'SCHOOL_ADMIN']) ? (row) => {
                                if (confirm("Are you sure?")) alert(`Delete ${row.first_name}`);
                            } : undefined}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            You do not have permission to view the staff list.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
