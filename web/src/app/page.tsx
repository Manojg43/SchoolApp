'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { School, Lock, User, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_BASE_URL } from '@/lib/api';
import Animate from '@/components/ui/Animate';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

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
      const res = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login(data);
        router.push('/dashboard');
      } else {
        setServerError(data.error || 'Invalid credentials');
      }
    } catch (err: unknown) {
      console.error("Login Error:", err);
      const message = err instanceof Error ? err.message : 'Network error. Please try again.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null; // Prevent flicker while redirecting

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <Animate animation="scale-in" className="z-10 w-full max-w-md p-4">
        <div className="glass-card p-8 rounded-3xl shadow-2xl w-full border border-white/40">
          <div className="flex flex-col items-center mb-8">
            <Animate animation="fade-in" delay={0.2} className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/30 transform rotate-3">
              <School className="w-8 h-8" />
            </Animate>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark tracking-tight">Welcome Back</h1>
            <p className="text-text-muted mt-2 font-medium">Sign in to your dashboard</p>
          </div>

          {serverError && (
            <Animate animation="slide-up" className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {serverError}
            </Animate>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Username</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.username
                    ? 'border-error/50 focus:border-error'
                    : 'border-slate-200 focus:border-primary hover:border-primary/50'
                    }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="text-error text-xs mt-1.5 ml-1 font-medium">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.password
                    ? 'border-error/50 focus:border-error'
                    : 'border-slate-200 focus:border-primary hover:border-primary/50'
                    }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1.5 ml-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-text-muted font-medium bg-white/50 py-2 rounded-lg border border-slate-100 inline-block px-4 shadow-sm">
              Secured by <span className="text-primary font-bold">SchoolApp Secure</span>
            </p>
          </div>
        </div>
      </Animate>
    </div>
  );
}
