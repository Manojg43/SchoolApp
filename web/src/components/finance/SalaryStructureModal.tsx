import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getSalaryStructure, saveSalaryStructure, type Staff } from '@/lib/api';

interface SalaryStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
}

export default function SalaryStructureModal({ isOpen, onClose, staff }: SalaryStructureModalProps) {
    const [baseSalary, setBaseSalary] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && staff) {
            loadStructure();
        } else {
            setBaseSalary('');
            setError(null);
        }
    }, [isOpen, staff]);

    const loadStructure = async () => {
        if (!staff) return;
        setLoading(true);
        try {
            const data = await getSalaryStructure(staff.id);
            setBaseSalary(data.base_salary.toString());
        } catch (e) {
            console.error(e);
            setError("Failed to load salary info.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staff) return;

        const salary = parseFloat(baseSalary);
        if (isNaN(salary) || salary < 0) {
            setError("Invalid salary amount");
            return;
        }

        setSaving(true);
        try {
            await saveSalaryStructure(staff.id, salary);
            onClose();
        } catch (e) {
            console.error(e);
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !staff) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Manage Salary</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600">Setting salary for:</p>
                    <p className="font-bold text-lg">{staff.first_name} {staff.last_name}</p>
                    <p className="text-xs text-gray-500">{staff.designation} - {staff.department}</p>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading structure...</div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Monthly Base Salary (₹)</label>
                            <input
                                type="number"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="e.g. 25000"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Structure'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
