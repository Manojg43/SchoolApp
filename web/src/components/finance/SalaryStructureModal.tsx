"use client";

import { useEffect, useState } from "react";
import FormModal from "@/components/ui/FormModal";

import { Staff, getSalaryStructure, saveSalaryStructure, SalaryStructure } from "@/lib/api";
import { Plus, Trash2, Loader2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface SalaryStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
}

export default function SalaryStructureModal({ isOpen, onClose, staff }: SalaryStructureModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [structure, setStructure] = useState<SalaryStructure>({
        staff: staff?.id || 0,
        basic_salary: 0,
        allowances: {},
        deductions: {},
        net_salary: 0
    });

    // Helper for dynamic fields
    const [allowanceList, setAllowanceList] = useState<{ key: string; value: number }[]>([]);
    const [deductionList, setDeductionList] = useState<{ key: string; value: number }[]>([]);

    useEffect(() => {
        if (isOpen && staff) {
            loadStructure();
        } else {
            // Reset
            setAllowanceList([]);
            setDeductionList([]);
            setStructure({
                staff: 0,
                basic_salary: 0,
                allowances: {},
                deductions: {},
                net_salary: 0
            });
        }
    }, [isOpen, staff]);

    const loadStructure = async () => {
        if (!staff) return;
        setLoading(true);
        try {
            const data = await getSalaryStructure(staff.id!);
            if (data) {
                setStructure(data);
                // Convert object to list for UI
                setAllowanceList(Object.entries(data.allowances || {}).map(([key, value]) => ({ key, value })));
                setDeductionList(Object.entries(data.deductions || {}).map(([key, value]) => ({ key, value })));
            } else {
                // New
                setStructure(prev => ({ ...prev, staff: staff.id! }));
                setAllowanceList([]);
                setDeductionList([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load salary structure");
        } finally {
            setLoading(false);
        }
    };

    // Calculation Logic
    const calculateNet = () => {
        const basic = Number(structure.basic_salary) || 0;
        const totalAllowances = allowanceList.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        const totalDeductions = deductionList.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        return basic + totalAllowances - totalDeductions;
    };

    const handleSave = async () => {
        if (!staff) return;
        setSaving(true);
        try {
            // Convert lists back to objects
            const allowanceObj: Record<string, number> = {};
            allowanceList.forEach(item => { if (item.key) allowanceObj[item.key] = Number(item.value); });

            const deductionObj: Record<string, number> = {};
            deductionList.forEach(item => { if (item.key) deductionObj[item.key] = Number(item.value); });

            const payload: SalaryStructure = {
                ...structure,
                staff: staff.id!,
                allowances: allowanceObj,
                deductions: deductionObj,
                net_salary: calculateNet() // ensure updated
            };

            await saveSalaryStructure(payload);
            toast.success("Salary Structure Saved");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save structure");
        } finally {
            setSaving(false);
        }
    };

    // Component Handlers
    const addAllowance = () => setAllowanceList([...allowanceList, { key: '', value: 0 }]);
    const removeAllowance = (idx: number) => setAllowanceList(allowanceList.filter((_, i) => i !== idx));
    const updateAllowance = (idx: number, field: 'key' | 'value', val: string | number) => {
        const list = [...allowanceList];
        // @ts-ignore
        list[idx] = { ...list[idx], [field]: val };
        setAllowanceList(list);
    };

    const addDeduction = () => setDeductionList([...deductionList, { key: '', value: 0 }]);
    const removeDeduction = (idx: number) => setDeductionList(deductionList.filter((_, i) => i !== idx));
    const updateDeduction = (idx: number, field: 'key' | 'value', val: string | number) => {
        const list = [...deductionList];
        // @ts-ignore
        list[idx] = { ...list[idx], [field]: val };
        setDeductionList(list);
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Salary Structure: ${staff?.first_name || ''}`}
            size="md"
        >
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
                <div className="space-y-6 py-4 px-1">
                    {/* Basic Salary */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Basic Salary</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="number"
                                className="w-full pl-9 h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={structure.basic_salary}
                                onChange={(e) => setStructure({ ...structure, basic_salary: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Allowances */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Allowances</label>
                            <button className="text-sm flex items-center text-primary hover:underline" onClick={addAllowance}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </button>
                        </div>
                        {allowanceList.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    className="flex-1 h-9 rounded-md border border-gray-300 px-3 py-1 text-sm"
                                    placeholder="Name (e.g. HRA)"
                                    value={item.key}
                                    onChange={(e) => updateAllowance(idx, 'key', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="w-32 h-9 rounded-md border border-gray-300 px-3 py-1 text-sm"
                                    placeholder="Amount"
                                    value={item.value}
                                    onChange={(e) => updateAllowance(idx, 'value', Number(e.target.value))}
                                />
                                <button className="p-2 text-red-500 hover:bg-red-50 rounded" onClick={() => removeAllowance(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {allowanceList.length === 0 && <p className="text-xs text-gray-500 italic">No allowances added.</p>}
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Deductions</label>
                            <button className="text-sm flex items-center text-primary hover:underline" onClick={addDeduction}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </button>
                        </div>
                        {deductionList.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    className="flex-1 h-9 rounded-md border border-gray-300 px-3 py-1 text-sm"
                                    placeholder="Name (e.g. Tax)"
                                    value={item.key}
                                    onChange={(e) => updateDeduction(idx, 'key', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="w-32 h-9 rounded-md border border-gray-300 px-3 py-1 text-sm"
                                    placeholder="Amount"
                                    value={item.value}
                                    onChange={(e) => updateDeduction(idx, 'value', Number(e.target.value))}
                                />
                                <button className="p-2 text-red-500 hover:bg-red-50 rounded" onClick={() => removeDeduction(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {deductionList.length === 0 && <p className="text-xs text-gray-500 italic">No deductions added.</p>}
                    </div>

                    {/* Summary */}
                    <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">Estimated Net Salary</span>
                            <span className="text-xl font-bold font-mono">₹ {calculateNet().toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">Includes all earnings minus deductions.</p>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Structure
                        </button>
                    </div>
                </div>
            )}
        </FormModal>
    );
}
