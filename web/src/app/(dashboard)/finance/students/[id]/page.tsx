'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, IndianRupee, FileText, Receipt, Clock, AlertCircle,
    CheckCircle, CreditCard, X, Check, Download, User, Calendar
} from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatINR, formatDateIST, formatDateTimeIST } from '@/lib/formatters';

interface StudentInfo {
    id: number;
    name: string;
    enrollment_number: string;
    class_name: string;
    section_name: string;
}

interface Invoice {
    id: number;
    invoice_id: string;
    title: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    due_date: string;
    status: string;
    is_overdue: boolean;
    is_settled: boolean;
    settlement_note: string;
    discount_amount: number;
    discount_reason: string;
    created_at: string;
}

interface ReceiptItem {
    id: number;
    receipt_no: string;
    invoice_number: string;
    amount: number;
    date: string;
    mode: string;
    transaction_id: string;
    created_by_name: string;
    collected_by_name: string;
    created_at: string;
    remarks: string;
}

interface FeeSummary {
    total_invoices: number;
    pending_invoices: number;
    total_amount: number;
    total_paid: number;
    total_pending: number;
}

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'PARTIAL': 'bg-blue-100 text-blue-800',
    'PAID': 'bg-green-100 text-green-800',
    'OVERDUE': 'bg-red-100 text-red-800',
    'SETTLED': 'bg-purple-100 text-purple-800',
};

const PAYMENT_MODES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'ONLINE', label: 'Online Transfer' },
    { value: 'NEFT', label: 'NEFT/RTGS' },
    { value: 'CARD', label: 'Debit/Credit Card' },
    { value: 'CHEQUE', label: 'Cheque' },
];

