'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth, PermissionGuard } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Briefcase, QrCode } from "lucide-react";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import DataTable, { Column } from "@/components/ui/DataTable";
import { getStaff, deleteStaff, type Staff } from "@/lib/api";
import StaffFormModal from "@/components/students/StaffFormModal"; // Re-using folder or move to components/staff later

export default function StaffPage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

    async function load() {
        setLoading(true);
        try {
            const data = await getStaff();
            setStaffList(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user && user.school_id) {
            setQrValue(JSON.stringify({
                school_id: user.school_id,
                type: 'staff_attendance_static'
            }));
        }

        if (hasPermission(['is_superuser', 'core.view_coreuser'])) {
            load();
        } else {
            setLoading(false);
        }

    }, [user, hasPermission]);

    const handleAdd = () => {
        setStaffToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (staff: Staff) => {
        setStaffToEdit(staff);
        setIsModalOpen(true);
    };

    const handleDelete = async (staff: Staff) => {
        if (!confirm(`Are you sure you want to delete ${staff.first_name}?`)) return;
        try {
            await deleteStaff(staff.id);
            load();
        } catch (e) {
            console.error(e);
            alert("Failed to delete staff.");
        }
    };

    const handleSuccess = () => {
        load();
    };


    const columns: Column<Staff>[] = [
        { header: "Name", accessorKey: (row) => `${row.first_name} ${row.last_name}`, className: "font-medium" },
        { header: "Designation", accessorKey: "designation" },
        { header: "Department", accessorKey: "department" },
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
                {hasPermission('core.add_coreuser') && (
                    <button className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700" onClick={handleAdd}>
                        + Add Staff
                    </button>
                )}
            </header>

            <div className="space-y-6">
                {/* QR Code Section - Removed as per user request (Moved to Settings) */}

                {/* Staff List Area */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Staff Directory</h2>
                    </div>
                    {hasPermission('core.view_coreuser') ? (
                        <DataTable
                            columns={columns}
                            data={staffList}
                            isLoading={loading}
                            onEdit={hasPermission('core.change_coreuser') ? handleEdit : undefined}
                            onDelete={hasPermission('core.delete_coreuser') ? handleDelete : undefined}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            You do not have permission to view the staff list.
                        </div>
                    )}
                </div>
            </div>

            <StaffFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                staffToEdit={staffToEdit}
            />
        </div>
    );
}
