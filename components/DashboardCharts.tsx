'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface RecentEntry {
  date: string;
  CO2: number;
  Transport: number;
  Energy: number;
  Food: number;
  Waste: number;
}

interface CategoryTotals {
  transport: number;
  energy: number;
  food: number;
  waste: number;
}

interface DashboardChartsProps {
  recentEntries: RecentEntry[];
  categoryTotals: CategoryTotals;
}

const CATEGORY_COLORS = {
  Transport: '#10b981', // emerald-500
  Energy: '#f59e0b',    // amber-500
  Food: '#06b6d4',      // cyan-500
  Waste: '#ec4899',     // pink-500
};

export default function DashboardCharts({ recentEntries, categoryTotals }: DashboardChartsProps) {
  // Format data for Pie Chart
  const pieData = [
    { name: 'Transport', value: categoryTotals.transport },
    { name: 'Energy', value: categoryTotals.energy },
    { name: 'Food', value: categoryTotals.food },
    { name: 'Waste', value: categoryTotals.waste },
  ].filter((item) => item.value > 0);

  const totalCO2 = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trend Area Chart (2/3 width on desktop) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Carbon Footprint Over Time</h3>
          <p className="text-xs text-slate-400">Emission breakdowns for your last logged days (in kg CO2e)</p>
        </div>
        
        <div className="h-72 w-full" role="img" aria-label="Area chart showing daily CO2 emission trends by category">
          {recentEntries.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data to display</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={recentEntries}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTransport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_COLORS.Transport} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CATEGORY_COLORS.Transport} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_COLORS.Energy} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CATEGORY_COLORS.Energy} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_COLORS.Food} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CATEGORY_COLORS.Food} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_COLORS.Waste} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CATEGORY_COLORS.Waste} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="Transport"
                  stackId="1"
                  stroke={CATEGORY_COLORS.Transport}
                  fillOpacity={1}
                  fill="url(#colorTransport)"
                />
                <Area
                  type="monotone"
                  dataKey="Energy"
                  stackId="1"
                  stroke={CATEGORY_COLORS.Energy}
                  fillOpacity={1}
                  fill="url(#colorEnergy)"
                />
                <Area
                  type="monotone"
                  dataKey="Food"
                  stackId="1"
                  stroke={CATEGORY_COLORS.Food}
                  fillOpacity={1}
                  fill="url(#colorFood)"
                />
                <Area
                  type="monotone"
                  dataKey="Waste"
                  stackId="1"
                  stroke={CATEGORY_COLORS.Waste}
                  fillOpacity={1}
                  fill="url(#colorWaste)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Distribution Pie Chart (1/3 width on desktop) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Emission Distribution</h3>
          <p className="text-xs text-slate-400">Total proportion of emissions per category</p>
        </div>

        <div className="h-60 w-full relative flex items-center justify-center" role="img" aria-label="Pie chart showing emissions distribution by category">
          {pieData.length === 0 ? (
            <div className="text-slate-500 text-sm">No data logged yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} kg CO2e`, 'Emissions']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner text overlay */}
              <div className="absolute text-center">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total CO2</span>
                <span className="text-xl font-black text-white">{totalCO2.toFixed(1)} <span className="text-xs font-normal">kg</span></span>
              </div>
            </>
          )}
        </div>

        {/* Legend listing percentages */}
        <div className="mt-4 space-y-2">
          {pieData.map((item) => {
            const percentage = totalCO2 > 0 ? (item.value / totalCO2) * 100 : 0;
            const color = CATEGORY_COLORS[item.name as keyof typeof CATEGORY_COLORS];
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-slate-400 font-bold">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