export default function StudentFeePage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
    const [summary, setSummary] = useState<FeeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'invoices' | 'receipts'>('invoices');

    // Payment Dialog
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        mode: 'CASH',
        transaction_id: '',
        remarks: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Settlement Dialog
    const [showSettleDialog, setShowSettleDialog] = useState(false);
    const [settleData, setSettleData] = useState({
        settlement_note: '',
        waive_amount: '',
        waive_full: true,
    });

    useEffect(() => {
        if (studentId) {
            loadData();
        }
    }, [studentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/finance/students/${studentId}/fees/`);
            const data = res?.data ?? res;

            setStudent(data.student);
            setInvoices(data.invoices || []);
            setReceipts(data.receipts || []);
            setSummary(data.summary);
        } catch (error) {
            console.error('Failed to load student fees', error);
            toast.error('Failed to load fee data');
        } finally {
            setLoading(false);
        }
    };

    const openPaymentDialog = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentData({
            amount: String(invoice.balance_due),
            mode: 'CASH',
            transaction_id: '',
            remarks: '',
        });
        setShowPaymentDialog(true);
    };

    const openSettleDialog = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setSettleData({
            settlement_note: '',
            waive_amount: String(invoice.balance_due),
            waive_full: true,
        });
        setShowSettleDialog(true);
    };

    const handleCollectPayment = async () => {
        if (!selectedInvoice) return;

        const amount = parseFloat(paymentData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (amount > selectedInvoice.balance_due) {
            toast.error('Amount cannot exceed balance due');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/finance/receipts/', {
                invoice: selectedInvoice.id,
                amount: amount,
                mode: paymentData.mode,
                transaction_id: paymentData.transaction_id,
                remarks: paymentData.remarks,
            });

            toast.success('Payment collected successfully');
            setShowPaymentDialog(false);
            loadData();
        } catch (error) {
            console.error('Failed to collect payment', error);
            toast.error('Failed to collect payment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettleInvoice = async () => {
        if (!selectedInvoice) return;

        if (!settleData.settlement_note.trim()) {
            toast.error('Please provide a settlement note');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                settlement_note: settleData.settlement_note,
            };

            if (!settleData.waive_full) {
                const waiveAmt = parseFloat(settleData.waive_amount);
                if (isNaN(waiveAmt) || waiveAmt <= 0) {
                    toast.error('Please enter a valid waive amount');
                    setSubmitting(false);
                    return;
                }
                payload.waive_amount = waiveAmt;
            }

            await api.post(`/finance/invoices/${selectedInvoice.id}/settle/`, payload);

            toast.success('Invoice settled successfully');
            setShowSettleDialog(false);
            loadData();
        } catch (error: any) {
            console.error('Failed to settle invoice', error);
            toast.error(error?.response?.data?.error || 'Failed to settle invoice');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-text-main">Student Fee Details</h1>
                        {student && (
                            <p className="text-text-muted">
                                {student.name} | {student.enrollment_number} | {student.class_name} {student.section_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-primary">{summary.total_invoices}</p>
                                <p className="text-sm text-text-muted">Total Invoices</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-yellow-600">{summary.pending_invoices}</p>
                                <p className="text-sm text-text-muted">Pending</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-text-main">{formatINR(summary.total_amount)}</p>
                                <p className="text-sm text-text-muted">Total Amount</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{formatINR(summary.total_paid)}</p>
                                <p className="text-sm text-text-muted">Paid</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-red-600">{formatINR(summary.total_pending)}</p>
                                <p className="text-sm text-text-muted">Balance Due</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                    <button
                        onClick={() => setTab('invoices')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'invoices'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        Invoices ({invoices.length})
                    </button>
                    <button
                        onClick={() => setTab('receipts')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'receipts'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                    >
                        <Receipt className="w-4 h-4 inline-block mr-2" />
                        Payment History ({receipts.length})
                    </button>
                </div>

                {/* Invoices Tab */}
                {tab === 'invoices' && (
                    <Card>
                        <CardContent className="p-0">
                            {invoices.length === 0 ? (
                                <div className="text-center py-20 text-text-muted">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No invoices found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="p-4 hover:bg-background/50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-mono text-sm text-primary">{invoice.invoice_id}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                                                            {invoice.status}
                                                        </span>
                                                        {invoice.is_overdue && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Overdue
                                                            </span>
                                                        )}
                                                        {invoice.is_settled && (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                                                Settled
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold text-text-main">{invoice.title}</h3>
                                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Created: {formatDateIST(invoice.created_at)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Due: {formatDateIST(invoice.due_date)}
                                                        </span>
                                                        {invoice.discount_amount > 0 && (
                                                            <span className="text-green-600">
                                                                Discount: {formatINR(invoice.discount_amount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {invoice.settlement_note && (
                                                        <p className="mt-2 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                                            {invoice.settlement_note}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-sm text-text-muted">Total: {formatINR(invoice.total_amount)}</p>
                                                    <p className="text-sm text-green-600">Paid: {formatINR(invoice.paid_amount)}</p>
                                                    <p className="text-xl font-bold text-red-600">{formatINR(invoice.balance_due)}</p>

                                                    {invoice.balance_due > 0 && !invoice.is_settled && (
                                                        <div className="flex gap-2 mt-3 justify-end">
                                                            <button
                                                                onClick={() => openPaymentDialog(invoice)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
                                                            >
                                                                <CreditCard className="w-4 h-4" />
                                                                Collect
                                                            </button>
                                                            <button
                                                                onClick={() => openSettleDialog(invoice)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Settle
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Receipts Tab */}
                {tab === 'receipts' && (
                    <Card>
                        <CardContent className="p-0">
                            {receipts.length === 0 ? (
                                <div className="text-center py-20 text-text-muted">
                                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No payments recorded yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-surface border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Receipt #</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Invoice</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Mode</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Date & Time</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Collected By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {receipts.map((receipt) => (
                                                <tr key={receipt.id} className="hover:bg-background/50">
                                                    <td className="px-4 py-3 font-mono text-sm text-primary">{receipt.receipt_no}</td>
                                                    <td className="px-4 py-3 text-sm">{receipt.invoice_number}</td>
                                                    <td className="px-4 py-3 font-semibold text-green-600">{formatINR(receipt.amount)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                            {receipt.mode}
                                                        </span>
                                                        {receipt.transaction_id && (
                                                            <p className="text-xs text-text-muted mt-1">{receipt.transaction_id}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-text-muted">
                                                        {formatDateTimeIST(receipt.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{receipt.collected_by_name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Payment Collection Dialog */}
                {showPaymentDialog && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h2 className="text-xl font-bold">Collect Payment</h2>
                                <button onClick={() => setShowPaymentDialog(false)} className="p-2 hover:bg-surface rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-surface rounded-lg">
                                    <p className="font-mono text-sm text-primary">{selectedInvoice.invoice_id}</p>
                                    <p className="font-semibold">{selectedInvoice.title}</p>
                                    <p className="text-xl font-bold text-red-600 mt-2">Balance: {formatINR(selectedInvoice.balance_due)}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                                        <input
                                            type="number"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            max={selectedInvoice.balance_due}
                                            className="w-full pl-8 pr-4 py-2 border border-border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                                    <select
                                        value={paymentData.mode}
                                        onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg"
                                    >
                                        {PAYMENT_MODES.map(mode => (
                                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {paymentData.mode !== 'CASH' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Transaction ID</label>
                                        <input
                                            type="text"
                                            value={paymentData.transaction_id}
                                            onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                                            placeholder="UPI ref / NEFT ref"
                                            className="w-full px-4 py-2 border border-border rounded-lg"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Remarks</label>
                                    <textarea
                                        value={paymentData.remarks}
                                        onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-border rounded-lg resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 border-t border-border">
                                <button onClick={() => setShowPaymentDialog(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCollectPayment}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                                >
                                    {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Check className="w-4 h-4" />}
                                    Collect
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settlement Dialog */}
                {showSettleDialog && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-border bg-purple-50">
                                <h2 className="text-xl font-bold text-purple-800">Settle/Waive Invoice</h2>
                                <button onClick={() => setShowSettleDialog(false)} className="p-2 hover:bg-purple-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        This will waive the pending amount. This action cannot be undone.
                                    </p>
                                </div>

                                <div className="p-4 bg-surface rounded-lg">
                                    <p className="font-mono text-sm text-primary">{selectedInvoice.invoice_id}</p>
                                    <p className="font-semibold">{selectedInvoice.title}</p>
                                    <p className="text-xl font-bold text-red-600 mt-2">Balance: {formatINR(selectedInvoice.balance_due)}</p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            checked={settleData.waive_full}
                                            onChange={(e) => setSettleData({ ...settleData, waive_full: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span>Waive full balance ({formatINR(selectedInvoice.balance_due)})</span>
                                    </label>

                                    {!settleData.waive_full && (
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                                            <input
                                                type="number"
                                                value={settleData.waive_amount}
                                                onChange={(e) => setSettleData({ ...settleData, waive_amount: e.target.value })}
                                                max={selectedInvoice.balance_due}
                                                placeholder="Amount to waive"
                                                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Settlement Reason *</label>
                                    <textarea
                                        value={settleData.settlement_note}
                                        onChange={(e) => setSettleData({ ...settleData, settlement_note: e.target.value })}
                                        placeholder="e.g., Financial hardship, Scholarship, Management decision..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-border rounded-lg resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 border-t border-border">
                                <button onClick={() => setShowSettleDialog(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSettleInvoice}
                                    disabled={submitting || !settleData.settlement_note.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Check className="w-4 h-4" />}
                                    Settle Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
