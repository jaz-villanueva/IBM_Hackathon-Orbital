import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';
import { getMissionById } from '@/lib/missions';
import { AIContext } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, missionId, planet } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const context: AIContext = {};

    if (missionId) {
      const mission = getMissionById(missionId);
      if (mission) context.selectedMission = mission;
    }

    if (planet) {
      context.selectedPlanet = planet;
    }

    const response = await generateAIResponse(messages, context);

    return NextResponse.json({
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
