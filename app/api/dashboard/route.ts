import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateTransport, calculateEnergy, calculateFood, calculateWaste } from '@/lib/carbonCalculator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch all footprint entries sorted chronologically
    const entries = await prisma.footprintEntry.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    if (entries.length === 0) {
      return NextResponse.json({
        hasData: false,
        recentEntries: [],
        categoryTotals: { transport: 0, energy: 0, food: 0, waste: 0 },
        userDailyAverage: 0,
        biggestContributor: { category: 'None', value: 0, percentage: 0 },
      }, { status: 200 });
    }

    // 2. Calculate category breakdowns
    let transportTotal = 0;
    let energyTotal = 0;
    let foodTotal = 0;
    let wasteTotal = 0;
    let grandTotal = 0;

    entries.forEach((e) => {
      const t = calculateTransport(e.transportMode, e.transportDistance);
      const en = calculateEnergy(e.electricityUsage, e.heatingSource, e.heatingUsage);
      const f = calculateFood(e.foodDietType);
      const w = calculateWaste(e.wasteVolume, e.wasteRecycled);

      transportTotal += t;
      energyTotal += en;
      foodTotal += f;
      wasteTotal += w;
      grandTotal += e.co2Emission;
    });

    // 3. User Daily Average
    const userDailyAverage = grandTotal / entries.length;

    // 4. Highlight the biggest contributor (based on all-time or last 30 entries)
    const categoryValues = [
      { name: 'Transport', value: transportTotal },
      { name: 'Energy', value: energyTotal },
      { name: 'Food', value: foodTotal },
      { name: 'Waste', value: wasteTotal },
    ];

    categoryValues.sort((a, b) => b.value - a.value);
    const biggest = categoryValues[0];
    const biggestPercentage = grandTotal > 0 ? (biggest.value / grandTotal) * 100 : 0;

    // Format recent entries for charts (limiting to last 15 for readable visual trend)
    const chartEntries = entries.slice(-15).map((e) => ({
      date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      CO2: e.co2Emission,
      Transport: calculateTransport(e.transportMode, e.transportDistance),
      Energy: calculateEnergy(e.electricityUsage, e.heatingSource, e.heatingUsage),
      Food: calculateFood(e.foodDietType),
      Waste: calculateWaste(e.wasteVolume, e.wasteRecycled),
    }));

    return NextResponse.json({
      hasData: true,
      recentEntries: chartEntries,
      categoryTotals: {
        transport: Number(transportTotal.toFixed(2)),
        energy: Number(energyTotal.toFixed(2)),
        food: Number(foodTotal.toFixed(2)),
        waste: Number(wasteTotal.toFixed(2)),
      },
      userDailyAverage: Number(userDailyAverage.toFixed(2)),
      biggestContributor: {
        category: biggest.name,
        value: Number(biggest.value.toFixed(2)),
        percentage: Number(biggestPercentage.toFixed(1)),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
