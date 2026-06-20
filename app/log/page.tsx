'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Car, Flame, Soup, Trash2, ArrowRight, ArrowLeft, 
  CheckCircle, Loader2, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';

const TRANSPORT_MODES = [
  { value: 'WALK', label: '🚶 Walk' },
  { value: 'BIKE', label: '🚲 Cycle' },
  { value: 'BUS', label: '🚌 Bus' },
  { value: 'TRAIN', label: '🚆 Train' },
  { value: 'CAR', label: '🚗 Petrol/Diesel Car' },
  { value: 'FLIGHT', label: '✈️ Airplane Flight' },
];

const HEATING_SOURCES = [
  { value: 'NONE', label: '❌ No Heating' },
  { value: 'ELECTRIC', label: '⚡ Electric Heat' },
  { value: 'GAS', label: '🔥 Natural Gas' },
  { value: 'OIL', label: '🛢️ Heating Oil' },
];

const DIET_TYPES = [
  { value: 'VEGAN', label: '🥗 Vegan (100% Plant-based)' },
  { value: 'VEGETARIAN', label: '🥚 Vegetarian (No meat, dairy/eggs okay)' },
  { value: 'PESCATARIAN', label: '🐟 Pescatarian (Plants + Seafood)' },
  { value: 'MEAT_MEDIUM', label: '🍗 Moderate Meat-Eater (Chicken/Pork)' },
  { value: 'MEAT_HEAVY', label: '🥩 Heavy Meat-Eater (Beef/Lamb frequent)' },
];

const WASTE_VOLUMES = [
  { value: 'LOW', label: '🗑️ Low (Less than half a standard bag/day)' },
  { value: 'MEDIUM', label: '🗑️🗑️ Medium (Around one full bag/day)' },
  { value: 'HIGH', label: '🗑️🗑️🗑️ High (Multiple bags/day)' },
];

