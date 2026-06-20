'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  TrendingDown, Globe, Flame, AlertTriangle, 
  Sparkles, PenTool, BrainCircuit, RefreshCw, Loader2 
} from 'lucide-react';

// Lazy-load Recharts component to optimize client JS bundle size and bypass hydration issues
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-slate-900/20 border border-slate-800 rounded-2xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  ),
});

/**
 * Represents a single daily aggregated carbon footprint entry in the dashboard.
 * Used for the area chart rendering.
 */
interface CarbonEntry {
  date: string;
  CO2: number;
  Transport: number;
  Energy: number;
  Food: number;
  Waste: number;
}

/**
 * Interface for the aggregated dashboard data.
 */
interface DashboardData {
  hasData: boolean;
  recentEntries: CarbonEntry[];
  categoryTotals: {
    transport: number;
    energy: number;
    food: number;
    waste: number;
  };
  userDailyAverage: number;
  biggestContributor: {
    category: string;
    value: number;
    percentage: number;
  };
}

/**
 * The main Dashboard component where users can view their footprint stats,
 * charts, and AI-generated recommendations.
 *
 * @returns {JSX.Element | null} The rendered dashboard or null if redirecting.
 */
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Dashboard & Insights states
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch Dashboard Stats
  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch AI Insights from Groq
  const fetchAIInsights = async (forceRefresh = false) => {
    try {
      setLoadingInsights(true);
      const url = forceRefresh ? '/api/insights?refresh=true' : '/api/insights';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setInsights(json.recommendations || '');
      } else {
        const json = await res.json();
        setInsights(json.recommendations || 'Failed to generate custom recommendations. Please try again.');
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setInsights('Could not connect to the recommendations service. Check your internet connection.');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
      fetchAIInsights();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Reference figures
  const US_DAILY_AVG = 44.0; // 44 kg CO2e/day (approx 16 tonnes/year)
  const GLOBAL_DAILY_AVG = 13.0; // 13 kg CO2e/day (approx 4.7 tonnes/year)

  const hasEntries = data && data.hasData;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{session?.user?.name || 'Eco Tracer'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here is your environmental impact overview and AI action plan.
            </p>
          </div>
          
          <Link
            href="/log"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
            id="quick-log-btn"
          >
            <PenTool className="h-4.5 w-4.5" />
            <span>Log Today&apos;s Footprint</span>
          </Link>
        </div>

        {loadingData ? (
          /* SKELETON LOADER */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl border border-slate-900 bg-slate-900/20 animate-pulse" />
              ))}
            </div>
            <div className="h-80 rounded-2xl border border-slate-900 bg-slate-900/20 animate-pulse" />
          </div>
        ) : !hasEntries ? (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center max-w-xl mx-auto space-y-6 backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">No Footprint Data Yet</h2>
              <p className="text-slate-400 text-sm">
                Log your first activities to calculate your carbon emission rates and generate custom AI reports.
              </p>
            </div>
            <Link
              href="/log"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 text-sm font-bold transition"
            >
              <PenTool className="h-4 w-4" />
              <span>Get Started</span>
            </Link>
          </div>
        ) : (
          /* DASHBOARD PRESENTATION */
          <div className="space-y-8">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Average Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Daily Average</span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {data.userDailyAverage} <span className="text-xs font-normal text-slate-400">kg CO2e</span>
                  </span>
                  <span className="text-xs text-slate-400 mt-2 block flex items-center gap-1">
                    {data.userDailyAverage < US_DAILY_AVG ? (
                      <span className="text-emerald-400 font-bold">✓ {(100 - (data.userDailyAverage / US_DAILY_AVG) * 100).toFixed(0)}% lower</span>
                    ) : (
                      <span className="text-red-400 font-bold">⚠️ {( (data.userDailyAverage / US_DAILY_AVG) * 100 - 100).toFixed(0)}% higher</span>
                    )}
                    <span>than US average ({US_DAILY_AVG} kg)</span>
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>

              {/* Global Benchmark comparison Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Target Ratio</span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {(data.userDailyAverage / GLOBAL_DAILY_AVG).toFixed(1)}x
                  </span>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Compared to global average benchmark of {GLOBAL_DAILY_AVG} kg/day
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Globe className="h-6 w-6" />
                </div>
              </div>

              {/* Biggest Contributor Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Carbon Driver</span>
                  <span className="text-3xl font-black text-amber-400 mt-1 block">
                    {data.biggestContributor.category}
                  </span>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Accounting for <span className="font-bold text-slate-200">{data.biggestContributor.percentage}%</span> of your emissions
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Recharts Data Visualization Component */}
            <DashboardCharts 
              recentEntries={data.recentEntries} 
              categoryTotals={data.categoryTotals} 
            />

            {/* AI Insights & Recommendations (Groq API Panel) */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">AI-Personalized Insights</h2>
                    <p className="text-xs text-slate-400">Tailored recommendations powered by Groq Llama-3</p>
                  </div>
                </div>
                
                <button
                  onClick={() => fetchAIInsights(true)}
                  disabled={loadingInsights}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-white transition disabled:opacity-50"
                  aria-label="Refresh AI insights"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                  <span>Refresh Advice</span>
                </button>
              </div>

              {loadingInsights ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  <p className="text-xs text-slate-500 font-semibold animate-pulse">Groq Llama-3 analyzing carbon entries...</p>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-slate-300 space-y-4">
                  {insights ? (
                    // Convert line breaks to paragraphs or lists
                    insights.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                        return (
                          <li key={idx} className="list-disc ml-5 pl-1 py-0.5 text-slate-300">
                            {line.trim().substring(1).trim()}
                          </li>
                        );
                      }
                      return <p key={idx}>{line}</p>;
                    })
                  ) : (
                    <p className="text-slate-500 italic text-center">No recommendations loaded.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
