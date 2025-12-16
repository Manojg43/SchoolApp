'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { getAttendance, type Attendance } from "@/lib/api";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_ICONS: Record<string, any> = {
    P: <CheckCircle className="w-5 h-5 text-green-500" />,
    A: <XCircle className="w-5 h-5 text-red-500" />,
    L: <Clock className="w-5 h-5 text-yellow-500" />
};

export default function AttendancePage() {
    const { t } = useLanguage();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getAttendance();
                setAttendance(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t('attendance')}</h1>
                <p className="text-gray-500">Track student presence</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-500">Date</th>
                                <th className="p-4 font-medium text-gray-500">{t('student')}</th>
                                <th className="p-4 font-medium text-gray-500">Status</th>
                                <th className="p-4 font-medium text-gray-500">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">No attendance records found.</td>
                                </tr>
                            ) : attendance.map((record) => (
                                <motion.tr
                                    key={record.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b hover:bg-gray-50/50"
                                >
                                    <td className="p-4 text-gray-600">{record.date}</td>
                                    <td className="p-4 font-medium text-gray-900">{record.student_name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {STATUS_ICONS[record.status]}
                                            <span className="text-sm font-medium">
                                                {record.status === 'P' ? t('present') : record.status === 'A' ? t('absent') : 'Late'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">{record.remarks || '-'}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
