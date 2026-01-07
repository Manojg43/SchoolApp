'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStudents, getStudentInvoices, collectPayment, type Student, type Invoice, type StudentFeeBreakup } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Search, IndianRupee, Calculator, Save, AlertCircle } from 'lucide-react';

interface AllocationItem extends StudentFeeBreakup {
    invoice_id: number;
    invoice_title: string;
    allocated_amount_val: number; // Mutable allocation
}

export default function SmartPaymentCollectPage() {
    const { user } = useAuth();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [allocations, setAllocations] = useState<AllocationItem[]>([]);
    const [totalOutstanding, setTotalOutstanding] = useState(0);

    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    // Effect: Load Invoices when student selected
    useEffect(() => {
        if (selectedStudent) {
            loadInvoices(selectedStudent.id);
        }
    }, [selectedStudent]);

    // Effect: Auto-distribute
    useEffect(() => {
        if (!paymentAmount) {
            // Reset allocations to 0 if empty
            const reset = allocations.map(a => ({ ...a, allocated_amount_val: 0 }));
            if (reset.some((r, i) => r.allocated_amount_val !== allocations[i].allocated_amount_val)) {
                setAllocations(reset);
            }
            return;
        }
        distributeAmount(Number(paymentAmount));
    }, [paymentAmount]);

    async function loadStudents() {
        try {
            const data = await getStudents();
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students', error);
        }
    }

    async function loadInvoices(studentId: number) {
        try {
            const data = await getStudentInvoices(studentId, 'PENDING');
            setInvoices(data);

            // Flatten Breakups
            let allBreakups: AllocationItem[] = [];
            let total = 0;

            data.forEach(inv => {
                inv.breakups.forEach(br => {
                    const balance = Number(br.balance); // ensure number
                    if (balance > 0) {
                        allBreakups.push({
                            ...br,
                            invoice_id: inv.id,
                            invoice_title: inv.title,
                            allocated_amount_val: 0
                        });
                        total += balance;
                    }
                });
            });

            setAllocations(allBreakups);
            setTotalOutstanding(total);
            setPaymentAmount(''); // Reset payment

        } catch (error) {
            console.error('Failed to load invoices', error);
            toast.error('Failed to fetch fee details');
        }
    }

    const distributeAmount = (totalPay: number) => {
        let remaining = totalPay;
        const newAllocations = allocations.map(a => ({ ...a, allocated_amount_val: 0 }));

        // Distribution Strategy: Sequential (Clear Oldest Debt first)
        for (const item of newAllocations) {
            if (remaining <= 0) break;

            const balance = Number(item.balance);
            const toPay = Math.min(balance, remaining);

            item.allocated_amount_val = toPay;
            remaining -= toPay;
        }

        setAllocations(newAllocations);
    };

    const handleAllocationChange = (index: number, val: string) => {
        const valNum = Number(val);
        const newAllocations = [...allocations];
        newAllocations[index].allocated_amount_val = valNum;
        setAllocations(newAllocations);

        // Update Total Payment Amount based on changes
        const newTotal = newAllocations.reduce((sum, item) => sum + item.allocated_amount_val, 0);
        setPaymentAmount(newTotal.toFixed(2));
    };

    const handleConfirmPayment = async () => {
        if (isProcessing) return;

        const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated_amount_val, 0);
        if (totalAllocated <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsProcessing(true);
        try {
            // Group allocations by invoice
            const invoiceGroups: { [key: number]: { [headId: number]: number } } = {};

            allocations.forEach(a => {
                if (a.allocated_amount_val > 0) {
                    if (!invoiceGroups[a.invoice_id]) invoiceGroups[a.invoice_id] = {};
                    invoiceGroups[a.invoice_id][a.head] = a.allocated_amount_val;
                }
            });

            // Send requests sequentially
            for (const [invoiceId, heads] of Object.entries(invoiceGroups)) {
                // Calculate sub-total for this receipt
                const subTotal = Object.values(heads).reduce((sum, v) => sum + v, 0);

                await collectPayment({
                    invoice: Number(invoiceId),
                    amount: subTotal,
                    mode: 'CASH', // Default for now
                    custom_allocations: heads
                });
            }

            toast.success('Payment Collected Successfully!');
            // Refresh
            if (selectedStudent) {
                loadInvoices(selectedStudent.id);
            }
            setPaymentAmount('');

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Payment Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 font-display">Smart Fee Collection</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Student Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">1. Select Student</h2>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {students
                            .filter(s =>
                                s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.enrollment_number.includes(searchQuery)
                            )
                            .map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedStudent?.id === student.id
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div className="font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                                    <div className="text-sm text-gray-500 flex justify-between">
                                        <span>#{student.enrollment_number}</span>
                                        <span>{student.class_name || 'N/A'}</span>
                                    </div>
                                </div>
                            ))
                        }
                        {students.length === 0 && (
                            <div className="text-center py-4 text-gray-400">No students found</div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Payment & Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    {selectedStudent ? (
                        <>
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Collecting for {selectedStudent.first_name} {selectedStudent.last_name}
                                    </h2>
                                    <div className="mt-1 flex gap-4 text-sm text-gray-500">
                                        <span>Class: {selectedStudent.class_name} ({selectedStudent.section_name})</span>
                                        <span>•</span>
                                        <span>ID: {selectedStudent.enrollment_number}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 mb-1">Total Outstanding</div>
                                    <div className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</div>
                                </div>
                            </div>

                            {/* Payment Amount Input */}
                            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <label className="block text-sm font-medium text-blue-900 mb-2">
                                    Payment Amount to Collect (₹)
                                </label>
                                <div className="flex gap-4 items-center">
                                    <div className="relative flex-1">
                                        <IndianRupee className="absolute left-4 top-4 w-5 h-5 text-blue-600" />
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 text-xl font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Enter amount..."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="hidden sm:block text-sm text-blue-700 w-1/3 leading-tight">
                                        Amounts are automatically distributed to settle oldest dues first.
                                    </div>
                                </div>
                            </div>

                            {/* Distribution Table */}
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-gray-500" />
                                Allocation Breakdown
                            </h3>

                            {allocations.length > 0 ? (
                                <div className="overflow-hidden border border-gray-200 rounded-lg mb-8">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Head</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">GST</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Allocate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {allocations.map((head, index) => (
                                                <tr key={`${head.invoice_id}-${head.id}`} className={head.allocated_amount_val > 0 ? 'bg-blue-50/30' : ''}>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-900">{head.head_name}</div>
                                                        <div className="text-xs text-gray-500">{head.invoice_title}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {Number(head.gst_rate) > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                {Number(head.gst_rate)}% {head.is_tax_inclusive ? '(Inc)' : '(Exc)'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-600 font-medium">
                                                        ₹{Number(head.balance).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end">
                                                            <span className="text-gray-400 mr-2 text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                value={head.allocated_amount_val > 0 ? head.allocated_amount_val : ''}
                                                                onChange={e => handleAllocationChange(index, e.target.value)}
                                                                className={`w-28 p-2 text-right border rounded text-sm font-semibold transition-colors focus:ring-2 outline-none ${head.allocated_amount_val > Number(head.balance)
                                                                        ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-200'
                                                                        : 'border-gray-300 text-gray-900 focus:ring-blue-200 focus:border-blue-400'
                                                                    }`}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t border-gray-200">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total Allocated:</td>
                                                <td className="px-4 py-3 text-right text-base font-bold text-blue-600">
                                                    ₹{allocations.reduce((sum, h) => sum + h.allocated_amount_val, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-8">
                                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No pending fees found for this student.</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setPaymentAmount('');
                                    }}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={isProcessing || allocations.length === 0}
                                    className={`px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 transition-all ${(isProcessing || allocations.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-px'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Confirm Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Student Selected</h3>
                            <p className="text-gray-500 max-w-xs text-center">Search and select a student from the list to view pending fees and collect payment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
