'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; // Added useAuth
import { useEffect, useState } from "react";
import { getFees, type Fee } from "@/lib/api";
import { motion } from "framer-motion";
import { Loader2, DollarSign, Download, AlertCircle } from "lucide-react";

export default function FeesPage() {
    const { t } = useLanguage();
    const { hasPermission } = useAuth(); // Destructure hasPermission
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getFees();
                setFees(data);
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
                <h1 className="text-3xl font-bold text-gray-900">{t('fee_invoice')}</h1>
                <p className="text-gray-500">Manage invoices and payments</p>
                {hasPermission(['is_superuser', 'can_access_finance']) && (
                    <button className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-blue-700" onClick={() => alert("Create Invoice Modal")}>
                        + Create Invoice
                    </button>
                )}
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fees.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-gray-400">No invoices found.</div>
                    ) : fees.map((invoice, i) => (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col justify-between h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{invoice.student_name}</h3>
                                    <p className="text-gray-500 text-sm">{invoice.title}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                    invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {invoice.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Amount</span>
                                    <span className="font-bold text-lg">${invoice.amount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Due Date</span>
                                    <span className="text-gray-700">{invoice.due_date}</span>
                                </div>
                            </div>

                            <button
                                className="w-full flex justify-center items-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors font-medium text-sm"
                            >
                                <Download className="w-4 h-4" /> Download Receipt
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
