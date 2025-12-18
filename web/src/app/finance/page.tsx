'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth, PermissionGuard } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Check, X, Plus, AlertCircle } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import KPICard from "@/components/ui/KPICard";
import { getFees, createFee, deleteFee, getStudents, type Fee, type Student } from "@/lib/api";

import CreateInvoiceModal from "@/components/finance/CreateInvoiceModal";

export default function FinancePage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [fees, setFees] = useState<Fee[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const [fData, sData] = await Promise.all([getFees(), getStudents()]);
            setFees(fData);
            setStudents(sData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (hasPermission(['is_superuser', 'students.view_fee'])) {
            load();
        } else {
            setLoading(false);
        }
    }, [user, hasPermission]);

    const handleSuccess = () => {
        load();
    };

    const handleDeleteFee = async (fee: Fee) => {
        if (!confirm("Delete this invoice?")) return;
        try {
            await deleteFee(fee.id);
            load();
        } catch (e) {
            alert("Failed to delete fee.");
        }
    };

    const columns: Column<Fee>[] = [
        { header: "Student", accessorKey: "student_name", className: "font-medium" },
        { header: "Title", accessorKey: "title" },
        { header: "Amount", accessorKey: (row) => `₹${row.amount}` },
        { header: "Due Date", accessorKey: "due_date" },
        {
            header: "Status",
            accessorKey: (row) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    row.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
    ];

    // KPIs
    const totalPending = fees.filter(f => f.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalCollected = fees.filter(f => f.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Finance & Fees</h1>
                    <p className="text-gray-500">Track Fee Collection and Invoices</p>
                </div>
                {hasPermission('students.add_fee') && (
                    <button
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Create Invoice
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <KPICard label="Pending Collection" value={`₹${totalPending}`} color="error" />
                <KPICard label="Total Collected" value={`₹${totalCollected}`} color="success" />
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
                </div>
                {hasPermission('students.view_fee') ? (
                    <DataTable
                        columns={columns}
                        data={fees}
                        isLoading={loading}
                        onDelete={hasPermission('students.delete_fee') ? handleDeleteFee : undefined}
                    />
                ) : (
                    <div className="p-8 text-center text-gray-500">Access Denied</div>
                )}
            </div>

            <CreateInvoiceModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
