"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/ui/AppShell";
// import { format } from "date-fns"; // Removed dependency
import { api } from "@/lib/api";
import { Loader2, Search, BookOpen, Calendar, User } from "lucide-react";

export default function HomeworkPage() {
    const [homework, setHomework] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = async () => {
        setLoading(true);
        try {
            const res = await api.get("/homework/");
            setHomework(res.data || res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHomework = homework.filter(
        (h) =>
            h.title?.toLowerCase().includes(search.toLowerCase()) ||
            h.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
            h.class_name?.toLowerCase().includes(search.toLowerCase()) ||
            h.subject_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppShell>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Homework Assignments</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Track and monitor assignments given by teachers.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search by Class, Subject or Teacher..."
                        className="pl-10 w-full border border-gray-300 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Assigned Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Class & Section</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Teacher</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">Task Title</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <div className="flex justify-center items-center flex-col gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                            <span className="text-gray-500 font-medium">Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHomework.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500 bg-gray-50/30">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-gray-100 p-3 rounded-full"><BookOpen className="w-6 h-6 text-gray-400" /></div>
                                            <span className="font-medium">No homework records found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHomework.map((h) => (
                                    <tr key={h.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                                                {h.class_name} - {h.section}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-gray-700 font-medium">
                                                <BookOpen className="h-4 w-4 text-blue-500" />
                                                {h.subject_name || h.subject}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {h.teacher_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate" title={h.title}>
                                            {h.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                                Due: {h.due_date}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppShell>
    );
}
