'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    IndianRupee, Search, Filter, RefreshCw, Calendar as CalendarIcon,
    Receipt, CreditCard, X, Check, AlertCircle, Clock, CheckCircle,
    User, Phone, FileText, ChevronDown
} from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api, { getClasses, ClassItem } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatINR, formatDateIST, formatDateTimeIST } from '@/lib/formatters';

interface Invoice {
    id: number;
    invoice_id: string;
    student: number;
    student_name: string;
    class_name: string;
    title: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    due_date: string;
    status: string;
    is_overdue: boolean;
    academic_year: number;
    fee_term: string;
    created_at: string;
}

interface ReceivablesSummary {
    total_invoices: number;
    total_amount: number;
    total_paid: number;
    total_pending: number;
}

interface ReceivedPayment {
    id: number;
    receipt_no: string;
    invoice_number: string;
    student_name: string;
    amount: number;
    date: string;
    mode: string;
    transaction_id: string;
    created_by_name: string;
    collected_by_name: string;
    created_at: string;
    remarks: string;
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

export default function ReceivablesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'receivables' | 'history'>('receivables');

    // Payment History
    const [payments, setPayments] = useState<ReceivedPayment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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

    useEffect(() => {
        loadClasses();
        loadData();
    }, [statusFilter, classFilter]);

    useEffect(() => {
        if (tab === 'history') {
            loadPaymentHistory();
        }
    }, [tab, dateFrom, dateTo]);

    const loadClasses = async () => {
        try {
            const data = await getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (classFilter) params.append('class_id', classFilter);

            const queryString = params.toString() ? `?${params.toString()}` : '';

            const res = await api.get(`/finance/receivables/${queryString}`);
            const data = res?.data ?? res;

            setInvoices(data.invoices || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error('Failed to load receivables', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentHistory = async () => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const queryString = params.toString() ? `?${params.toString()}` : '';

            const res = await api.get(`/finance/payment-history/${queryString}`);
            const data = res?.data ?? res;

            setPayments(data.receipts || []);
        } catch (error) {
            console.error('Failed to load payment history', error);
            toast.error('Failed to load payment history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setClassFilter('');
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = statusFilter || classFilter || searchQuery || dateFrom || dateTo;

    const filteredInvoices = invoices.filter(inv =>
        searchQuery === '' ||
        inv.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            loadData(); // Refresh data
        } catch (error) {
            console.error('Failed to collect payment', error);
            toast.error('Failed to collect payment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Fee Collection</h1>
                        <p className="text-text-muted">Manage pending receivables and collect payments</p>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Total Invoices</p>
                                        <p className="text-xl font-bold text-text-main">{summary.total_invoices}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Total Amount</p>
                                        <p className="text-xl font-bold text-text-main">{formatINR(summary.total_amount)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Collected</p>
                                        <p className="text-xl font-bold text-green-600">{formatINR(summary.total_paid)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted">Pending</p>
                                        <p className="text-xl font-bold text-red-600">{formatINR(summary.total_pending)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                    <button
                        onClick={() => setTab('receivables')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'receivables'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                    >
                        <IndianRupee className="w-4 h-4 inline-block mr-2" />
                        Pending Receivables
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                    >
                        <Receipt className="w-4 h-4 inline-block mr-2" />
                        Payment History
                    </button>
                </div>

                {/* Receivables Tab */}
                {tab === 'receivables' && (
                    <>
                        {/* Filters */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search by student name or invoice ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2 border border-border rounded-lg min-w-[140px]"
                                    >
                                        <option value="">All Status</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="PARTIAL">Partial Paid</option>
                                        <option value="OVERDUE">Overdue</option>
                                    </select>

                                    <select
                                        value={classFilter}
                                        onChange={(e) => setClassFilter(e.target.value)}
                                        className="px-4 py-2 border border-border rounded-lg min-w-[140px]"
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>

                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main">
                                            <RefreshCw className="w-4 h-4" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Invoices List */}
                        <Card>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : filteredInvoices.length === 0 ? (
                                    <div className="text-center py-20 text-text-muted">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                                        <p>No pending payments</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {filteredInvoices.map((invoice) => (
                                            <div key={invoice.id} className="p-4 hover:bg-background/50 transition-colors">
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
                                                        </div>
                                                        <h3 className="font-semibold text-text-main">{invoice.student_name}</h3>
                                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                                                            <span>{invoice.class_name}</span>
                                                            <span>{invoice.title}</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                Due: {formatDateIST(invoice.due_date)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-text-muted">Balance Due</p>
                                                        <p className="text-xl font-bold text-red-600">{formatINR(invoice.balance_due)}</p>
                                                        <p className="text-xs text-text-muted mt-1">
                                                            of {formatINR(invoice.total_amount)}
                                                        </p>
                                                        <button
                                                            onClick={() => openPaymentDialog(invoice)}
                                                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Collect Payment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Payment History Tab */}
                {tab === 'history' && (
                    <>
                        {/* Date Filters */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-text-muted" />
                                        <span className="text-sm text-text-muted">From</span>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="px-3 py-2 border border-border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-muted">To</span>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="px-3 py-2 border border-border rounded-lg"
                                        />
                                    </div>
                                    {(dateFrom || dateTo) && (
                                        <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main">
                                            <RefreshCw className="w-4 h-4" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payments List */}
                        <Card>
                            <CardContent className="p-0">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="text-center py-20 text-text-muted">
                                        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>No payment history found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-surface border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Receipt #</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Student</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Mode</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Date & Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Collected By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {payments.map((payment) => (
                                                    <tr key={payment.id} className="hover:bg-background/50">
                                                        <td className="px-4 py-3 font-mono text-sm text-primary">{payment.receipt_no}</td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-medium text-text-main">{payment.student_name}</p>
                                                                <p className="text-xs text-text-muted">{payment.invoice_number}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-green-600">{formatINR(payment.amount)}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                                {payment.mode}
                                                            </span>
                                                            {payment.transaction_id && (
                                                                <p className="text-xs text-text-muted mt-1">{payment.transaction_id}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-text-muted">
                                                            {formatDateTimeIST(payment.created_at)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <div>
                                                                <p className="font-medium text-text-main">{payment.collected_by_name}</p>
                                                                <p className="text-xs text-text-muted">Created by: {payment.created_by_name}</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
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
                                {/* Invoice Info */}
                                <div className="p-4 bg-surface rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-sm text-primary">{selectedInvoice.invoice_id}</p>
                                            <p className="font-semibold text-text-main">{selectedInvoice.student_name}</p>
                                            <p className="text-sm text-text-muted">{selectedInvoice.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-text-muted">Balance</p>
                                            <p className="text-xl font-bold text-red-600">{formatINR(selectedInvoice.balance_due)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount to Collect *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                                        <input
                                            type="number"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            max={selectedInvoice.balance_due}
                                            className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Payment Mode */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                                    <select
                                        value={paymentData.mode}
                                        onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    >
                                        {PAYMENT_MODES.map(mode => (
                                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Transaction ID (optional) */}
                                {paymentData.mode !== 'CASH' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Transaction ID</label>
                                        <input
                                            type="text"
                                            value={paymentData.transaction_id}
                                            onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                                            placeholder="e.g., UPI ref number"
                                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>
                                )}

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Remarks</label>
                                    <textarea
                                        value={paymentData.remarks}
                                        onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                                        placeholder="Any notes about this payment"
                                        rows={2}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 border-t border-border">
                                <button
                                    onClick={() => setShowPaymentDialog(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCollectPayment}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Collect {formatINR(parseFloat(paymentData.amount) || 0)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
