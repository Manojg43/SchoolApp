'use client';

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getStaffDailyAttendance, updateAttendance, type StaffDailyLog } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Search, Loader2, Calendar, Clock, AlertCircle } from "lucide-react";

export default function StaffAttendancePage() {
    const { hasPermission } = useAuth();
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<StaffDailyLog[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getStaffDailyAttendance(date);
            setRecords(res.records);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (attId: number | null | undefined, staffId: number, newStatus: string) => {
        if (!hasPermission('core.can_mark_manual_attendance')) {
            toast.error('No permission to modify attendance', 'Contact administrator');
            return;
        }

        const reason = prompt("Enter reason for modification:");
        if (!reason) return;

        try {
            if (attId) {
                // Update existing
                await updateAttendance(attId, { status: newStatus, correction_reason: reason });
            } else {
                // Should potentially create new record? API helper `updateAttendance` calls `.../update/`.
                // If record doesn't exist, we can't update. Backend DailyView returns attendance_id if exists.
                // Creating attendance for ABSENT record isn't supported by `updateAttendance`. 
                // We need a 'mark' API or `attendance/scan` manual override.
                // For MVP, user can only update if it exists or we need a new "create/update" endpoint.
                // Assuming "updateAttendance" endpoint might be flexible or I need to handle creation.
                // Actually `StaffAttendance` uses (staff, date) unique.
                // Let's assume for now we only support changing if record exists (PRESENT/HALF/LEAVE) or we show alert.
                toast.info('Cannot modify ABSENT record', 'Use Mobile App or Manual Mark for check-in');
                return;
            }
            loadData();
        } catch (e) {
            toast.error('Failed to update status', 'Please try again');
        }
    };

    const filtered = records.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    const stats = {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        leave: records.filter(r => r.status === 'LEAVE').length,
        half: records.filter(r => r.status === 'HALF_DAY').length,
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Attendance</h1>
                    <p className="text-gray-500">Daily logs and status overview.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-none focus:ring-0 text-gray-700 font-medium"
                    />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500">
                    <p className="text-xs text-gray-500 font-bold uppercase">Present</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                    <p className="text-xs text-gray-500 font-bold uppercase">Absent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-500">
                    <p className="text-xs text-gray-500 font-bold uppercase">Leave</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.leave}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                    <p className="text-xs text-gray-500 font-bold uppercase">Half Day</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.half}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 flex items-center gap-4">
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
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="py-10 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-gray-500">No records found</td></tr>
                        ) : (
                            filtered.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{log.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                            log.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                log.status === 'LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.check_in !== '-' ? (
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} /> {log.check_in}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.check_out !== '-' ? log.check_out : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleUpdateStatus(log.attendance_id, log.id, 'PRESENT')}
                                            className="text-blue-600 hover:text-blue-900 mr-2 disabled:opacity-50"
                                            disabled={!log.attendance_id}
                                            title={!log.attendance_id ? "Cannot modify unused record" : "Mark Present"}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
