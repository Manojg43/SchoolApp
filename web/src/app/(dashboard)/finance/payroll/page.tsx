"use client";

import { PageTabs } from "@/components/ui/PageTabs";
import PayrollManager from "@/components/finance/PayrollManager";

export default function PayrollPage() {
    const tabs = [
        { label: 'Invoices', href: '/finance' },
        { label: 'Create Invoice', href: '/finance/create' },
        { label: 'Fee Structure', href: '/finance/structure' },
        { label: 'Payroll', href: '/finance/payroll' },
        { label: 'Discounts', href: '/finance/discounts' },
        { label: 'Certificates', href: '/finance/certificates-fees' },
    ];

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark tracking-tight">Finance & Fees</h1>
                    <p className="text-text-muted mt-1">Payroll Management</p>
                </div>
            </div>

            <PageTabs tabs={tabs} />

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6">
                <PayrollManager />
            </div>
        </div>
    );
}
