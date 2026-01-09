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
  const blobsRef = useRef<HTMLDivElement[]>([]);
  const charLeftRef = useRef<HTMLDivElement>(null);
  const charRightRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Animations
  useGSAP(() => {
    const tl = gsap.timeline();

    // Background Blobs floating
    blobsRef.current.forEach((blob, i) => {
      gsap.to(blob, {
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        duration: 'random(4, 7)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.5
      });
    });

    tl.from(cardRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    tl.from(logoRef.current, {
      scale: 0,
      rotate: -15,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.7)'
    }, "-=0.5");

    tl.from([charLeftRef.current, charRightRef.current], {
      x: (i) => i === 0 ? -100 : 100,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.2
    }, "-=1");

    tl.from('.login-field', {
      x: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: 'power2.out'
    }, "-=0.3");

    // Breathing animation for characters
    gsap.to([charLeftRef.current, charRightRef.current], {
      y: 15,
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
      const xPos = (clientX / window.innerWidth - 0.5) * 40;
      const yPos = (clientY / window.innerHeight - 0.5) * 40;

      if (logoRef.current) {
        gsap.to(logoRef.current, {
          x: xPos,
          y: yPos,
          rotate: xPos * 0.2,
          duration: 1,
          ease: 'power2.out'
        });
      }

      // Parallax for characters
      if (charLeftRef.current) {
        gsap.to(charLeftRef.current, {
          x: xPos * 1.5,
          y: yPos * 1.5,
          rotate: yPos * 0.1,
          duration: 1.2,
          ease: 'power2.out'
        });
      }

      if (charRightRef.current) {
        gsap.to(charRightRef.current, {
          x: -xPos * 1.5,
          y: yPos * 1.5,
          rotate: -yPos * 0.1,
          duration: 1.2,
          ease: 'power2.out'
        });
      }

      // Parallax for blobs but in inverse direction
      blobsRef.current.forEach((blob, i) => {
        gsap.to(blob, {
          x: -xPos * (i + 1) * 0.5,
          y: -yPos * (i + 1) * 0.5,
          duration: 1.5,
          ease: 'power1.out'
        });
      });
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
      console.error("Login Error:", err);
      const message = err instanceof Error ? err.message : 'Network error';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-sans">

      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div
          ref={el => { if (el) blobsRef.current[0] = el }}
          className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] bg-sky-500/20 rounded-full blur-[120px]"
        />
        <div
          ref={el => { if (el) blobsRef.current[1] = el }}
          className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] bg-blue-500/20 rounded-full blur-[100px]"
        />
        <div
          ref={el => { if (el) blobsRef.current[2] = el }}
          className="absolute top-[40%] right-[30%] w-[20vw] h-[20vw] bg-indigo-500/10 rounded-full blur-[80px]"
        />
      </div>

      {/* Characters Decor */}
      <div ref={charLeftRef} className="absolute left-[5%] bottom-[10%] z-20 hidden xl:block w-[350px] pointer-events-none">
        <Image
          src="/assets/student_boy.png"
          alt="Student Boy"
          width={500}
          height={700}
          className="object-contain drop-shadow-[0_20px_50px_rgba(14,165,233,0.3)] filter brightness-110 contrast-105"
        />
      </div>
      <div ref={charRightRef} className="absolute right-[5%] bottom-[10%] z-20 hidden xl:block w-[350px] pointer-events-none">
        <Image
          src="/assets/student_girl.png"
          alt="Student Girl"
          width={500}
          height={700}
          className="object-contain drop-shadow-[0_20px_50px_rgba(14,165,233,0.3)] filter brightness-110 contrast-105"
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

      <div className="z-30 w-full max-w-lg p-6">
        <div ref={cardRef} className="relative">
          {/* Glass Card */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden">

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-10">
              <div ref={logoRef} className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-sky-500/20">
                <School className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">SchoolApp</h1>
              <p className="text-sky-200/50 font-medium tracking-wide">Elevating Education Through Technology</p>
            </div>

            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-sm mb-8 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="login-field">
                <label className="block text-xs font-bold text-sky-200/40 uppercase tracking-[3px] mb-3 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-200/30 group-focus-within:text-sky-400 transition-colors" size={20} />
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full bg-white/[0.03] border border-white/5 focus:border-sky-500/50 focus:bg-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/10 outline-none transition-all duration-300"
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && <p className="text-red-400 text-xs mt-2 ml-1">{errors.username.message}</p>}
              </div>

              <div className="login-field">
                <label className="block text-xs font-bold text-sky-200/40 uppercase tracking-[3px] mb-3 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-200/30 group-focus-within:text-sky-400 transition-colors" size={20} />
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-white/[0.03] border border-white/5 focus:border-sky-500/50 focus:bg-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/10 outline-none transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-2 ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full login-field group relative flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(14,165,233,0.3)] hover:shadow-sky-500/50 disabled:opacity-50 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center login-field">
              <span className="text-xs text-white/10 font-bold tracking-[2px]">
                POWERED BY <span className="text-sky-400/30">TITAN SECURE</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
