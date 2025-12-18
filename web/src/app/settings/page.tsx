'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { Save, Upload } from "lucide-react";

export default function SettingsPage() {
    const { t } = useLanguage();

    // In a real app, we'd fetch these from GET /api/schools/current/
    // For now, we simulate the state
    const [logo, setLogo] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [watermark, setWatermark] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Settings & Branding</h1>
                <p className="text-gray-500">Customize your school&apos;s identity for reports and interface.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">

                {/* Branding Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">School Identity</h2>

                    <div className="space-y-6">
                        {/* School Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                                    {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Logo</span>}
                                </div>
                                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                                    <Upload className="w-4 h-4" /> Upload
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Appears on Dashboard and Report Headers.</p>
                        </div>

                        {/* Signature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Principal&apos;s Signature</label>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                                    {signature ? <img src={signature} alt="Sign" /> : <span className="text-xs text-gray-400">No Signature</span>}
                                </div>
                                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                                    <Upload className="w-4 h-4" /> Upload
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Auto-appended to generated PDF certificates/receipts.</p>
                        </div>

                        {/* Watermark */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Document Watermark</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                                    {watermark ? <img src={watermark} alt="Watermark" /> : <span className="text-xs text-gray-400">None</span>}
                                </div>
                                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                                    <Upload className="w-4 h-4" /> Upload
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Subtle background image for all official PDFs.</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t flex justify-end">
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Academic Year Settings (Mock) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Academic Sessions</h2>

                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-blue-900">2024-2025</h3>
                                    <p className="text-xs text-blue-700">June 1, 2024 - May 31, 2025</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">ACTIVE</span>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-700">2023-2024</h3>
                                    <p className="text-xs text-gray-500">June 1, 2023 - May 31, 2024</p>
                                </div>
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">ARCHIVED</span>
                            </div>
                        </div>

                        <button className="w-full py-2 border-2 border-dashed text-gray-500 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600">
                            + Start New Academic Year
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
