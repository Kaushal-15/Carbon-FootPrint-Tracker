/**
 * EcoTrace Carbon Footprint Calculation Engine
 * 
 * Emission factors are based on standard averages cited from:
 * - EPA (Environmental Protection Agency)
 * - UK DEFRA (Department for Environment, Food & Rural Affairs)
 * - University of Oxford (Our World in Data food emissions)
 */

export const EMISSION_FACTORS = {
  // Transport: kg CO2 per km
  transport: {
    CAR: 0.18,      // Average petrol passenger car
    BUS: 0.08,      // Average local transit bus passenger-km
    TRAIN: 0.04,    // Standard passenger rail passenger-km
    FLIGHT: 0.25,   // Short/long-haul commercial aviation average per seat
    BIKE: 0.0,      // Carbon-free transport
    WALK: 0.0,      // Carbon-free transport
  },
  // Energy: kg CO2 per kWh
  energy: {
    ELECTRICITY: 0.38,  // U.S./Global average grid electricity factor
    GAS: 0.18,          // Natural gas direct combustion
    OIL: 0.26,          // Heating oil direct combustion
    NONE: 0.0,
  },
  // Food: kg CO2 per day (based on daily food lifecycle emissions)
  food: {
    VEGAN: 1.5,         // Purely plant-based diet
    VEGETARIAN: 2.5,    // No meat, includes dairy/eggs
    PESCATARIAN: 3.5,   // Plant-based + seafood
    MEAT_MEDIUM: 5.0,   // Moderate meat consumption (mostly poultry/pork, some beef)
    MEAT_HEAVY: 7.5,    // Heavy meat consumption (frequent beef/lamb/dairy)
  },
  // Waste: kg CO2 per day based on volume levels (includes landfill methane factors)
  waste: {
    // Base waste kg: LOW = 0.5kg/day, MEDIUM = 1.5kg/day, HIGH = 3.0kg/day
    baseKg: {
      LOW: 0.5,
      MEDIUM: 1.5,
      HIGH: 3.0,
    },
    factorPerKg: 0.5,         // Landfilled waste emissions factor
    recyclingDiscount: 0.50, // 50% carbon footprint reduction if active recycling is done
  }
};

/**
 * Calculates transport emissions.
 * @param mode The transport mode (e.g. CAR, BUS, TRAIN, etc.)
 * @param distanceKm The distance traveled in kilometers.
 * @returns CO2 emissions in kg.
 */
export function calculateTransport(mode?: string | null, distanceKm?: number | null): number {
  if (!mode || typeof distanceKm !== 'number' || distanceKm <= 0) return 0;
  
  const upperMode = mode.toUpperCase() as keyof typeof EMISSION_FACTORS.transport;
  const factor = EMISSION_FACTORS.transport[upperMode] ?? 0;
  
  // Safe clamp for extreme distance inputs (e.g. max distance of a flight around earth is ~40,000km)
  const safeDistance = Math.min(Math.max(0, distanceKm), 40000);
  
  return Number((safeDistance * factor).toFixed(2));
}

/**
 * Calculates energy emissions from electricity and heating.
 * @param electricityKwh Electricity usage in kWh.
 * @param heatingSource Heating source (e.g. GAS, ELECTRIC, OIL, NONE).
 * @param heatingKwh Heating usage in kWh.
 * @returns CO2 emissions in kg.
 */
export function calculateEnergy(
  electricityKwh?: number | null,
  heatingSource?: string | null,
  heatingKwh?: number | null
): number {
  let co2 = 0;

  // Electricity
  if (typeof electricityKwh === 'number' && electricityKwh > 0) {
    const safeKwh = Math.min(electricityKwh, 10000); // clamp extreme value
    co2 += safeKwh * EMISSION_FACTORS.energy.ELECTRICITY;
  }

  // Heating
  if (heatingSource && typeof heatingKwh === 'number' && heatingKwh > 0) {
    const upperSource = heatingSource.toUpperCase();
    let factor = 0;
    
    if (upperSource === 'ELECTRIC') {
      factor = EMISSION_FACTORS.energy.ELECTRICITY;
    } else if (upperSource === 'GAS') {
      factor = EMISSION_FACTORS.energy.GAS;
    } else if (upperSource === 'OIL') {
      factor = EMISSION_FACTORS.energy.OIL;
    }

    const safeHeatingKwh = Math.min(heatingKwh, 10000); // clamp extreme value
    co2 += safeHeatingKwh * factor;
  }

  return Number(co2.toFixed(2));
}

/**
 * Calculates daily food emissions based on diet pattern.
 * @param dietType Diet type (e.g. VEGAN, VEGETARIAN, etc.)
 * @returns CO2 emissions in kg.
 */
export function calculateFood(dietType?: string | null): number {
  if (!dietType) return 0;
  const upperDiet = dietType.toUpperCase() as keyof typeof EMISSION_FACTORS.food;
  const factor = EMISSION_FACTORS.food[upperDiet] ?? 0;
  return factor;
}

/**
 * Calculates waste emissions.
 * @param volumeLevel Waste volume level (LOW, MEDIUM, HIGH)
 * @param recycled Whether recycling is practiced
 * @returns CO2 emissions in kg.
 */
export function calculateWaste(volumeLevel?: string | null, recycled?: boolean | null): number {
  if (!volumeLevel) return 0;
  
  const upperLevel = volumeLevel.toUpperCase() as keyof typeof EMISSION_FACTORS.waste.baseKg;
  const kg = EMISSION_FACTORS.waste.baseKg[upperLevel] ?? 0;
  
  let factor = EMISSION_FACTORS.waste.factorPerKg;
  if (recycled) {
    factor *= (1 - EMISSION_FACTORS.waste.recyclingDiscount);
  }
  
  return Number((kg * factor).toFixed(2));
}

interface FootprintInput {
  transportMode?: string | null;
  transportDistance?: number | null;
  electricityUsage?: number | null;
  heatingSource?: string | null;
  heatingUsage?: number | null;
  foodDietType?: string | null;
  wasteVolume?: string | null;
  wasteRecycled?: boolean | null;
}

/**
 * Calculates the total emissions in kg CO2 for a logging entry.
 * Includes safety fallbacks for missing/invalid inputs.
 */
export function calculateTotalEntryEmission(input: FootprintInput): number {
  const transport = calculateTransport(input.transportMode, input.transportDistance);
  const energy = calculateEnergy(input.electricityUsage, input.heatingSource, input.heatingUsage);
  const food = calculateFood(input.foodDietType);
  const waste = calculateWaste(input.wasteVolume, input.wasteRecycled);

  return Number((transport + energy + food + waste).toFixed(2));
}
