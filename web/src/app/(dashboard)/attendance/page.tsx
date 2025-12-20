'use client';

import { useLanguage } from "@/context/LanguageContext";

export default function AttendancePage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t('attendance')}</h1>
                <p className="text-gray-500">Track student presence</p>
            </header>

            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                Attendance Module Coming Soon
            </div>
        </div>
    );
}
