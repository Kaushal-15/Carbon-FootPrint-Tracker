import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FootprintEntry } from '@prisma/client';

export const dynamic = 'force-dynamic';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Fallback recommendations generator used when Groq is unavailable, unconfigured,
 * or fails. Moved to module scope so it's defined once per process, not once
 * per request, and so it can be unit tested independently of the route handler.
 *
 * Note: "trans" here is a rough proxy score for transport+energy load, not a
 * literal transport-only figure — electricity usage is folded in as a stand-in
 * signal since both correlate with "high household energy/travel demand".
 * @param entries The footprint entries.
 * @returns Formatted markdown recommendation string.
 */
export function generateFallbackRecommendations(entries: FootprintEntry[]): string {
  if (entries.length === 0) {
    return 'Log your daily footprint categories so EcoTrace can analyze your patterns and generate tailored insights.';
  }

  // Calculate simple proxy scores to find the biggest contributor category
  let transportEnergyScore = 0;
  let foodScore = 0;
  let wasteScore = 0;

  entries.forEach((e) => {
    if (e.transportMode && e.transportMode !== 'WALK' && e.transportMode !== 'BIKE') {
      transportEnergyScore += e.transportDistance ?? 0;
    }
    transportEnergyScore += e.electricityUsage ?? 0; // energy demand folded into the same proxy
    if (e.foodDietType === 'MEAT_HEAVY' || e.foodDietType === 'MEAT_MEDIUM') foodScore += 10;
    if (e.wasteVolume === 'HIGH') wasteScore += 10;
  });

  if (transportEnergyScore >= foodScore && transportEnergyScore >= wasteScore) {
    return '🌱 **EcoTrace Transport Insight**\n- Commute patterns: You travel frequently by passenger car. Consider carpooling or switching to local public transit for journeys over 5 km.\n- Active travel: For distances under 3 km, walking or cycling can reduce your transport footprint to zero and boost daily fitness!';
  }
  if (foodScore >= transportEnergyScore && foodScore >= wasteScore) {
    return '🥗 **EcoTrace Food Insight**\n- Plant-based transition: High meat consumption is your biggest driver. Replacing red meat with poultry, fish, or legumes for just 3 days a week can cut food emissions by 30%.\n- Meal preps: Planning meals ahead reduces food waste, saving energy and footprint simultaneously.';
  }
  return '♻️ **EcoTrace Waste Insight**\n- Active recycling: Check local recycling guidelines to ensure paper, metal, and glass bypass landfills, which reduces waste emissions by 50%.\n- Smart shopping: Purchase bulk quantities and avoid single-use packaging to decrease initial waste volume.';
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const userId = session.user.id;

    // 1. Fetch user data including cached insights and entries
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entries: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // 2. Cache & Rate limiting check
    if (user.cachedInsights && user.insightsUpdatedAt) {
      const timeSinceUpdate = now.getTime() - new Date(user.insightsUpdatedAt).getTime();

      if (!forceRefresh && timeSinceUpdate < TWENTY_FOUR_HOURS_MS) {
        // Return cached recommendations directly
        return NextResponse.json({ recommendations: user.cachedInsights }, { status: 200 });
      }

      if (forceRefresh && timeSinceUpdate < FIVE_MINUTES_MS) {
        // Rate limit manual refreshes to once every 5 minutes
        return NextResponse.json(
          {
            recommendations: user.cachedInsights,
            message: 'Rate limit: You can only refresh AI insights once every 5 minutes.',
          },
          { status: 429 }
        );
      }
    }

    // 3. If there are no entries, return the empty/base fallback immediately
    if (user.entries.length === 0) {
      const fallback = generateFallbackRecommendations([]);
      return NextResponse.json({ recommendations: fallback }, { status: 200 });
    }

    // 4. Compile entry summaries for Groq API prompt
    const recentLogsSummary = user.entries
      .map((e, idx) => {
        return `Day ${idx + 1}: Transport: ${e.transportMode ?? 'None'} (${e.transportDistance ?? 0} km), Electricity: ${e.electricityUsage ?? 0} kWh, Heating: ${e.heatingSource ?? 'None'} (${e.heatingUsage ?? 0} kWh), Diet: ${e.foodDietType ?? 'Not logged'}, Waste: ${e.wasteVolume ?? 'Not logged'} (Recycled: ${e.wasteRecycled ? 'Yes' : 'No'}).`;
      })
      .join('\n');

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.warn('GROQ_API_KEY environment variable is not defined. Using fallback generator.');
      const fallback = generateFallbackRecommendations(user.entries);

      await prisma.user.update({
        where: { id: userId },
        data: {
          cachedInsights: fallback,
          insightsUpdatedAt: now,
        },
      });

      return NextResponse.json({ recommendations: fallback }, { status: 200 });
    }

    // 5. Call Groq API
    try {
      const systemPrompt = `You are an expert environmental consultant and sustainability coach. 
Analyze the user's daily activity logs and return exactly 2-3 specific, actionable, and non-generic suggestions on how they can reduce their carbon footprint.
Tether your advice strictly to their logged activity (e.g. if they eat meat, address meat; if they drive a car, address travel). Do not use generic filler words or generic lists.
Keep your output brief (maximum 150 words total). Format with Markdown. Avoid headers.`;

      const userPrompt = `Here are my recent activity logs for the last few days:\n${recentLogsSummary}\nPlease provide personalized recommendations.`;

      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 250,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`Groq API responded with status ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      const recommendations = responseData.choices?.[0]?.message?.content?.trim();

      if (!recommendations) {
        throw new Error('Malformed completion response from Groq API');
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          cachedInsights: recommendations,
          insightsUpdatedAt: now,
        },
      });

      return NextResponse.json({ recommendations }, { status: 200 });
    } catch (apiError) {
      console.error('Failed to query Groq API. Falling back to local rules:', apiError);
      const fallback = generateFallbackRecommendations(user.entries);

      await prisma.user.update({
        where: { id: userId },
        data: {
          cachedInsights: fallback,
          insightsUpdatedAt: now,
        },
      });

      return NextResponse.json({ recommendations: fallback }, { status: 200 });
    }
  } catch (error) {
    console.error('Insights route error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}