"use client";

import { useState, useEffect } from "react";

// import { format } from "date-fns"; // Removed dependency
import { api } from "@/lib/api";
import { Loader2, Search, BookOpen, Calendar, User } from "lucide-react";

export default function HomeworkPage() {
    const [homework, setHomework] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Filters
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default Today

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [homeworkRes, classesRes] = await Promise.all([
                api.get("/homework/"),
                api.get("/classes/")
            ]);
            setHomework(homeworkRes.data || homeworkRes);
            setClasses(classesRes.data || classesRes);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHomework = homework.filter((h) => {
        // 1. Text Search
        const matchesSearch =
            h.title?.toLowerCase().includes(search.toLowerCase()) ||
            h.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
            h.class_name?.toLowerCase().includes(search.toLowerCase()) ||
            h.subject_name?.toLowerCase().includes(search.toLowerCase());

        // 2. Class Filter
        const matchesClass = selectedClass ? h.class_name === classes.find((c) => c.id.toString() === selectedClass)?.name : true;

        // 3. Date Filter (Compare YYYY-MM-DD)
        // h.created_at is typically ISO timestamp, extract date part
        const homeworkDate = new Date(h.created_at).toISOString().split('T')[0];
        const matchesDate = selectedDate ? homeworkDate === selectedDate : true;

        return matchesSearch && matchesClass && matchesDate;
    });

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Homework Assignments</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Track and monitor assignments given by teachers.
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Select date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            className="pl-10 w-full border border-gray-300 rounded-lg py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Filter by Class</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative w-full md:w-80 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search assignments..."
                        className="pl-10 w-full border border-gray-300 rounded-lg py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-200 backdrop-blur-sm">
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
                                    <td colSpan={6} className="text-center py-20">
                                        <div className="flex justify-center items-center flex-col gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                            <span className="text-gray-500 font-medium">Fetching homework...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHomework.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-gray-500 bg-gray-50/30">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-gray-100 p-4 rounded-full"><BookOpen className="w-8 h-8 text-gray-400" /></div>
                                            <span className="font-semibold text-gray-600">No homework found</span>
                                            <span className="text-gray-400 text-xs">Try changing the date or class filter</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHomework.map((h) => (
                                    <tr key={h.id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                <span className="font-medium text-gray-700">
                                                    {new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                                                {h.class_name} - {h.section}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-gray-700 font-medium">
                                                <BookOpen className="h-4 w-4 text-blue-500/70" />
                                                {h.subject_name || h.subject}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                                                    {h.teacher_name?.charAt(0) || 'T'}
                                                </div>
                                                {h.teacher_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate" title={h.title}>
                                            {h.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
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
        </>
    );
}