export default function LogFootprint() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'transport' | 'energy' | 'food' | 'waste'>('transport');
  
  // Form values
  const [form, setForm] = useState({
    timestamp: new Date().toISOString().split('T')[0],
    transportMode: 'WALK',
    transportDistance: 0,
    electricityUsage: 0,
    heatingSource: 'NONE',
    heatingUsage: 0,
    foodDietType: 'VEGAN',
    wasteVolume: 'LOW',
    wasteRecycled: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

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

  const handleInputChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessData(null);

    // Format final payload
    const payload = {
      timestamp: new Date(form.timestamp).toISOString(),
      transportMode: form.transportMode,
      transportDistance: Number(form.transportDistance),
      electricityUsage: Number(form.electricityUsage),
      heatingSource: form.heatingSource,
      heatingUsage: Number(form.heatingUsage),
      foodDietType: form.foodDietType,
      wasteVolume: form.wasteVolume,
      wasteRecycled: form.wasteRecycled,
    };

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit entry');
      }

      setSuccessData(data);
      // Reset form defaults
      setForm({
        timestamp: new Date().toISOString().split('T')[0],
        transportMode: 'WALK',
        transportDistance: 0,
        electricityUsage: 0,
        heatingSource: 'NONE',
        heatingUsage: 0,
        foodDietType: 'VEGAN',
        wasteVolume: 'LOW',
        wasteRecycled: false,
      });
      setActiveTab('transport');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />
      
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Log Daily Activity
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Record your resource consumption across categories to calculate your environmental footprint.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successData ? (
          /* SUCCESS LOGGED SCREEN */
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-8 backdrop-blur-md shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Daily Log Submitted!</h2>
              <p className="text-slate-400 text-sm">
                Your activities have been processed and added to your carbon profile.
              </p>
            </div>

            {/* Calculations Card */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider">Carbon Footprint</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">
                  {successData.entry?.co2Emission} <span className="text-xs font-normal text-slate-400">kg CO2e</span>
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider">Points Earned</span>
                <span className="text-3xl font-black text-amber-400 mt-1 block flex items-center justify-center gap-1">
                  <Sparkles className="h-5 w-5 fill-amber-400/20 text-amber-400 inline" />
                  +{successData.gamification?.pointsEarned}
                </span>
              </div>
            </div>

            {/* Streaks & Badges */}
            {(successData.gamification?.newBadges?.length > 0 || successData.gamification?.completedChallenges?.length > 0) && (
              <div className="border-t border-slate-800 pt-6 max-w-md mx-auto space-y-4">
                {successData.gamification.newBadges.map((badgeName: string) => (
                  <div 
                    key={badgeName}
                    className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-3 text-left"
                  >
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">Badge Unlocked: {badgeName}</h4>
                      <p className="text-xs text-amber-400/80">You gained +50 bonus points for this achievement!</p>
                    </div>
                  </div>
                ))}
                
                {successData.gamification.completedChallenges.map((challengeTitle: string) => (
                  <div 
                    key={challengeTitle}
                    className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3 text-left"
                  >
                    <span className="text-2xl">✨</span>
                    <div>
                      <h4 className="text-sm font-bold text-cyan-300">Challenge Completed: {challengeTitle}</h4>
                      <p className="text-xs text-cyan-400/80">Points rewarded directly to your profile score.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSuccessData(null)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg mx-auto transition duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Log another day</span>
            </button>
          </div>
        ) : (
          /* FORM WIZARD */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Date Picker */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label htmlFor="log-date" className="text-sm font-bold text-slate-300">
                Logging Date:
              </label>
              <input
                type="date"
                id="log-date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={form.timestamp}
                onChange={(e) => handleInputChange('timestamp', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Category tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/20 rounded-xl p-1 gap-1" role="tablist">
              {[
                { id: 'transport', label: 'Transport', icon: Car },
                { id: 'energy', label: 'Energy', icon: Flame },
                { id: 'food', label: 'Food', icon: Soup },
                { id: 'waste', label: 'Waste', icon: Trash2 },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-md' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab panels */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 min-h-[250px]">
              
              {/* Transport Category */}
              {activeTab === 'transport' && (
                <div id="transport-panel" role="tabpanel" className="space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">🚗 Transportation</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="transport-mode" className="text-sm font-semibold text-slate-300">
                        Primary Mode of Transport
                      </label>
                      <select
                        id="transport-mode"
                        value={form.transportMode}
                        onChange={(e) => handleInputChange('transportMode', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        {TRANSPORT_MODES.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {form.transportMode !== 'WALK' && form.transportMode !== 'BIKE' && (
                      <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                        <label htmlFor="transport-distance" className="text-sm font-semibold text-slate-300">
                          Distance Traveled (in Kilometers)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="transport-distance"
                            min="0"
                            max="40000"
                            value={form.transportDistance}
                            onChange={(e) => handleInputChange('transportDistance', Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute right-4 top-2.5 text-sm font-semibold text-slate-500">km</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Estimate the total distance traveled using this mode for the logged day.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Energy Category */}
              {activeTab === 'energy' && (
                <div id="energy-panel" role="tabpanel" className="space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">🔥 Home Energy Consumption</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="electricity-usage" className="text-sm font-semibold text-slate-300">
                        Electricity Usage (kWh)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="electricity-usage"
                          min="0"
                          max="1000"
                          value={form.electricityUsage}
                          onChange={(e) => handleInputChange('electricityUsage', Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-14 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-4 top-2.5 text-sm font-semibold text-slate-500">kWh</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Average daily household electricity is ~30 kWh in the US, ~10 kWh in Europe.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="heating-source" className="text-sm font-semibold text-slate-300">
                          Heating Energy Source
                        </label>
                        <select
                          id="heating-source"
                          value={form.heatingSource}
                          onChange={(e) => handleInputChange('heatingSource', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                        >
                          {HEATING_SOURCES.map((h) => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                          ))}
                        </select>
                      </div>

                      {form.heatingSource !== 'NONE' && (
                        <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                          <label htmlFor="heating-usage" className="text-sm font-semibold text-slate-300">
                            Heating Usage (kWh)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="heating-usage"
                              min="0"
                              max="1000"
                              value={form.heatingUsage}
                              onChange={(e) => handleInputChange('heatingUsage', Math.max(0, Number(e.target.value)))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-14 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="absolute right-4 top-2.5 text-sm font-semibold text-slate-500">kWh</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Food Category */}
              {activeTab === 'food' && (
                <div id="food-panel" role="tabpanel" className="space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">🥗 Dietary Pattern</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="food-diet" className="text-sm font-semibold text-slate-300">
                        Choose the option that matches your diet today
                      </label>
                      <select
                        id="food-diet"
                        value={form.foodDietType}
                        onChange={(e) => handleInputChange('foodDietType', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        {DIET_TYPES.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Diet is a high contributor to personal carbon footprint. Vegan diets release ~1.5kg CO2e/day, while heavy meat eaters release ~7.5kg CO2e/day.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Waste Category */}
              {activeTab === 'waste' && (
                <div id="waste-panel" role="tabpanel" className="space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">♻️ Waste & Recycling</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="waste-volume" className="text-sm font-semibold text-slate-300">
                        Waste Produced Today (Volume)
                      </label>
                      <select
                        id="waste-volume"
                        value={form.wasteVolume}
                        onChange={(e) => handleInputChange('wasteVolume', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        {WASTE_VOLUMES.map((w) => (
                          <option key={w.value} value={w.value}>{w.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
                      <input
                        type="checkbox"
                        id="waste-recycled"
                        checked={form.wasteRecycled}
                        onChange={(e) => handleInputChange('wasteRecycled', e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-500 focus:ring-offset-slate-900"
                      />
                      <div className="flex flex-col">
                        <label htmlFor="waste-recycled" className="text-sm font-bold text-slate-300 cursor-pointer">
                          I recycled my recyclable waste (paper, plastic, glass, tins)
                        </label>
                        <span className="text-xs text-slate-500 mt-0.5">
                          Active recycling offsets landfill emissions by up to 50%.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center bg-slate-900/10 border border-slate-800/40 p-4 rounded-xl">
              <div>
                {activeTab !== 'transport' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'waste') setActiveTab('food');
                      else if (activeTab === 'food') setActiveTab('energy');
                      else if (activeTab === 'energy') setActiveTab('transport');
                    }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>
              
              <div>
                {activeTab !== 'waste' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'transport') setActiveTab('energy');
                      else if (activeTab === 'energy') setActiveTab('food');
                      else if (activeTab === 'food') setActiveTab('waste');
                    }}
                    className="flex items-center gap-1.5 text-sm font-bold bg-slate-800 text-slate-100 hover:bg-slate-700 px-4 py-2 rounded-lg transition"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Log</span>
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
