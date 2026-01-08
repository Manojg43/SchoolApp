import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getPayrollList, generatePayroll, SalaryEntry, markSalaryPaid, getPayslipLink } from "@/lib/api";
import { Loader2, RefreshCw, Play, FileText } from "lucide-react";
import { toast } from "sonner";
// Removed Shadcn imports

export default function PayrollManager() {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [salaries, setSalaries] = useState<SalaryEntry[]>([]);

    // Filter State
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

    // Generate State
    const [generating, setGenerating] = useState(false);
    const [generateMonth, setGenerateMonth] = useState<string>(format(new Date(), "yyyy-MM"));

    useEffect(() => {
        if (activeTab === "overview") {
            fetchPayroll();
        }
    }, [activeTab, selectedMonth]);

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-').map(Number);
            const data = await getPayrollList(month, year);
            setSalaries(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch payroll history");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const [year, month] = generateMonth.split('-').map(Number);
            const res = await generatePayroll(month, year);
            toast.success(`Generated: ${res.generated}, Skipped: ${res.skipped}`);
            setActiveTab("overview");
            setSelectedMonth(generateMonth);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkPaid = async (id: number) => {
        try {
            // Use today as payment date
            const today = format(new Date(), "yyyy-MM-dd");
            await markSalaryPaid(id, today);
            toast.success("Marked as Paid");
            fetchPayroll(); // Refresh
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Payroll Management</h2>
                    <p className="text-sm text-gray-500">Manage staff salaries and generation.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-gray-50 flex items-center"
                        onClick={fetchPayroll}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === "overview"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                        `}
                    >
                        Overview & History
                    </button>
                    <button
                        onClick={() => setActiveTab("run")}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === "run"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                        `}
                    >
                        Run Payroll
                    </button>
                </nav>
            </div>

            {activeTab === "overview" && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4 bg-white p-2 rounded-lg inline-block shadow-sm">
                        <label className="text-sm font-medium ml-2">Month:</label>
                        <input
                            type="month"
                            className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </td>
                                        </tr>
                                    ) : salaries.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-gray-500">
                                                No payroll records found for this month.
                                            </td>
                                        </tr>
                                    ) : (
                                        salaries.map((salary) => {
                                            const totalEarnings = salary.basic_salary + Object.values(salary.earnings || {}).reduce((a, b) => a + Number(b), 0);
                                            const totalDeductions = Object.values(salary.deductions || {}).reduce((a, b) => a + Number(b), 0);

                                            return (
                                                <tr key={salary.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salary.staff_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salary.present_days}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(salary.basic_salary).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+ ₹{totalEarnings.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">- ₹{totalDeductions.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{Number(salary.net_salary).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${salary.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                                salary.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                                            {salary.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex gap-2">
                                                            {salary.status === 'GENERATED' && (
                                                                <button
                                                                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                                                    onClick={() => handleMarkPaid(salary.id)}
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                            <button
                                                                className="text-primary hover:text-primary-dark ml-2"
                                                                title="Download Payslip"
                                                                onClick={async () => {
                                                                    try {
                                                                        const url = await getPayslipLink(salary.id);
                                                                        window.open(url, '_blank');
                                                                    } catch (e) {
                                                                        toast.error("Failed to get download link");
                                                                    }
                                                                }}
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "run" && (
                <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2">Run Payroll Generation</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Calculate salaries for all active staff for a specific month using defined structure and attendance.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Month</label>
                            <input
                                type="month"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={generateMonth}
                                onChange={(e) => setGenerateMonth(e.target.value)}
                            />
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm text-yellow-800">
                            <p className="font-semibold">Note:</p>
                            <ul className="list-disc ml-4 space-y-1 mt-1 opacity-90">
                                <li>Requires defined Salary Structure.</li>
                                <li>Skips already generated records.</li>
                                <li>Assumes 30 days present (Phase 1).</li>
                            </ul>
                        </div>

                        <button
                            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 flex justify-center items-center font-medium transition-colors"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Generate Payroll
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
