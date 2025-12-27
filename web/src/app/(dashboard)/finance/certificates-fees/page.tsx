'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCertificateFees, updateCertificateFee, createCertificateFee, type CertificateFee } from '@/lib/api';
import { toast } from '@/lib/toast';
import { IndianRupee, Save, Plus } from 'lucide-react';

const CERTIFICATE_TYPES = [
    { value: 'BONAFIDE', label: 'Bonafide Certificate' },
    { value: 'TC', label: 'Transfer Certificate' },
    { value: 'LC', label: 'Leaving Certificate' },
    { value: 'MIGRATION', label: 'Migration Certificate' },
    { value: 'CHARACTER', label: 'Character Certificate' },
    { value: 'CONDUCT', label: 'Conduct Certificate' },
    { value: 'STUDY', label: 'Study Certificate' },
    { value: 'ATTENDANCE', label: 'Attendance Certificate' },
    { value: 'SPORTS', label: 'Sports Participation' },
    { value: 'ACHIEVEMENT', label: 'Achievement Certificate' },
    { value: 'FEE_CLEARANCE', label: 'Fee Clearance Certificate' },
    { value: 'COURSE_COMPLETION', label: 'Course Completion' },
    { value: 'CUSTOM', label: 'Custom Certificate' }
];

export default function CertificateFeesPage() {
    const { user } = useAuth();
    const [fees, setFees] = useState<CertificateFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ [key: number]: { amount: string, active: boolean } }>({});

    useEffect(() => {
        loadFees();
    }, []);

    async function loadFees() {
        setLoading(true);
        try {
            const data = await getCertificateFees();
            setFees(data);

            // Initialize edit values
            const values: any = {};
            data.forEach(fee => {
                values[fee.id] = {
                    amount: fee.fee_amount.toString(),
                    active: fee.is_active
                };
            });
            setEditValues(values);
        } catch (error) {
            console.error('Failed to load certificate fees:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(id: number) {
        try {
            await updateCertificateFee(id, {
                fee_amount: Number(editValues[id].amount),
                is_active: editValues[id].active
            });

            setEditingId(null);
            loadFees();
        } catch (error) {
            console.error('Failed to update certificate fee:', error);
            toast.error('Failed to update fee', 'Please try again');
        }
    }

    async function handleAddMissingTypes() {
        const existingTypes = fees.map(f => f.certificate_type);
        const missingTypes = CERTIFICATE_TYPES.filter(t => !existingTypes.includes(t.value));

        try {
            for (const type of missingTypes) {
                await createCertificateFee({
                    certificate_type: type.value,
                    fee_amount: 0,
                    is_active: false
                });
            }
            loadFees();
        } catch (error) {
            console.error('Failed to add missing types:', error);
            toast.error('Failed to add certificate types', 'Please try again');
        }
    }

    function startEdit(id: number) {
        setEditingId(id);
    }

    function cancelEdit() {
        setEditingId(null);
        // Reset to original values
        loadFees();
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Certificate Fee Configuration</h1>
                        <p className="text-gray-500 mt-2">Set fees for different certificate types</p>
                    </div>
                    {fees.length < CERTIFICATE_TYPES.length && (
                        <button
                            onClick={handleAddMissingTypes}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5" />
                            Add Missing Types
                        </button>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800">
                        <strong>Note:</strong> Setting a fee amount greater than ₹0 and marking as active will require
                        payment before certificate generation. Set to ₹0 or mark inactive for free certificates.
                    </p>
                </div>

                {/* Fees Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : fees.length === 0 ? (
                        <div className="p-8 text-center">
                            <IndianRupee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No certificate fees configured yet</p>
                            <button
                                onClick={handleAddMissingTypes}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Add Certificate Types
                            </button>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Certificate Type</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Fee Amount</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map((fee) => (
                                    <tr key={fee.id} className="border-t hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{fee.certificate_type_display}</td>
                                        <td className="text-center py-3 px-4">
                                            {editingId === fee.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>₹</span>
                                                    <input
                                                        type="number"
                                                        value={editValues[fee.id]?.amount || '0'}
                                                        onChange={(e) => setEditValues({
                                                            ...editValues,
                                                            [fee.id]: { ...editValues[fee.id], amount: e.target.value }
                                                        })}
                                                        className="w-24 p-1 border border-gray-300 rounded"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-semibold text-gray-900">
                                                    ₹{fee.fee_amount}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            {editingId === fee.id ? (
                                                <label className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editValues[fee.id]?.active || false}
                                                        onChange={(e) => setEditValues({
                                                            ...editValues,
                                                            [fee.id]: { ...editValues[fee.id], active: e.target.checked }
                                                        })}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            ) : (
                                                fee.is_active ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                                                        Inactive
                                                    </span>
                                                )
                                            )}
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            {editingId === fee.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(fee.id)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(fee.id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
