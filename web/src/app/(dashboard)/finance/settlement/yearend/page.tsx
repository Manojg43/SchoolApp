'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { generateYearEndFees } from '@/lib/api';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export default function YearEndGeneratorPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [academicYearId, setAcademicYearId] = useState<number>(1);
    const [autoApplyDiscounts, setAutoApplyDiscounts] = useState(true);
    const [skipPendingFees, setSkipPendingFees] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    async function handleGenerate() {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await generateYearEndFees(academicYearId, {
                auto_apply_discounts: autoApplyDiscounts,
                skip_pending_fees: skipPendingFees
            });

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to generate fees');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 mb-4"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Generate Year-End Fees</h1>
                    <p className="text-gray-500 mt-2">Bulk fee generation for academic year</p>
                </div>

                {!result ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        {/* Settings */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Academic Year
                                </label>
                                <select
                                    value={academicYearId}
                                    onChange={(e) => setAcademicYearId(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value={1}>2024-25</option>
                                    <option value={2}>2025-26</option>
                                </select>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Fee Generation Settings</h3>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoApplyDiscounts}
                                            onChange={(e) => setAutoApplyDiscounts(e.target.checked)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Auto-apply student discounts</p>
                                            <p className="text-sm text-gray-500">
                                                Automatically apply scholarships and discounts
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={skipPendingFees}
                                            onChange={(e) => setSkipPendingFees(e.target.checked)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Skip students with pending fees</p>
                                            <p className="text-sm text-gray-500">
                                                Don't generate new fees for students with unpaid invoices
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={() => router.back()}
                                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Fees'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Success Result */
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center mb-8">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Fee Generation Complete!</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Invoices Created</p>
                                    <p className="text-2xl font-bold text-blue-600">{result.invoices_created}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ₹{(result.total_amount / 100000).toFixed(2)}L
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Discounts Applied</p>
                                    <p className="text-2xl font-bold text-purple-600">{result.discounts_applied}</p>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Students Skipped</p>
                                    <p className="text-2xl font-bold text-yellow-600">{result.students_skipped}</p>
                                </div>
                            </div>

                            {result.students_skipped > 0 && result.skipped_details && (
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-semibold mb-2">Skipped Students:</h3>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {result.skipped_details.map((student: any, idx: number) => (
                                            <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                                                <span className="font-medium">{student.student_name}</span>
                                                <span className="text-gray-500"> - {student.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={() => router.push('/finance/settlement')}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    View Settlement Dashboard
                                </button>
                                <button
                                    onClick={() => setResult(null)}
                                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Generate More
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
