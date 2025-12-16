'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { School, Lock, User, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// 1. Define Validation Schema
const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    // 2. Setup Form Hook
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (formData: LoginSchema) => {
        setIsLoading(true);
        setServerError('');

        try {
            // BYPASS PROXY: Direct connection to Render Backend
            const res = await fetch('https://schoolapp-6vwg.onrender.com/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                login(data);
                // 3. Redirect to Dashboard on Success
                router.push('/');
            } else {
                setServerError(data.error || 'Invalid credentials');
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            setServerError(err.message || 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-600 p-4 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
                        <School className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                    <p className="text-gray-500 mt-2 font-medium">Sign in to your dashboard</p>
                </div>

                {serverError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {serverError}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                {...register('username')}
                                type="text"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${errors.username
                                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/10'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/30'
                                    }`}
                                placeholder="Enter your username"
                            />
                        </div>
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                {...register('password')}
                                type="password"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${errors.password
                                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/10'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/30'
                                    }`}
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg">
                        Secured by Multi-Tenant Architecture
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
