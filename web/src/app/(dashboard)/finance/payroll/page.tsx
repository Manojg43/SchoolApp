'use client';

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getPayrollDashboard, generatePayroll, markSalaryPaid, getSchoolSettings, updateSchoolSettings, type PayrollEntry } from "@/lib/api";
import { Search, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PayrollDashboard() {
    const { hasPermission } = useAuth();
    const [entries, setEntries] = useState<PayrollEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [salaryDay, setSalaryDay] = useState(30);

    // Filters
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [search, setSearch] = useState('');
    const [filterPaid, setFilterPaid] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

    useEffect(() => {
        loadData();
    }, [month, year]);

    // Fetch Settings
    useEffect(() => {
        getSchoolSettings().then(s => {
            if (s.salary_calculation_day) setSalaryDay(s.salary_calculation_day);
        }).catch(console.error);
    }, []);

    const handleSalaryDayChange = async (day: number) => {
        if (day < 1 || day > 31) return;
        setSalaryDay(day);
        try {
            await updateSchoolSettings({ salary_calculation_day: day });
        } catch (e) {
            console.error("Failed to update salary day");
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getPayrollDashboard(month, year);
            setEntries(data);
        } catch (e) {
            console.error("Failed to load payroll", e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!confirm(`Generate payroll for ${month}/${year}? This will overwrite existing calculations for this month.`)) return;
        setGenerating(true);
        try {
            const res = await generatePayroll(month, year);
            alert(res.message);
            loadData();
        } catch (e) {
            alert("Failed to generate payroll");
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkPaid = async (id: number) => {
        if (!confirm("Mark this record as PAID?")) return;
        try {
            await markSalaryPaid(id);
            // Optimistic update
            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_paid: true, paid_date: new Date().toISOString().split('T')[0] } : e));
        } catch (e) {
            alert("Failed to update status");
        }
    };

    // Derived Filtering
    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.staff_name.toLowerCase().includes(search.toLowerCase()) ||
            e.designation.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterPaid === 'ALL' ? true :
            filterPaid === 'PAID' ? e.is_paid : !e.is_paid;
        return matchesSearch && matchesStatus;
    });

    const totalPayout = filteredEntries.reduce((sum, e) => sum + parseFloat(e.net_salary), 0);

    if (!hasPermission('core.can_manage_payroll') && !hasPermission('core.is_superuser')) {
        return <div className="p-10 text-center">Unauthorized Access</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
                    <p className="text-gray-500">Manage salaries, generate payslips, and track payments.</p>
                </div>

                <div className="flex gap-3 items-center bg-white p-2 rounded shadow-sm border">
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="border-none bg-transparent font-medium focus:ring-0"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="border-none bg-transparent font-medium focus:ring-0"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {generating ? <Loader2 className="animate-spin" size={16} /> : null}
                    {generating ? 'Calculating...' : 'Generate Payroll'}
                </button>
            </header>

            {/* Configuration */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Payroll Calculation Settings</h3>
                        <p className="text-xs text-gray-600">Calculations use Actual Days in Month (e.g. 28, 30, 31).</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Auto-Calculate On Day:</span>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={salaryDay}
                        onChange={(e) => handleSalaryDayChange(parseInt(e.target.value))}
                        className="w-16 p-1 text-center border rounded text-sm disabled:bg-gray-100"
                    />
                    <span className="text-xs text-gray-500">(Set by Admin)</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterPaid('ALL')}
                        className={`px-3 py-1 text-xs rounded-full ${filterPaid === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >All</button>
                    <button
                        onClick={() => setFilterPaid('PAID')}
                        className={`px-3 py-1 text-xs rounded-full ${filterPaid === 'PAID' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >Paid</button>
                    <button
                        onClick={() => setFilterPaid('UNPAID')}
                        className={`px-3 py-1 text-xs rounded-full ${filterPaid === 'UNPAID' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >Unpaid</button>
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-500">Total Payout</p>
                    <p className="text-xl font-bold">₹{totalPayout.toLocaleString()}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Pay</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-10">Loading Data...</td></tr>
                        ) : filteredEntries.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-500">No records found. Click 'Generate Payroll' to start.</td></tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{entry.staff_name}</div>
                                        <div className="text-xs text-gray-500">{entry.designation}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.present_days} Days
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{parseFloat(entry.base_salary).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ₹{parseFloat(entry.net_salary).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {entry.is_paid ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Paid on {entry.paid_date}
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {!entry.is_paid && (
                                            <button
                                                onClick={() => handleMarkPaid(entry.id)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        {/* Future: Slip Download */}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
