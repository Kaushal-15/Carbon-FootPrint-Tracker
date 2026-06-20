import { describe, it, expect } from 'vitest';
import {
  calculateTransport,
  calculateEnergy,
  calculateFood,
  calculateWaste,
  calculateTotalEntryEmission,
} from '../lib/carbonCalculator';

describe('Carbon Calculator Engine', () => {
  describe('Transport calculations', () => {
    it('calculates emission for normal values', () => {
      // Car: 10km * 0.18 = 1.8
      expect(calculateTransport('CAR', 10)).toBe(1.8);
      // Bus: 20km * 0.08 = 1.6
      expect(calculateTransport('BUS', 20)).toBe(1.6);
    });

    it('returns 0 for walking and cycling', () => {
      expect(calculateTransport('BIKE', 100)).toBe(0);
      expect(calculateTransport('WALK', 50)).toBe(0);
    });

    it('returns 0 for negative or zero distances', () => {
      expect(calculateTransport('CAR', 0)).toBe(0);
      expect(calculateTransport('CAR', -5)).toBe(0);
    });

    it('returns 0 for missing or invalid transport mode', () => {
      expect(calculateTransport('', 10)).toBe(0);
      expect(calculateTransport(null, 10)).toBe(0);
      expect(calculateTransport('SPACESUIP', 10)).toBe(0);
    });

    it('clamps extreme distances safely', () => {
      // Clamps distance to 40,000 km (Earth circumference)
      // Car: 100,000km clamped to 40,000km * 0.18 = 7200
      expect(calculateTransport('CAR', 100000)).toBe(7200);
    });
  });

  describe('Energy calculations', () => {
    it('calculates electricity only', () => {
      // 100 kWh * 0.38 = 38
      expect(calculateEnergy(100, 'NONE', 0)).toBe(38);
    });

    it('calculates heating only', () => {
      // Gas: 50 kWh * 0.18 = 9
      expect(calculateEnergy(0, 'GAS', 50)).toBe(9);
      // Electric heating: 50 kWh * 0.38 = 19
      expect(calculateEnergy(0, 'ELECTRIC', 50)).toBe(19);
      // Oil heating: 50 kWh * 0.26 = 13
      expect(calculateEnergy(0, 'OIL', 50)).toBe(13);
    });

    it('calculates electricity and heating combined', () => {
      // Electricity: 100 kWh * 0.38 = 38
      // Gas heating: 100 kWh * 0.18 = 18
      // Total = 56
      expect(calculateEnergy(100, 'GAS', 100)).toBe(56);
    });

    it('handles negative or zero electricity/heating usage', () => {
      expect(calculateEnergy(-10, 'GAS', -20)).toBe(0);
      expect(calculateEnergy(0, 'NONE', 0)).toBe(0);
    });

    it('handles missing heating sources gracefully', () => {
      expect(calculateEnergy(100, null, 50)).toBe(38);
      expect(calculateEnergy(100, 'INVALID', 50)).toBe(38);
    });

    it('clamps extreme energy inputs', () => {
      // Clamps electricity to 10,000 kWh -> 10,000 * 0.38 = 3800
      expect(calculateEnergy(50000, 'NONE', 0)).toBe(3800);
    });
  });

  describe('Food calculations', () => {
    it('returns exact factors for valid diet types', () => {
      expect(calculateFood('VEGAN')).toBe(1.5);
      expect(calculateFood('VEGETARIAN')).toBe(2.5);
      expect(calculateFood('PESCATARIAN')).toBe(3.5);
      expect(calculateFood('MEAT_MEDIUM')).toBe(5.0);
      expect(calculateFood('MEAT_HEAVY')).toBe(7.5);
    });

    it('returns 0 for missing or invalid diet types', () => {
      expect(calculateFood(null)).toBe(0);
      expect(calculateFood('JUNK_FOOD')).toBe(0);
    });
  });

  describe('Waste calculations', () => {
    it('calculates waste emissions for volume levels', () => {
      // LOW: 0.5kg * 0.5 factor = 0.25
      expect(calculateWaste('LOW', false)).toBe(0.25);
      // MEDIUM: 1.5kg * 0.5 factor = 0.75
      expect(calculateWaste('MEDIUM', false)).toBe(0.75);
      // HIGH: 3.0kg * 0.5 factor = 1.5
      expect(calculateWaste('HIGH', false)).toBe(1.5);
    });

    it('applies recycling discount correctly', () => {
      // LOW: 0.5kg * 0.25 (discounted factor) = 0.13 (rounded)
      expect(calculateWaste('LOW', true)).toBe(0.13);
      // MEDIUM: 1.5kg * 0.25 (discounted factor) = 0.38 (rounded)
      expect(calculateWaste('MEDIUM', true)).toBe(0.38);
      // HIGH: 3.0kg * 0.25 (discounted factor) = 0.75
      expect(calculateWaste('HIGH', true)).toBe(0.75);
    });

    it('returns 0 for missing or invalid waste levels', () => {
      expect(calculateWaste(null, false)).toBe(0);
      expect(calculateWaste('NONE', false)).toBe(0);
    });
  });

  describe('Total emission calculations', () => {
    it('calculates sum of all inputs correctly', () => {
      const input = {
        transportMode: 'CAR',
        transportDistance: 10,  // 1.8 kg
        electricityUsage: 100,  // 38 kg
        heatingSource: 'GAS',
        heatingUsage: 100,      // 18 kg
        foodDietType: 'VEGAN',  // 1.5 kg
        wasteVolume: 'MEDIUM',
        wasteRecycled: true,    // 0.38 kg
      };
      
      // Expected total: 1.8 + 38 + 18 + 1.5 + 0.38 = 59.68 kg
      expect(calculateTotalEntryEmission(input)).toBe(59.68);
    });

    it('handles incomplete entries safely', () => {
      const input = {
        transportMode: null,
        transportDistance: null,
        electricityUsage: 100,  // 38 kg
        heatingSource: 'NONE',
        heatingUsage: null,
        foodDietType: null,
        wasteVolume: null,
        wasteRecycled: null,
      };

      expect(calculateTotalEntryEmission(input)).toBe(38);
    });
  });
});
