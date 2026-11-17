// src/app/login/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Dynamic import prevents NextAuth from evaluating URLs during build prerendering
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      const resError = (result as { error?: string } | null)?.error;
      if (resError) {
        setError('Invalid email or password.');
        setIsLoading(false);
      } else {
        router.replace('/student/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[85vh] flex flex-col justify-between px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden bg-stone-900 text-stone-100">
      
      {/* 1. Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/ABUAD%20ATTENDANCE.jpg" 
          alt="ABUAD Gate Background"
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[#590018]/40 backdrop-blur-[1px]" />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-6 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/20 bg-white shadow-sm shrink-0">
            <Image 
              src="/ABUAD%20LOGO.jpg" 
              alt="ABUAD Logo"
              fill
              sizes="(max-width: 768px) 32px, 40px"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white leading-tight group-hover:text-stone-200 transition">ABUAD</h2>
            <p className="text-[10px] sm:text-[11px] text-stone-300">Student Portal</p>
          </div>
        </Link>

        <div>
          <Link 
            href="/" 
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 backdrop-blur-sm whitespace-nowrap"
          >
            ← Back Home
          </Link>
        </div>
      </header>

      {/* 3. Central Login Form Card */}
      <section className="relative z-10 flex flex-col items-center justify-center my-auto py-6 px-3 sm:px-4 w-full">
        <div 
          className="w-full max-w-md bg-black/50 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/15"
          suppressHydrationWarning
        >
          <div className="text-center mb-5 sm:mb-6">
            <span className="inline-block p-2.5 sm:p-3 rounded-full bg-white/10 border border-white/20 text-xl sm:text-2xl mb-2">
              🎓
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
              Student Sign In
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-300 mt-1">
              College of Medicine & Health Sciences
            </p>
          </div>

          {/* Dynamic Error Alert Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-200 mb-1">
                Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@abuad.edu.ng"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] text-stone-900 text-sm bg-white/95"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-14 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] text-stone-900 text-sm bg-white/95"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-xs font-semibold text-[#8B1E3F] hover:text-[#5A0B1B] cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <Link href="/forgot-password" className="text-stone-300 hover:text-white underline font-medium">
                Forgot password?
              </Link>
              <Link href="/signup" className="text-stone-200 hover:text-white font-bold underline">
                Don't have an account? Sign up
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#5A0B1B] hover:bg-[#7A1226] text-white font-bold text-xs tracking-wider uppercase rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 border border-red-500/30 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}