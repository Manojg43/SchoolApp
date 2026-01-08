'use client';

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus, Trash2, Filter, X, Save, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import DataTable, { Column } from "@/components/ui/DataTable";
import {
    getFeeStructures, createFeeStructure, deleteFeeStructure,
    getClasses, getFeeCategories, getAcademicYears, getSections,
    type FeeStructure, type ClassItem, type FeeCategory, type AcademicYear, type SectionItem
} from "@/lib/api";
import { useRouter } from 'next/navigation';
import Animate, { AnimatePage } from "@/components/ui/Animate";
import { PageTabs } from "@/components/ui/PageTabs";
import ModernCard from "@/components/ui/modern/Card";

interface FeeRow {
    category: string;
    amount: string;
    gst_rate: string;
    is_tax_inclusive: boolean;
}

export default function FeeStructurePage() {
    const router = useRouter();
    const { user } = useAuth();

    // Data
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        academic_year: '',
        class_assigned: '',
        section: ''
    });

    // Bulk Form State
    const [bulkFormData, setBulkFormData] = useState({
        academic_year: '',
        class_assigned: '',
        section: '',
    });

    const [feeRows, setFeeRows] = useState<FeeRow[]>([
        { category: '', amount: '', gst_rate: '0', is_tax_inclusive: false }
    ]);

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
            const f = {
                academic_year: filters.academic_year ? Number(filters.academic_year) : undefined,
                class_assigned: filters.class_assigned ? Number(filters.class_assigned) : undefined,
                section: filters.section ? Number(filters.section) : undefined
            };
            const [sData, cData, catData, yData] = await Promise.all([
                getFeeStructures(f),
                getClasses(),
                getFeeCategories(),
                getAcademicYears()
            ]);
            setStructures(sData);
            setClasses(cData);
            setCategories(catData);
            setYears(yData);

            // Set default year if not set
            if (!filters.academic_year) {
                const activeYear = yData.find(y => y.is_active);
                if (activeYear) {
                    setFilters(prev => ({ ...prev, academic_year: activeYear.id.toString() }));
                    setBulkFormData(prev => ({ ...prev, academic_year: activeYear.id.toString() }));
                }
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
    }, [user, filters.academic_year, filters.class_assigned, filters.section]);

    useEffect(() => {
        const loadSectionsForFilter = async () => {
            if (filters.class_assigned) {
                try {
                    const sData = await getSections(undefined, Number(filters.class_assigned));
                    // No need to set global sections state if we use a local one or just use global
                    setSections(sData);
                } catch (e) { console.error(e); }
            }
        };
        loadSectionsForFilter();
    }, [filters.class_assigned]);

    useEffect(() => {
        const loadSections = async () => {
            if (bulkFormData.class_assigned) {
                try {
                    const sData = await getSections(undefined, Number(bulkFormData.class_assigned));
                    setSections(sData);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSections([]);
            }
        };
        loadSections();
    }, [bulkFormData.class_assigned]);

    const addFeeRow = () => {
        setFeeRows([...feeRows, { category: '', amount: '', gst_rate: '0', is_tax_inclusive: false }]);
    };

    const removeFeeRow = (index: number) => {
        if (feeRows.length > 1) {
            const newRows = [...feeRows];
            newRows.splice(index, 1);
            setFeeRows(newRows);
        }
    };

    const updateFeeRow = (index: number, field: keyof FeeRow, value: any) => {
        const newRows = [...feeRows];
        newRows[index] = { ...newRows[index], [field]: value };

        // Auto-fill GST from category if category changed
        if (field === 'category') {
            const cat = categories.find(c => c.id.toString() === value);
            if (cat) {
                newRows[index].gst_rate = cat.gst_rate;
                newRows[index].is_tax_inclusive = cat.is_tax_inclusive;
            }
        }

        setFeeRows(newRows);
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Validate
            if (!bulkFormData.academic_year || !bulkFormData.class_assigned) {
                toast.error("Please select Year and Class");
                setSaving(false);
                return;
            }

            const validRows = feeRows.filter(r => r.category && r.amount);
            if (validRows.length === 0) {
                toast.error("Add at least one fee component");
                setSaving(false);
                return;
            }

            // Create structures sequentially (simplest)
            let successCount = 0;
            for (const row of validRows) {
                try {
                    await createFeeStructure({
                        academic_year: Number(bulkFormData.academic_year),
                        class_assigned: Number(bulkFormData.class_assigned),
                        section: bulkFormData.section ? Number(bulkFormData.section) : undefined,
                        category: Number(row.category),
                        amount: row.amount,
                        gst_rate: row.gst_rate,
                        is_tax_inclusive: row.is_tax_inclusive
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to create for category ${row.category}`, err);
                }
            }

            if (successCount > 0) {
                toast.success(`Created ${successCount} fee structures!`);
                setShowForm(false);
                setFeeRows([{ category: '', amount: '', gst_rate: '0', is_tax_inclusive: false }]);
                loadData();
            } else {
                toast.error("Failed to create fee structures");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
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
        { header: "Section", accessorKey: (row) => structures.find(s => s.id === row.id)?.section ? sections.find(sec => sec.id === row.section)?.name || 'Specific' : 'All Sections' },
        { header: "Category", accessorKey: (row) => row.category_name || '-' },
        {
            header: "Amount",
            accessorKey: (row) => (
                <div className="font-semibold text-text-main">
                    ₹{Number(row.amount).toLocaleString()}
                </div>
            )
        },
        {
            header: "GST",
            accessorKey: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-primary">{row.gst_rate}%</span>
                    <span className="text-[10px] text-text-muted">{row.is_tax_inclusive ? 'Inclusive' : 'Exclusive'}</span>
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                <button
                    onClick={() => handleDelete(row.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
                        <p className="text-text-muted mt-1 text-sm font-medium">Configure and manage multi-component fee structures</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md active:scale-95 ${showForm ? 'bg-surface text-text-main border border-border' : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg'
                                }`}
                        >
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? 'Close Form' : 'Add Fee Structure'}
                        </button>
                    </div>
                </div>

                <PageTabs tabs={tabs} />

                {/* Filters */}
                <ModernCard className="border-none shadow-sm bg-surface/50">
                    <div className="p-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text-muted mr-2">
                            <Filter className="w-4 h-4" />
                            Filters:
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Academic Year</label>
                            <select
                                value={filters.academic_year}
                                onChange={e => setFilters({ ...filters, academic_year: e.target.value })}
                                className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="">Select Year</option>
                                {years.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Class</label>
                            <select
                                value={filters.class_assigned}
                                onChange={e => setFilters({ ...filters, class_assigned: e.target.value })}
                                className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Section</label>
                            <select
                                value={filters.section}
                                onChange={e => setFilters({ ...filters, section: e.target.value })}
                                className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-w-[120px]"
                            >
                                <option value="">All Sections</option>
                                {classes.find(c => c.id.toString() === filters.class_assigned) && (
                                    <>
                                        <option value="0">General (Class-wide)</option>
                                        {/* Sections would be fetched based on class filter if needed, 
                                            for now keep it simple or implement recursive fetch */}
                                    </>
                                )}
                            </select>
                        </div>

                        {(filters.class_assigned || filters.section) && (
                            <button
                                onClick={() => setFilters({ ...filters, class_assigned: '', section: '' })}
                                className="mt-4 text-xs text-primary font-bold hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </ModernCard>

                {/* Bulk Creation Form */}
                {showForm && (
                    <Animate animation="slideUp">
                        <ModernCard className="border-2 border-primary/10 shadow-xl overflow-visible">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-primary" />
                                    Configure Fee Components
                                </h3>

                                <form onSubmit={handleBulkCreate} className="space-y-8">
                                    {/* Global Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface/30 p-4 rounded-xl border border-border">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">Academic Year</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={bulkFormData.academic_year}
                                                onChange={e => setBulkFormData({ ...bulkFormData, academic_year: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Year</option>
                                                {years.map(y => (
                                                    <option key={y.id} value={y.id}>{y.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">Class</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={bulkFormData.class_assigned}
                                                onChange={e => setBulkFormData({ ...bulkFormData, class_assigned: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">Section (Optional)</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={bulkFormData.section}
                                                onChange={e => setBulkFormData({ ...bulkFormData, section: e.target.value })}
                                            >
                                                <option value="">All Sections (Default)</option>
                                                {sections.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Fee Components Rows */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Fee Components</h4>
                                            <button
                                                type="button"
                                                onClick={addFeeRow}
                                                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Add Component
                                            </button>
                                        </div>

                                        {feeRows.map((row, idx) => (
                                            <div key={idx} className="group flex flex-col md:flex-row items-end gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary/30 transition-all">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Category</label>
                                                    <select
                                                        className="w-full px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                        value={row.category}
                                                        onChange={e => updateFeeRow(idx, 'category', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32">
                                                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="w-full px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                                                        value={row.amount}
                                                        onChange={e => updateFeeRow(idx, 'amount', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="w-full md:w-24">
                                                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">GST %</label>
                                                    <select
                                                        className="w-full px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                        value={row.gst_rate}
                                                        onChange={e => updateFeeRow(idx, 'gst_rate', e.target.value)}
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2 h-9 px-3 bg-surface/30 rounded-lg border border-border/50">
                                                    <input
                                                        type="checkbox"
                                                        id={`inc-${idx}`}
                                                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                                                        checked={row.is_tax_inclusive}
                                                        onChange={e => updateFeeRow(idx, 'is_tax_inclusive', e.target.checked)}
                                                    />
                                                    <label htmlFor={`inc-${idx}`} className="text-xs font-medium cursor-pointer">Tax Inclusive</label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeeRow(idx)}
                                                    className="mb-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-6 py-2.5 text-sm font-bold text-text-muted hover:text-text-main transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {saving ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            {saving ? 'Creating...' : 'Save All Components'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </ModernCard>
                    </Animate>
                )}

                {/* Data Table */}
                <ModernCard className="border-none shadow-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={structures}
                        isLoading={loading}
                    />
                </ModernCard>
            </div>
        </AnimatePage>
    );
}

