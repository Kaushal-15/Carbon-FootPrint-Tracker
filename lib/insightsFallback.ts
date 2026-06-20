import { FootprintEntry } from '@prisma/client';

/**
 * Fallback recommendations generator used when Groq is unavailable, unconfigured,
 * or fails. Lives outside the route file so it's defined once per process (not
 * once per request) and can be unit tested independently of the route handler.
 *
 * Note: "transportEnergyScore" is a rough proxy combining transport distance and
 * electricity usage, since both correlate with "high household energy/travel demand".
 * @param entries The footprint entries.
 * @returns Formatted markdown recommendation string.
 */
export function generateFallbackRecommendations(entries: FootprintEntry[]): string {
    if (entries.length === 0) {
        return 'Log your daily footprint categories so EcoTrace can analyze your patterns and generate tailored insights.';
    }

    let transportEnergyScore = 0;
    let foodScore = 0;
    let wasteScore = 0;

    entries.forEach((e) => {
        if (e.transportMode && e.transportMode !== 'WALK' && e.transportMode !== 'BIKE') {
            transportEnergyScore += e.transportDistance ?? 0;
        }
        transportEnergyScore += e.electricityUsage ?? 0;
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