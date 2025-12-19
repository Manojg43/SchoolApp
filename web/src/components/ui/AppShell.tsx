"use client";

import React, { useState } from 'react';
import {
    Users, BookOpen, Calculator, Bus, Award,
    Menu, Bell, Settings, LogOut, LayoutDashboard,
    Plus, UserPlus, Megaphone
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Staff', href: '/staff', icon: Users }, // Staff Management
        { name: 'Academic', href: '/academic/homework', icon: BookOpen }, // Homework, Timetable
        { name: 'Communication', href: '/communication/notices', icon: Megaphone }, // Notices
        { name: 'Finance', href: '/finance', icon: Calculator },
        { name: 'Transport', href: '/transport', icon: Bus },
        { name: 'Certificates', href: '/certificates', icon: Award },
        { name: 'Reports', href: '/reports', icon: BookOpen },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const { user, logout } = useAuth();
    const [isProfileOpen, setProfileOpen] = useState(false);

    // FIX: Full Screen for Login Page (Root or /login)
    if (pathname === '/login' || pathname === '/') {
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    const handleLogout = () => {
        logout();
        // Router push handled by AuthContext or Effect in LoginPage, but good to be explicit
        // window.location.href = '/'; 
    };

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

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!isProfileOpen)}
                                className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-offset-2 hover:ring-primary focus:outline-none transition-all"
                            >
                                {user?.first_name?.[0]?.toUpperCase() || 'U'}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50">
                                    <div className="px-4 py-2 border-b">
                                        <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <Settings className="w-4 h-4" /> Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>

                    {/* Floating Action Button (FAB) */}
                    <FAB />
                </main>
            </div>
        </div>
    );
}

function FAB() {
    const [isOpen, setIsOpen] = useState(false);
    const { push } = useRouter();

    const toggleOpen = () => setIsOpen(!isOpen);

    const actions = [
        { label: "New Student", icon: UserPlus, onClick: () => push('/students?action=new'), color: "bg-blue-600" },
        { label: "Add Fees", icon: Calculator, onClick: () => push('/finance'), color: "bg-green-600" },
        // { label: "Ask AI", icon: Sparkles, onClick: () => push('/ai'), color: "bg-purple-600" }, // Removed AI
    ];

    return (
        <div className="fixed bottom-8 right-8 flex flex-col items-end z-50">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end space-y-3 mb-3">
                        {actions.map((action, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => { action.onClick(); setIsOpen(false); }}
                                className="flex items-center group"
                            >
                                <span className="mr-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {action.label}
                                </span>
                                <div className={`${action.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ring-2 ring-white ring-offset-2`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={toggleOpen}
                animate={{ rotate: isOpen ? 135 : 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-full shadow-2xl text-white transition-all duration-300 ring-4 ring-white ring-offset-2 ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                <Plus className="w-6 h-6" />
            </motion.button>
        </div>
    );
}
