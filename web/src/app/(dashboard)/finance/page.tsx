'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import DataTable, { Column } from "@/components/ui/DataTable";
import KPICard from "@/components/ui/KPICard";
import { getFees, deleteFee, API_BASE_URL, type Fee } from "@/lib/api";

import { useRouter } from 'next/navigation';

import Animate, { AnimatePage } from "@/components/ui/Animate";
import { PageTabs } from "@/components/ui/PageTabs";

export default function FinancePage() {
    const router = useRouter();
    const { user, hasPermission } = useAuth();
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { label: 'Invoices', href: '/finance' },
        { label: 'Create Invoice', href: '/finance/create' },
        { label: 'Payroll', href: '/finance/payroll' },
        { label: 'Discounts', href: '/finance/discounts' },
        { label: 'Certificates', href: '/finance/certificates-fees' },
    ];

    async function load() {
        setLoading(true);
        try {
            const fData = await getFees();
            setFees(fData);
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

    const handleDeleteFee = async (fee: Fee) => {
        toast.confirm({
            title: 'Delete this invoice?',
            description: 'This action cannot be undone',
            confirmText: 'Delete',
            onConfirm: async () => {
                const loadingToast = toast.loading('Deleting invoice...');
                try {
                    await deleteFee(fee.id);
                    load();
                    toast.success('Invoice deleted successfully');
                } catch {
                    toast.error('Failed to delete invoice', 'Please try again');
                } finally {
                    toast.dismiss(loadingToast);
                }
            }
        });
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
        {
            header: "Actions",
            accessorKey: (row) => (
                <a
                    href={`${API_BASE_URL}/finance/invoice/${row.id}/pdf/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                >
                    View PDF
                </a>
            )
        }
    ];

    // KPIs
    const totalPending = fees.filter(f => f.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalCollected = fees.filter(f => f.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark tracking-tight">Finance & Fees</h1>
                        <p className="text-text-muted mt-1">Track Fee Collection and Invoices</p>
                    </div>
                    {hasPermission('students.add_fee') && (
                        <button
                            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2 font-medium transition-all duration-300 transform hover:-translate-y-0.5"
                            onClick={() => router.push('/finance/create')}
                        >
                            <Plus className="w-4 h-4" /> Create Invoice
                        </button>
                    )}
                </div>

                <PageTabs tabs={tabs} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <KPICard label="Pending Collection" value={`₹${totalPending}`} color="error" />
                    <KPICard label="Total Collected" value={`₹${totalCollected}`} color="success" />
                </div>

                <Animate animation="fade" delay={0.2}>
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-white/50">
                            <h2 className="text-lg font-bold text-gray-800">Recent Invoices</h2>
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
                </Animate>
            </div>
        </AnimatePage>
    );
}
