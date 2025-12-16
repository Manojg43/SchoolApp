'use client';

import { useLanguage } from "@/context/LanguageContext";
import { Bus } from "lucide-react";

export default function TransportPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Transport Manager</h1>
                <p className="text-gray-500">Fleet, routes, and stops</p>
            </header>

            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-100">
                <Bus className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Module Under Construction</h2>
                <p className="text-gray-500">Vehicle tracking and transport management will be available here.</p>
            </div>
        </div>
    );
}
