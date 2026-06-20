'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Leaf, BarChart3, PenTool, Award, LogOut, Flame, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<{ points: number; streak: number } | null>(null);

  useEffect(() => {
    if (session) {
      fetch('/api/user/profile')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to load profile');
        })
        .then((data) => {
          if (data.user) {
            setStats({
              points: data.user.points,
              streak: data.user.streak,
            });
          }
        })
        .catch((err) => console.error('Error fetching navbar stats:', err));
    }
  }, [session, pathname]);

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-md px-1"
              aria-label="EcoTrace Home"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                EcoTrace
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User info and Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div 
              className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300"
              title="Your Current Score"
            >
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="h-3.5 w-3.5 fill-amber-400/20" />
                <span>Points: </span>
                <span className="text-slate-100 font-bold" id="nav-points">
                  {stats !== null ? stats.points : '--'}
                </span>
              </span>
              <span className="h-3 w-px bg-slate-800" />
              <span className="flex items-center gap-1 text-orange-400" title="Daily Streak">
                <Flame className="h-3.5 w-3.5 fill-orange-400/20 animate-pulse" />
                <span>Streak: </span>
                <span className="text-slate-100 font-bold" id="nav-streak">
                  {stats !== null ? stats.streak : '--'}
                </span>
              </span>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
              aria-label="Log Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 px-2 pb-3 pt-2 space-y-1" id="mobile-menu">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          <div className="border-t border-slate-900 my-2 pt-2 flex flex-col gap-2 px-3">
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-slate-400">Total Points</span>
              <span className="text-amber-400 font-semibold" id="mobile-nav-points">
                {stats !== null ? stats.points : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-slate-400">Streak</span>
              <span className="text-orange-400 font-semibold" id="mobile-nav-streak">
                {stats !== null ? stats.streak : '--'}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center justify-center gap-2 px-3 py-2.5 mt-2 text-sm font-medium text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Log Footprint', href: '/log', icon: PenTool },
  { name: 'Progress & Badges', href: '/profile', icon: Award },
];
