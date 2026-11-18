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
      const { signIn, getSession } = await import('next-auth/react');
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
        // Fetch session to determine role and route accordingly
        const session = await getSession();
        const role = (session?.user as any)?.role;

        if (role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else if (role === 'LECTURER') {
          router.replace('/lecturer/dashboard');
        } else {
          router.replace('/student/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[85vh] flex flex-col justify-between px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden bg-stone-900 text-stone-100">
      
      {/* Background Image Overlay */}
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

      {/* Top Navigation Bar */}
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
            <h2 className="text-xs sm:text-sm font-bold text-white leading-tight">ABUAD</h2>
            <p className="text-[10px] sm:text-[11px] text-stone-300">Unified Portal</p>
          </div>
        </Link>

        <div>
          <Link 
            href="/" 
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 backdrop-blur-sm whitespace-nowrap"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto bg-stone-950/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Portal Login</h1>
          <p className="text-xs text-stone-300 mt-1">Sign in with your institutional credentials</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-xs text-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Email Address</label>
            <input 
              type="email"
              required
              suppressHydrationWarning
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@abuad.edu.ng"
              className="w-full px-3.5 py-2.5 bg-stone-900/40 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:bg-stone-900/60 transition"
            />
          </div>

       <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                suppressHydrationWarning
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-3.5 pr-11 py-2.5 bg-stone-900/40 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:bg-stone-900/60 transition"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-stone-200/80 hover:bg-white text-stone-900 transition cursor-pointer p-1.5 rounded-lg shadow-sm"
              >
                {showPassword ? (
                  /* Eye-Off Icon (Hide Password) */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  /* Eye Icon (Show Password) */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#800020] hover:bg-[#650019] text-white font-semibold rounded-xl text-sm transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Action Links Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-stone-300 pt-3 border-t border-white/10">
          <Link href="/forgot-password" className="text-stone-300 hover:text-white transition underline underline-offset-2">
            Forgot password?
          </Link>
          <div className="text-right">
            <span className="text-stone-400">Don't have an account? </span>
            <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium transition underline underline-offset-2">
              Register as Student
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}