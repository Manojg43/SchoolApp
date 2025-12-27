'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getFees, deleteFee, type Fee } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, IndianRupee, Download, Plus, Trash2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import DataTable, { Column } from "@/components/ui/DataTable";
import FeeInvoiceDrawer from "@/components/finance/FeeInvoiceDrawer";

export default function FeesPage() {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const data = await getFees();
            setFees(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (fee: Fee) => {
        toast.confirm({
            title: `Delete invoice for ${fee.student_name}?`,
            description: 'This action cannot be undone',
            confirmText: 'Delete',
            onConfirm: async () => {
                const loadingToast = toast.loading('Deleting invoice...');
                try {
                    await deleteFee(fee.id);
                    load();
                    toast.success('Invoice deleted successfully');
                } catch (e) {
                    console.error(e);
                    toast.error('Failed to delete invoice', 'Please try again');
                } finally {
                    toast.dismiss(loadingToast);
                }
            }
        });
    };

    const columns: Column<Fee>[] = [
        { header: "ID", accessorKey: "id", className: "w-16 font-mono text-xs text-text-muted" },
        {
            header: "Student",
            accessorKey: (row) => (
                <div>
                    <div className="font-bold text-text-main">{row.student_name}</div>
                    <div className="text-xs text-text-muted">{row.title}</div>
                </div>
            )
        },
        { header: "Amount", accessorKey: (row) => <span className="font-mono font-bold text-text-main">${row.amount}</span>, className: "w-32" },
        { header: "Due Date", accessorKey: "due_date", className: "w-32" },
        {
            header: "Status",
            accessorKey: (row) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.status === 'PAID' ? 'bg-success/10 text-success' :
                    row.status === 'OVERDUE' ? 'bg-error/10 text-error' :
                        'bg-warning/10 text-warning'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                <div className="flex gap-2">
                    <button className="p-1 hover:bg-surface rounded text-primary transition-colors" title="Download Receipt">
                        <Download size={16} />
                    </button>
                    {hasPermission(['is_superuser', 'can_access_finance']) && (
                        <button onClick={() => handleDelete(row)} className="p-1 hover:bg-error/10 rounded text-error transition-colors" title="Delete">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const StatCard = ({ title, value, icon, colorClass, index }: any) => (
        <Animate animation="slideUp" delay={index * 0.1}>
            <Card className="h-full border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                        {icon}
                    </div>
                </CardContent>
            </Card>
        </Animate>
    );

    // Calc Stats
    const totalCollected = fees.reduce((acc, curr) => curr.status === 'PAID' ? acc + Number(curr.amount) : acc, 0);
    const pendingAmount = fees.reduce((acc, curr) => curr.status === 'PENDING' ? acc + Number(curr.amount) : acc, 0);

    return (
        <AnimatePage>
            <div className="min-h-screen p-8 max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Fee Invoices</h1>
                        <p className="text-text-muted mt-1">Manage student invoices, payments, and receipts.</p>
                    </div>
                    {hasPermission(['is_superuser', 'can_access_finance']) && (
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark font-medium shadow-lg shadow-primary/20 transition-all"
                        >
                            <Plus size={18} /> Create Invoice
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        index={0}
                        title="Total Collected"
                        value={`$${totalCollected.toLocaleString()}`}
                        icon={<CheckCircle className="h-6 w-6 text-success" />}
                        colorClass="bg-success/10"
                    />
                    <StatCard
                        index={1}
                        title="Pending (Receivables)"
                        value={`$${pendingAmount.toLocaleString()}`}
                        icon={<IndianRupee className="h-6 w-6 text-warning" />}
                        colorClass="bg-warning/10"
                    />
                    <StatCard
                        index={2}
                        title="Overdue Invoices"
                        value={fees.filter(f => f.status === 'OVERDUE').length}
                        icon={<AlertCircle className="h-6 w-6 text-error" />}
                        colorClass="bg-error/10"
                    />
                </div>

                <Animate animation="fade" delay={0.2}>
                    <Card className="overflow-hidden border-border">
                        <div className="px-6 py-4 border-b border-border bg-surface/50">
                            <h2 className="text-lg font-bold text-text-main">Invoice Ledger</h2>
                        </div>
                        <DataTable
                            columns={columns}
                            data={fees}
                            isLoading={loading}
                        />
                    </Card>
                </Animate>

                <FeeInvoiceDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onSuccess={load}
                />
            </div>
        </AnimatePage>
    );
}
