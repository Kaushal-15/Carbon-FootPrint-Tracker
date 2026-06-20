import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      const fiveMinutes = 5 * 60 * 1000;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (!forceRefresh && timeSinceUpdate < twentyFourHours) {
        // Return cached recommendations directly
        return NextResponse.json({ recommendations: user.cachedInsights }, { status: 200 });
      }

      if (forceRefresh && timeSinceUpdate < fiveMinutes) {
        // Rate limit manual refreshes to once every 5 minutes
        return NextResponse.json(
          { 
            recommendations: user.cachedInsights, 
            message: 'Rate limit: You can only refresh AI insights once every 5 minutes.' 
          }, 
          { status: 429 }
        );
      }
    }

    // 3. Fallback static recommendation generator (if Groq fails or no key)
    /**
     * Fallback recommendations generator in case the external API fails.
     * @param {Array<{category: string, value: number, description?: string | null}>} entries - The footprint entries.
     * @returns {string} Formatted markdown recommendations.
     */
    const generateFallbackRecommendations = (entries: {category: string, value: number, description?: string | null}[]) => {
      if (entries.length === 0) {
        return "Log your daily footprint categories so EcoTrace can analyze your patterns and generate tailored insights.";
      }
      
      // Calculate averages to find biggest contributor
      let trans = 0, energy = 0, food = 0, waste = 0;
      entries.forEach(e => {
        if (e.transportMode && e.transportMode !== 'WALK' && e.transportMode !== 'BIKE') trans += (e.transportDistance ?? 0);
        trans += (e.electricityUsage ?? 0); // proxy
        if (e.foodDietType === 'MEAT_HEAVY' || e.foodDietType === 'MEAT_MEDIUM') food += 10;
        if (e.wasteVolume === 'HIGH') waste += 10;
      });

      if (trans >= energy && trans >= food && trans >= waste) {
        return "🌱 **EcoTrace Transport Insight**\n- Commute patterns: You travel frequently by passenger car. Consider carpooling or switching to local public transit for journeys over 5 km.\n- Active travel: For distances under 3 km, walking or cycling can reduce your transport footprint to zero and boost daily fitness!";
      }
      if (food >= trans && food >= energy && food >= waste) {
        return "🥗 **EcoTrace Food Insight**\n- Plant-based transition: High meat consumption is your biggest driver. Replacing red meat with poultry, fish, or legumes for just 3 days a week can cut food emissions by 30%.\n- Meal preps: Planning meals ahead reduces food waste, saving energy and footprint simultaneously.";
      }
      if (energy >= trans && energy >= food && energy >= waste) {
        return "⚡ **EcoTrace Energy Insight**\n- Smart settings: High home heating/electricity usage detected. Lowering your thermostat by just 1°C in winter can reduce space heating emissions by up to 10%.\n- Standby mode: Unplug home electronics or use smart power strips to eliminate phantom energy loads when not in use.";
      }
      return "♻️ **EcoTrace Waste Insight**\n- Active recycling: Check local recycling guidelines to ensure paper, metal, and glass bypass landfills, which reduces waste emissions by 50%.\n- Smart shopping: Purchase bulk quantities and avoid single-use packaging to decrease initial waste volume.";
    };

    // If there are no entries, return the empty/base fallback immediately
    if (user.entries.length === 0) {
      const fallback = generateFallbackRecommendations([]);
      return NextResponse.json({ recommendations: fallback }, { status: 200 });
    }

    // 4. Compile entry summaries for Groq API prompt
    const recentLogsSummary = user.entries.map((e, idx) => {
      return `Day ${idx + 1}: Transport: ${e.transportMode ?? 'None'} (${e.transportDistance ?? 0} km), Electricity: ${e.electricityUsage ?? 0} kWh, Heating: ${e.heatingSource ?? 'None'} (${e.heatingUsage ?? 0} kWh), Diet: ${e.foodDietType ?? 'Not logged'}, Waste: ${e.wasteVolume ?? 'Not logged'} (Recycled: ${e.wasteRecycled ? 'Yes' : 'No'}).`;
    }).join('\n');

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.warn('GROQ_API_KEY environment variable is not defined. Using fallback generator.');
      const fallback = generateFallbackRecommendations(user.entries);
      
      // Save fallback in cache
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
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
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

      // Update Database Cache
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

      // Cache the fallback recommendations
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
