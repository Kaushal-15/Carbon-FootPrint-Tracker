'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Flame, Award, Trophy, CheckCircle, 
  Plus, Sparkles, User, Calendar, Loader2 
} from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  pointsReward: number;
  category: string;
  isJoined: boolean;
  status: 'NOT_JOINED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  completedAt?: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  points: number;
  streak: number;
  createdAt: string;
  badges: Array<{ badge: Badge; unlockedAt: string }>;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load user profile details
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const json = await res.json();
        setProfile(json.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load eco challenges
  const fetchChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const res = await fetch('/api/challenges');
      if (res.ok) {
        const json = await res.json();
        setChallenges(json.challenges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Opt-in to a challenge
  const joinChallenge = async (challengeId: string) => {
    setActionLoadingId(challengeId);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        // Refresh challenges and profile
        await fetchChallenges();
        await fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      fetchChallenges();
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

  // Predefined badges to show locked ones
  const ALL_SYSTEM_BADGES = [
    { name: 'First Step', description: 'Log your first carbon footprint entry.', icon: '🌱' },
    { name: 'Eco Warrior', description: 'Log footprint entries for 7 consecutive days.', icon: '🔥' },
    { name: 'Green Commuter', description: 'Log transport with green modes (bike, walk, train, or bus) for a week.', icon: '🚲' },
    { name: 'Conscious Consumer', description: 'Log food category as Vegan or Vegetarian for 5 entries.', icon: '🥗' },
    { name: 'Zero Waste Champion', description: 'Log waste with active recycling and low volume.', icon: '♻️' },
    { name: 'Carbon Cutter', description: 'Reduce your weekly carbon footprint by 10% compared to average.', icon: '📉' },
  ];

  const unlockedMap = new Map(
    profile?.badges.map((ub) => [ub.badge.name, ub.unlockedAt])
  );

  // Dynamic user level calculation: e.g. Level 1 starts at 0, Level 2 at 100, Level 3 at 200...
  const points = profile?.points ?? 0;
  const userLevel = Math.floor(points / 150) + 1;
  const pointsNeededForNextLevel = 150 - (points % 150);
  const levelProgressPercent = ((points % 150) / 150) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {loadingProfile ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : profile && (
          <div className="space-y-8">
            
            {/* User Profile Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-5%] h-80 w-80 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/10">
                    {profile.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                    </div>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400 uppercase tracking-wider">Level {userLevel} Tracker</span>
                    <span className="text-emerald-400">{points % 150} / 150 XP</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${levelProgressPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    {pointsNeededForNextLevel} XP needed for Level {userLevel + 1}
                  </p>
                </div>
              </div>

              {/* Main stats counters */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-800/80 mt-6 pt-6 text-center">
                <div>
                  <span className="block text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Score</span>
                  <span className="text-xl sm:text-3xl font-black text-amber-400 mt-1 block flex items-center justify-center gap-1">
                    <Sparkles className="h-5 w-5 fill-amber-400/20 inline" />
                    {profile.points}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Daily Streak</span>
                  <span className="text-xl sm:text-3xl font-black text-orange-400 mt-1 block flex items-center justify-center gap-1">
                    <Flame className="h-5 w-5 fill-orange-400/20 inline" />
                    {profile.streak} <span className="text-xs sm:text-sm font-normal text-slate-400">days</span>
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Badges Unlocked</span>
                  <span className="text-xl sm:text-3xl font-black text-emerald-400 mt-1 block flex items-center justify-center gap-1">
                    <Trophy className="h-5 w-5 fill-emerald-400/20 inline" />
                    {profile.badges.length} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {ALL_SYSTEM_BADGES.length}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Badges Grid (Left/Center 2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-400" />
                    <span>Your Achievements</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Unlock badges by logging your habits and cutting emissions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ALL_SYSTEM_BADGES.map((b) => {
                    const unlockTime = unlockedMap.get(b.name);
                    const isUnlocked = !!unlockTime;
                    return (
                      <div 
                        key={b.name} 
                        className={`rounded-xl border p-4 flex gap-4 transition duration-200 ${
                          isUnlocked 
                            ? 'bg-slate-900/30 border-slate-800 shadow-lg' 
                            : 'bg-slate-950/20 border-slate-900/40 opacity-40'
                        }`}
                      >
                        <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shrink-0">
                          {b.icon}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{b.name}</span>
                            {isUnlocked && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                          </h3>
                          <p className="text-xs text-slate-400 leading-normal">{b.description}</p>
                          {isUnlocked && unlockTime && (
                            <span className="block text-[10px] text-slate-500 font-medium">
                              Unlocked {new Date(unlockTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Eco Challenges List (Right 1/3 width) */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-cyan-400" />
                    <span>Eco Challenges</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Opt in and complete challenges to earn massive points.</p>
                </div>

                {loadingChallenges ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {challenges.map((c) => (
                      <div 
                        key={c.id} 
                        className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 space-y-4 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="inline-block text-[9px] font-bold bg-slate-950 border border-slate-800 text-cyan-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {c.category}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1.5">{c.title}</h3>
                          </div>
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                            <Sparkles className="h-3.5 w-3.5 fill-amber-400/20" />
                            +{c.pointsReward}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-normal">{c.description}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Duration: {c.durationDays} Days</span>
                          {c.status === 'ACTIVE' && <span className="text-cyan-400 font-bold">ACTIVE PROGRESS</span>}
                          {c.status === 'COMPLETED' && <span className="text-emerald-400 font-bold">COMPLETED</span>}
                        </div>

                        {c.status === 'NOT_JOINED' && (
                          <button
                            onClick={() => joinChallenge(c.id)}
                            disabled={actionLoadingId !== null}
                            className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
                          >
                            {actionLoadingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Join Challenge</span>
                              </>
                            )}
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <div className="w-full text-center py-2 text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                            Tracking in logs...
                          </div>
                        )}
                        {c.status === 'COMPLETED' && (
                          <div className="w-full text-center py-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Challenge Completed!</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
