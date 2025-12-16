"use client";

import React, { useState } from 'react';
import {
    Users, BookOpen, Calculator, Bus, Award,
    Menu, Bell, Settings, LogOut, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Staff', href: '/staff', icon: Users },
        { name: 'Finance', href: '/finance', icon: Calculator },
        { name: 'Transport', href: '/transport', icon: Bus },
        { name: 'Certificates', href: '/certificates', icon: Award },
        { name: 'Reports', href: '/reports', icon: BookOpen },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0`}
            >
                <div className="h-16 flex items-center justify-center border-b px-6">
                    <h1 className="text-2xl font-bold text-primary">SchoolApp</h1>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Sticky Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 mr-4 text-gray-500 lg:hidden focus:outline-none"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">
                            {pathname.split('/')[1] || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Year Selector */}
                        <select className="hidden md:block border-gray-300 rounded-md text-sm bg-gray-50 py-1">
                            <option>2024-2025</option>
                            <option>2025-2026</option>
                        </select>

                        {/* Language (Mock) */}
                        <button className="text-sm font-medium text-gray-600 hover:text-primary">EN</button>

                        {/* Notifications */}
                        <button className="text-gray-500 hover:text-primary relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>

                        {/* Profile */}
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                            A
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
