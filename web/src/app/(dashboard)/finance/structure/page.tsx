'use client';

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import DataTable, { Column } from "@/components/ui/DataTable";
import {
    getFeeStructures, createFeeStructure, deleteFeeStructure,
    getClasses, getFeeCategories, getAcademicYears,
    type FeeStructure, type ClassItem, type FeeCategory, type AcademicYear
} from "@/lib/api";
import { useRouter } from 'next/navigation';
import Animate, { AnimatePage } from "@/components/ui/Animate";
import { PageTabs } from "@/components/ui/PageTabs";

export default function FeeStructurePage() {
    const router = useRouter();
    const { user, hasPermission } = useAuth();

    // Data
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    const [years, setYears] = useState<AcademicYear[]>([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        academic_year: '',
        class_assigned: '',
        category: '',
        amount: '',
        gst_rate: '0',
        is_tax_inclusive: false
    });

    const tabs = [
        { label: 'Invoices', href: '/finance' },
        { label: 'Create Invoice', href: '/finance/create' },
        { label: 'Fee Structure', href: '/finance/structure' },
        { label: 'Payroll', href: '/finance/payroll' },
        { label: 'Discounts', href: '/finance/discounts' },
        { label: 'Certificates', href: '/finance/certificates-fees' },
    ];

    async function loadData() {
        setLoading(true);
        try {
            const [sData, cData, catData, yData] = await Promise.all([
                getFeeStructures(),
                getClasses(),
                getFeeCategories(),
                getAcademicYears()
            ]);
            setStructures(sData);
            setClasses(cData);
            setCategories(catData);
            setYears(yData);

            // Set default year if available
            const activeYear = yData.find(y => y.is_active);
            if (activeYear) {
                setFormData(prev => ({ ...prev, academic_year: activeYear.id.toString() }));
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load fee structures");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createFeeStructure({
                academic_year: Number(formData.academic_year),
                class_assigned: Number(formData.class_assigned),
                category: Number(formData.category),
                amount: formData.amount,
                gst_rate: formData.gst_rate,
                is_tax_inclusive: formData.is_tax_inclusive
            });
            toast.success("Fee structure created!");
            setShowForm(false);
            loadData();
        } catch (e) {
            toast.error("Failed to create structure");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this fee structure?")) return;
        try {
            await deleteFeeStructure(id);
            toast.success("Deleted successfully");
            loadData();
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    const columns: Column<FeeStructure>[] = [
        { header: "Academic Year", accessorKey: (row) => years.find(y => y.id === row.academic_year)?.name || row.academic_year },
        { header: "Class", accessorKey: (row) => row.class_name || '-' },
        { header: "Category", accessorKey: (row) => row.category_name || '-' },
        { header: "Amount", accessorKey: (row) => `₹${row.amount}` },
        { header: "GST", accessorKey: (row) => `${row.gst_rate}%` },
        {
            header: "Actions",
            accessorKey: (row) => (
                <button
                    onClick={() => handleDelete(row.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        }
    ];

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark tracking-tight">Fee Structure</h1>
                        <p className="text-text-muted mt-1">Configure fees for each class and category</p>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add New Structure
                    </button>
                </div>

                <PageTabs tabs={tabs} />

                {/* Creation Form */}
                {showForm && (
                    <Animate animation="slideUp">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
                            <h3 className="text-lg font-bold mb-4">Add Fee Structure</h3>
                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Academic Year</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.academic_year}
                                        onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(y => (
                                            <option key={y.id} value={y.id}>{y.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Class</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.class_assigned}
                                        onChange={e => setFormData({ ...formData, class_assigned: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fee Category</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                                        Save Structure
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Animate>
                )}

                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={structures}
                        isLoading={loading}
                    />
                </div>
            </div>
        </AnimatePage>
    );
}
