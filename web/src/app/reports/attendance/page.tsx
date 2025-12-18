'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { Calendar, User, FileText, Download, Edit2, X, Save } from "lucide-react";
import {
    getStaff,
    getStaffAttendanceReport,
    updateAttendance,
    Staff,
    StaffAttendanceReport
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AttendanceReportPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const isAdmin = user?.role === 'PRINCIPAL' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'is_superuser';

    // Filters
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Data
    const [report, setReport] = useState<StaffAttendanceReport | null>(null);
    const [loading, setLoading] = useState(false);

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<{ id: number, date: string, status: string, check_in: string, check_out: string } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    useEffect(() => {
        if (selectedStaff) {
            fetchReport();
        }
    }, [selectedStaff, month, year]);

    async function loadStaff() {
        try {
            const data = await getStaff();
            setStaffList(data);
            if (data.length > 0) setSelectedStaff(data[0].id);
        } catch (e) {
            console.error("Failed to load staff", e);
        }
    }

    async function fetchReport() {
        if (!selectedStaff) return;
        setLoading(true);
        try {
            const data = await getStaffAttendanceReport(selectedStaff, month, year);
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleEditClick = (log: any) => {
        // Backend text "None" or null needs to be handled
        setEditingLog({
            id: log.id,
            date: log.date,
            status: log.status,
            // HTML Time input expects HH:MM (24h) but we display 12h. Use regex to strip seconds if needed.
            check_in: log.check_in ? log.check_in.substring(0, 5) : '',
            check_out: log.check_out ? log.check_out.substring(0, 5) : ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;
        setSaving(true);
        try {
            await updateAttendance(editingLog.id, {
                status: editingLog.status,
                check_in: editingLog.check_in || undefined,
                check_out: editingLog.check_out || undefined,
                correction_reason: "Admin Correction via Dashboard"
            });
            setEditingLog(null);
            fetchReport(); // Refresh data
        } catch (e) {
            alert("Failed to update attendance");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // Helper: Convert "14:30:00" -> "02:30 PM"
    const formatTime12h = (timeStr?: string) => {
        if (!timeStr || timeStr === 'None') return '-';
        try {
            const [h, m] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m));
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            return timeStr;
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
            case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'HALF_DAY': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'LEAVE': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)] relative">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Staff Attendance Register</h1>
                <p className="text-gray-500">Monthly attendance logs and statistics</p>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 border rounded-lg appearance-none bg-white"
                            value={selectedStaff || ''}
                            onChange={(e) => setSelectedStaff(Number(e.target.value))}
                        >
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                        className="w-full p-2 border rounded-lg bg-white"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg"
                    />
                </div>

                <button onClick={() => window.print()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Print
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading Report...</div>
            ) : report ? (
                <div className="space-y-8 print:space-y-4">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-sm text-green-600 font-medium">Present</p>
                            <p className="text-2xl font-bold text-green-800">{report.stats.present}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <p className="text-sm text-yellow-600 font-medium">Half Day</p>
                            <p className="text-2xl font-bold text-yellow-800">{report.stats.half_day}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-600 font-medium">Leaves</p>
                            <p className="text-2xl font-bold text-blue-800">{report.stats.leave}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="text-sm text-red-600 font-medium">Absent</p>
                            <p className="text-2xl font-bold text-red-800">{report.stats.absent}</p>
                        </div>
                    </div>

                    {/* Calendar / List Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Daily Logs - {report.month}
                            </h2>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-gray-200">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
                            ))}

                            {/* Empty cells for start of month padding could be added here if we had weekday data,
                                but simplistic 1-31 grid is safer if we don't calculate precise offsets.
                                Let's just list them as specific items. */}

                            {/* Actually, let's use a List View instead of a real calendar grid to ensure accuracy without complex date math on client */}
                        </div>

                        {/* List View Upgrade */}
                        <div className="divide-y divide-gray-100">
                            {report.daily_logs.map((log) => (
                                <div key={log.day} className="p-3 flex items-center hover:bg-gray-50 bg-white group">
                                    <div className="w-12 text-center font-bold text-gray-400 text-lg">
                                        {log.day}
                                    </div>
                                    <div className="w-32 text-sm text-gray-600">
                                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                    </div>
                                    <div className="flex-1 flex gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border w-24 text-center ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                        <div className="text-sm text-gray-500 flex gap-4">
                                            <span>IN: <span className="font-medium text-gray-900">{formatTime12h(log.check_in)}</span></span>
                                            <span>OUT: <span className="font-medium text-gray-900">{formatTime12h(log.check_out)}</span></span>
                                        </div>
                                    </div>

                                    {isAdmin && log.id && (
                                        <button
                                            onClick={() => handleEditClick(log)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Edit Attendance"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    Select a staff member to view reports.
                </div>
            )}

            {/* Edit Modal */}
            {editingLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Edit Attendance - {new Date(editingLog.date).toDateString()}</h3>
                            <button onClick={() => setEditingLog(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-gray-50"
                                    value={editingLog.status}
                                    onChange={e => setEditingLog({ ...editingLog, status: e.target.value })}
                                >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="LEAVE">Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check In (24h)</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded-lg"
                                        value={editingLog.check_in}
                                        onChange={e => setEditingLog({ ...editingLog, check_in: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Manual Entry</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Out (24h)</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded-lg"
                                        value={editingLog.check_out}
                                        onChange={e => setEditingLog({ ...editingLog, check_out: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                                Note: Changing Status manually overrides auto-calculation.
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                            <button
                                onClick={() => setEditingLog(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

