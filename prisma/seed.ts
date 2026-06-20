import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default badges and challenges...');

  // 1. Seed Badges
  const badges = [
    {
      name: 'First Step',
      description: 'Log your first carbon footprint entry.',
      icon: '🌱',
    },
    {
      name: 'Eco Warrior',
      description: 'Log footprint entries for 7 consecutive days.',
      icon: '🔥',
    },
    {
      name: 'Green Commuter',
      description: 'Log transport with green modes (bike, walk, train, or bus) for a week.',
      icon: '🚲',
    },
    {
      name: 'Conscious Consumer',
      description: 'Log food category as Vegan or Vegetarian for 5 entries.',
      icon: '🥗',
    },
    {
      name: 'Zero Waste Champion',
      description: 'Log waste with active recycling and low volume.',
      icon: '♻️',
    },
    {
      name: 'Carbon Cutter',
      description: 'Reduce your weekly carbon footprint by 10% compared to average.',
      icon: '📉',
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: { description: badge.description, icon: badge.icon },
      create: badge,
    });
  }

  // 2. Seed Challenges
  const challenges = [
    {
      title: 'Meat-Free Week',
      description: 'Keep your meals vegetarian or vegan for a full week to reduce food-related emissions.',
      durationDays: 7,
      pointsReward: 150,
      category: 'FOOD',
    },
    {
      title: 'Active Commuting',
      description: 'Walk or cycle for all transport trips below 5 km for 5 days.',
      durationDays: 5,
      pointsReward: 120,
      category: 'TRANSPORT',
    },
    {
      title: 'Unplugged Weekend',
      description: 'Reduce your home electricity usage by switching off unnecessary appliances for 2 days.',
      durationDays: 2,
      pointsReward: 80,
      category: 'ENERGY',
    },
    {
      title: 'Zero Single-Use Waste',
      description: 'Recycle all waste and produce low waste volume for 7 consecutive days.',
      durationDays: 7,
      pointsReward: 100,
      category: 'WASTE',
    },
  ];

  for (const challenge of challenges) {
    await prisma.challenge.upsert({
      where: { title: challenge.title },
      update: {
        description: challenge.description,
        durationDays: challenge.durationDays,
        pointsReward: challenge.pointsReward,
        category: challenge.category,
      },
      create: challenge,
    });
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
