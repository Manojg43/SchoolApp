"use client";

import { useState, useEffect } from "react";

import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
// import { format } from "date-fns"; // Removed dependency
import { Trash2, Loader2, Plus, X } from "lucide-react";

export default function NoticesPage() {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "",
        content: "",
        target_role: "ALL",
    });

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const res = await api.get("/notices/"); // Using generic API
            setNotices(res.data || res); // Handle both wrapped and unwrapped
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) return;
        setSaving(true);
        try {
            await api.post("/notices/", form);
            setIsOpen(false);
            setForm({ title: "", content: "", target_role: "ALL" });
            fetchNotices();
        } catch (error) {
            toast.error('Failed to save notice', 'Please try again');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        toast.confirm({
            title: 'Delete Notice?',
            description: 'This action cannot be undone',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/notices/${id}/`);
                    fetchNotices();
                    toast.success('Notice deleted successfully');
                } catch (error) {
                    toast.error('Failed to delete notice');
                }
            }
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Digital Notice Board</h1>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors shadow-sm"
                >
                    <Plus className="mr-2 h-4 w-4" /> Post Notice
                </button>
            </div>

            {
                isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Post New Notice</h3>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g. Holiday Announcement"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                    <div className="relative">
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none transition-all text-gray-700"
                                            value={form.target_role}
                                            onChange={e => setForm({ ...form, target_role: e.target.value })}
                                        >
                                            <option value="ALL">All Staff</option>
                                            <option value="TEACHER">Teachers Only</option>
                                            <option value="DRIVER">Drivers Only</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                                        rows={4}
                                        value={form.content}
                                        onChange={e => setForm({ ...form, content: e.target.value })}
                                        placeholder="Write your notice details here..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Post Notice"}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Title</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">Target</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">Content</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="flex justify-center items-center flex-col gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                            <span className="text-gray-500 font-medium">Loading notices...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : notices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500 bg-gray-50/30">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-gray-100 p-3 rounded-full"><Plus className="w-6 h-6 text-gray-400" /></div>
                                            <span className="font-medium">No notices posted yet.</span>
                                            <span className="text-xs text-gray-400">Click "Post Notice" to create one.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                notices.map((notice) => (
                                    <tr key={notice.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-medium text-xs uppercase tracking-wider">
                                            {new Date(notice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{notice.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${notice.target_role === 'TEACHER' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                notice.target_role === 'DRIVER' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    'bg-brand-100 text-brand-700 border-brand-200 bg-blue-100 text-blue-700 border-blue-200' // Failover to blue
                                                }`}>
                                                {notice.target_role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={notice.content}>
                                            {notice.content}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => handleDelete(notice.id)}
                                                className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Delete Notice"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
