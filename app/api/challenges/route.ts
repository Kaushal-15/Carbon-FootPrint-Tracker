import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all challenges
    const challenges = await prisma.challenge.findMany();

    // Fetch user joined challenges
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId },
    });

    const userChallengeMap = new Map(
      userChallenges.map((uc) => [uc.challengeId, uc])
    );

    // Merge status
    const result = challenges.map((c) => {
      const enrollment = userChallengeMap.get(c.id);
      return {
        ...c,
        isJoined: !!enrollment,
        status: enrollment ? enrollment.status : 'NOT_JOINED',
        startedAt: enrollment ? enrollment.startedAt : null,
        completedAt: enrollment ? enrollment.completedAt : null,
      };
    });

    return NextResponse.json({ challenges: result }, { status: 200 });
  } catch (error) {
    console.error('Fetch challenges error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();
    if (!challengeId) {
      return NextResponse.json({ message: 'Challenge ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ message: 'Challenge not found' }, { status: 444 });
    }

    // Check duplicate opt-in
    const existing = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: { userId, challengeId },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already enrolled in this challenge' }, { status: 400 });
    }

    // Create UserChallenge
    const enrolled = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      message: 'Successfully enrolled in challenge',
      enrollment: enrolled,
    }, { status: 201 });
  } catch (error) {
    console.error('Join challenge error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
