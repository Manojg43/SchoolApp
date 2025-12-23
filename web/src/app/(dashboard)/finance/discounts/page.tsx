'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFeeDiscounts, createFeeDiscount, deleteFeeDiscount, type FeeDiscount } from '@/lib/api';
import { Plus, Trash2, Search, Filter } from 'lucide-react';

export default function DiscountsPage() {
    const { user } = useAuth();
    const [discounts, setDiscounts] = useState<FeeDiscount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

    // Form state
    const [formData, setFormData] = useState({
        student: '',
        discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        discount_value: '',
        reason: '',
        valid_from: '',
        valid_until: '',
        academic_year: 1
    });

    useEffect(() => {
        loadDiscounts();
    }, [filterActive]);

    async function loadDiscounts() {
        setLoading(true);
        try {
            const data = await getFeeDiscounts({ is_active: filterActive });
            setDiscounts(data);
        } catch (error) {
            console.error('Failed to load discounts:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        try {
            await createFeeDiscount({
                student: Number(formData.student),
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                reason: formData.reason,
                valid_from: formData.valid_from,
                valid_until: formData.valid_until,
                academic_year: formData.academic_year,
                is_active: true
            });

            setShowForm(false);
            setFormData({
                student: '',
                discount_type: 'PERCENTAGE',
                discount_value: '',
                reason: '',
                valid_from: '',
                valid_until: '',
                academic_year: 1
            });
            loadDiscounts();
        } catch (error) {
            console.error('Failed to create discount:', error);
            alert('Failed to create discount');
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this discount?')) return;

        try {
            await deleteFeeDiscount(id);
            loadDiscounts();
        } catch (error) {
            console.error('Failed to delete discount:', error);
            alert('Failed to delete discount');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fee Discounts & Scholarships</h1>
                        <p className="text-gray-500 mt-2">Manage student discounts and financial aid</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Add Discount
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
                            onChange={(e) => setFilterActive(
                                e.target.value === 'all' ? undefined : e.target.value === 'active'
                            )}
                            className="p-2 border border-gray-300 rounded-lg"
                        >
                            <option value="all">All Discounts</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Create Form  */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Create New Discount</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID
                                </label>
                                <input
                                    type="number"
                                    value={formData.student}
                                    onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="Enter student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Type
                                </label>
                                <select
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="PERCENTAGE">Percentage</option>
                                    <option value="FIXED">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Value ({formData.discount_type === 'PERCENTAGE' ? '%' : '₹'})
                                </label>
                                <input
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder={formData.discount_type === 'PERCENTAGE' ? '50' : '5000'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason
                                </label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="Merit Scholarship, Sibling Discount..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid From
                                </label>
                                <input
                                    type="date"
                                    value={formData.valid_from}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid Until
                                </label>
                                <input
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Discount
                            </button>
                        </div>
                    </div>
                )}

                {/* Discounts Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : discounts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No discounts found</div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Valid Period</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.map((discount) => (
                                    <tr key={discount.id} className="border-t hover:bg-gray-50">
                                        <td className="py-3 px-4">{discount.student_name}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                                {discount.discount_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            {discount.discount_type === 'PERCENTAGE'
                                                ? `${discount.discount_value}%`
                                                : `₹${discount.discount_value}`
                                            }
                                        </td>
                                        <td className="py-3 px-4">{discount.reason}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {discount.valid_from} to {discount.valid_until}
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            {discount.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <button
                                                onClick={() => handleDelete(discount.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
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
