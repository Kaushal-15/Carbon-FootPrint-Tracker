import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateTotalEntryEmission } from '@/lib/carbonCalculator';
import { processGamification } from '@/lib/gamification';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const entrySchema = z.object({
  timestamp: z.string().pipe(z.coerce.date()),
  transportMode: z.string().nullable().optional(),
  transportDistance: z.number().nonnegative().nullable().optional(),
  electricityUsage: z.number().nonnegative().nullable().optional(),
  heatingSource: z.string().nullable().optional(),
  heatingUsage: z.number().nonnegative().nullable().optional(),
  foodDietType: z.string().nullable().optional(),
  wasteVolume: z.string().nullable().optional(),
  wasteRecycled: z.boolean().nullable().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.footprintEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Fetch entries error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = entrySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const inputData = result.data;
    
    // Calculate total emissions
    const co2Emission = calculateTotalEntryEmission({
      transportMode: inputData.transportMode,
      transportDistance: inputData.transportDistance,
      electricityUsage: inputData.electricityUsage,
      heatingSource: inputData.heatingSource,
      heatingUsage: inputData.heatingUsage,
      foodDietType: inputData.foodDietType,
      wasteVolume: inputData.wasteVolume,
      wasteRecycled: inputData.wasteRecycled,
    });

    // Create entry in database
    const newEntry = await prisma.footprintEntry.create({
      data: {
        userId: session.user.id,
        timestamp: inputData.timestamp,
        transportMode: inputData.transportMode ?? null,
        transportDistance: inputData.transportDistance ?? null,
        electricityUsage: inputData.electricityUsage ?? null,
        heatingSource: inputData.heatingSource ?? null,
        heatingUsage: inputData.heatingUsage ?? null,
        foodDietType: inputData.foodDietType ?? null,
        wasteVolume: inputData.wasteVolume ?? null,
        wasteRecycled: inputData.wasteRecycled ?? null,
        co2Emission,
      },
    });

    // Run gamification updates (streaks, points, badges, challenges)
    const gamificationResult = await processGamification(session.user.id, newEntry);

    return NextResponse.json(
      {
        message: 'Footprint entry logged successfully',
        entry: newEntry,
        gamification: gamificationResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Log entry error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
