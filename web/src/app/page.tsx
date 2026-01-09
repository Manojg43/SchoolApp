'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { School, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_BASE_URL } from '@/lib/api';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const charLeftRef = useRef<HTMLDivElement>(null);
  const charRightRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Animations
  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(bgRef.current, {
      scale: 1.1,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out'
    });

    tl.from(cardRef.current, {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    }, "-=0.5");

    tl.from(logoRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.7)'
    }, "-=0.5");

    tl.from([charLeftRef.current, charRightRef.current], {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.2
    }, "-=0.8");

    tl.from('.login-field', {
      y: 10,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: 'power2.out'
    }, "-=0.3");

    // Idle floating for characters
    gsap.to([charLeftRef.current, charRightRef.current], {
      y: -10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

  }, { scope: containerRef });

  // Cursor Parallax Movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      if (bgRef.current) {
        gsap.to(bgRef.current, {
          x: -xPos * 0.5,
          y: -yPos * 0.5,
          duration: 1.5,
          ease: 'power1.out'
        });
      }

      if (cardRef.current) {
        gsap.to(cardRef.current, {
          rotateY: xPos * 0.2,
          rotateX: -yPos * 0.2,
          duration: 0.5,
          ease: 'power1.out'
        });
      }

      if (charLeftRef.current) {
        gsap.to(charLeftRef.current, {
          x: xPos * 1,
          y: yPos * 1,
          duration: 1,
          ease: 'power2.out'
        });
      }

      if (charRightRef.current) {
        gsap.to(charRightRef.current, {
          x: -xPos * 1,
          y: yPos * 1,
          duration: 1,
          ease: 'power2.out'
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Shaking Effect on Error
  useEffect(() => {
    if (serverError && cardRef.current) {
      gsap.to(cardRef.current, {
        x: 10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        onComplete: () => { gsap.set(cardRef.current, { x: 0 }); }
      });
    }
  }, [serverError]);

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
      setServerError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans perspective-1000">

      {/* Village Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/village_bg.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Characters - Optimized for "isolated" look */}
      <div ref={charLeftRef} className="absolute left-[8%] bottom-0 z-20 hidden lg:block w-[400px] pointer-events-none">
        <div className="relative group">
          {/* Sub-mask applied via CSS filter/mix-blend if white bg is present */}
          <Image
            src="/assets/student_boy.png"
            alt="Student Boy"
            width={600}
            height={800}
            className="object-contain drop-shadow-[5px_20px_30px_rgba(0,0,0,0.5)] contrast-110"
            style={{ mixBlendMode: 'multiply' }}
          />
          {/* Multiply works for white bg to transparent, but we need to ensure the parent is bright or wrap in white-alpha */}
        </div>
      </div>

      <div ref={charRightRef} className="absolute right-[8%] bottom-0 z-20 hidden lg:block w-[400px] pointer-events-none">
        <Image
          src="/assets/student_girl.png"
          alt="Student Girl"
          width={600}
          height={800}
          className="object-contain drop-shadow-[5px_20px_30px_rgba(0,0,0,0.5)] contrast-110"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      <div className="z-30 w-full max-w-md p-6">
        <div ref={cardRef} className="relative">
          {/* Classic Elegant Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">

            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div ref={logoRef} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 mb-4 shadow-xl">
                <School className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Vidyalaya Login</h1>
              <p className="text-white/60 text-sm mt-1">Connecting Traditional Values with Technology</p>
            </div>

            {serverError && (
              <div className="bg-red-500/20 border border-red-500/20 text-red-100 p-3 rounded-xl text-xs mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="login-field">
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full bg-black/20 border border-white/10 focus:border-amber-400/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/10 outline-none transition-all"
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.username.message}</p>}
              </div>

              <div className="login-field">
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-black/20 border border-white/10 focus:border-amber-400/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/10 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full login-field bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-900/40 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-[10px] text-white/20 font-bold uppercase tracking-[2px] login-field">
              Titan Secure • School Management System
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
