'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Leaf, BarChart3, PenTool, Award, BrainCircuit, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

/**
 * The main landing page (Home) component for EcoTrace.
 * Displays the hero section, core features (pillars), and call-to-actions based on session state.
 *
 * @returns {JSX.Element} The rendered landing page.
 */
export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background radial glows for visual premium feel */}
      <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full border-b border-slate-900/80 relative z-10 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight">
            EcoTrace
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <Link 
              href="/dashboard" 
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg px-2 py-1"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-sm font-semibold text-slate-300 hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg px-2.5 py-1"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-100 hover:bg-slate-800 px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center max-w-4xl mx-auto space-y-8 relative z-10">
        

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white max-w-3xl">
          Empower Your Daily Flight Against{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Climate Change
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          EcoTrace is a comprehensive carbon intelligence tool that helps you understand your emissions, track footprints through daily logging, and reduce your impact with custom AI suggestions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 font-bold transition active:scale-[0.98]"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 font-bold transition active:scale-[0.98]"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 px-6 py-3.5 font-bold transition"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left max-w-5xl">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Understand</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-normal">
              Visualize your resource consumption in real-time. Compare your daily emissions against regional and global climate targets to make informed choices.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <PenTool className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Track</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-normal">
              Keep a detailed log of transport distances, electricity usage, diets, and recycling habits. Track trends and logs securely over days, weeks, and months.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Reduce</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-normal">
              Action plan powered by Groq Llama-3 AI offering specific, non-generic sustainability recommendations. Unlock points, streaks, badges, and take on eco-challenges.
            </p>
          </div>
        </section>

        {/* Security / Quality badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-900/80 pt-10 w-full text-slate-500 text-xs font-semibold">
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500/80" />
            <span>BCrypt Password Hash</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500/80" />
            <span>Zod Input Validator</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Zap className="h-4.5 w-4.5 text-emerald-500/80" />
            <span>Vitest Test Covered</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500/80" />
            <span>CSRF & Rate-limited</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 relative z-10">
        <p>&copy; {new Date().getFullYear()} EcoTrace Carbon Footprint Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
