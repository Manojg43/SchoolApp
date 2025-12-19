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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl opacity-60" />
      </div>

      <Animate animation="fade" className="z-10 w-full max-w-md">
        <div className="bg-surface p-8 rounded-2xl shadow-xl border border-border w-full">
          <div className="flex flex-col items-center mb-8">
            <Animate animation="scale" delay={0.2} className="bg-primary/10 p-4 rounded-2xl text-primary mb-4 shadow-sm">
              <School className="w-10 h-10" />
            </Animate>
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Welcome Back</h1>
            <p className="text-text-muted mt-2 font-medium">Sign in to your dashboard</p>
          </div>

          {serverError && (
            <Animate animation="slideUp" className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 border border-error/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {serverError}
            </Animate>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  {...register('username')}
                  type="text"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all bg-background ${errors.username
                    ? 'border-error/30 focus:ring-error/20 focus:border-error'
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="text-error text-xs mt-1.5 ml-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all bg-background ${errors.password
                    ? 'border-error/30 focus:ring-error/20 focus:border-error'
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1.5 ml-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-text-muted font-medium bg-background py-2 rounded-lg border border-border">
              Secured by Multi-Tenant Architecture
            </p>
          </div>
        </div>
      </Animate>
    </div>
  );
}
