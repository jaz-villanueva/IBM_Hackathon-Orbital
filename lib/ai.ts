/**
 * AI Service Abstraction Layer
 * 
 * This module provides a provider-agnostic AI interface.
 * Currently uses mock responses. Connect IBM watsonx / Granite or
 * any other provider by swapping the provider implementation below.
 * 
 * Environment:
 *   AI_PROVIDER=mock|openai|watsonx
 *   AI_API_KEY=<key>
 */

import { Mission, AIContext, AIMessage } from './types';

export interface AIProvider {
  generateResponse(
    messages: AIMessage[],
    context: AIContext,
    systemPrompt: string
  ): Promise<string>;
}

// ─── Mock Provider ────────────────────────────────────────────────────────────
// Used for development and demos. Replace with real provider for production.

function buildMissionContext(context: AIContext): string {
  const parts: string[] = [];

  if (context.selectedMission) {
    const m = context.selectedMission;
    parts.push(`SELECTED MISSION: ${m.name}`);
    parts.push(`Agency: ${m.agency}`);
    parts.push(`Destination: ${m.destination}`);
    parts.push(`Status: ${m.status}`);
    parts.push(`Type: ${m.missionType}`);
    parts.push(`Description: ${m.description}`);
    parts.push(`Objectives: ${m.objectives.join('; ')}`);
    if (m.currentPhase) {
      parts.push(`Current Phase: ${m.currentPhase.name} — ${m.currentPhase.description}`);
    }
    if (m.currentLocation) {
      parts.push(`Current Location [${m.currentLocation.label}]: ${m.currentLocation.description}`);
    }
    if (m.spacecraft.length > 0) {
      parts.push(`Spacecraft: ${m.spacecraft.map((s) => s.name).join(', ')}`);
    }
    if (m.aiInsights && m.aiInsights.length > 0) {
      parts.push('\nCURATED INSIGHTS:');
      m.aiInsights.forEach((ins) => {
        parts.push(`[${ins.type.toUpperCase()}] ${ins.content}`);
      });
    }
    const latestEvents = m.events.slice(-3);
    if (latestEvents.length > 0) {
      parts.push('\nRECENT EVENTS:');
      latestEvents.forEach((ev) => {
        parts.push(`- ${ev.timestamp}: ${ev.title} — ${ev.description}`);
      });
    }
  }

  if (context.selectedPlanet && !context.selectedMission) {
    parts.push(`SELECTED PLANET/DESTINATION: ${context.selectedPlanet}`);
  }

  if (context.visibleMissions && context.visibleMissions.length > 0) {
    parts.push(
      `\nVISIBLE MISSIONS (${context.visibleMissions.length}): ` +
        context.visibleMissions.map((m) => `${m.shortName || m.name} [${m.status}]`).join(', ')
    );
  }

  return parts.join('\n');
}

const MOCK_RESPONSES: Record<string, string> = {
  artemis: `**Artemis II** is NASA's first crewed mission to the vicinity of the Moon since 1972 — a critical test before humans land on the Moon again.

**What it's doing:** The four-person crew (Reid Wiseman, Victor Glover, Christina Koch, and Jeremy Hansen) will fly aboard Orion on a 10-day free-return trajectory around the Moon. The mission doesn't land — it validates every deep-space crewed system before Artemis III attempts the first lunar landing in over 50 years.

**Why it matters:** Artemis II is the final test before humans walk on the Moon again. It also marks the first Black astronaut and first Canadian to travel to lunar distance.

**Data confidence:** High — all information sourced from NASA public releases.`,

  perseverance: `**Perseverance** has been exploring Jezero Crater since February 2021, systematically investigating an ancient lake bed and river delta for signs of past microbial life.

**What it's doing now:** The rover is in its fourth science campaign, exploring the upper delta margin — a geologically diverse zone where ancient lake sediments meet older crater materials. It has collected over 20 carefully selected rock core samples for potential return to Earth.

**Why it matters:** Jezero Crater is one of the most promising places in the solar system to look for ancient life. If biosignatures exist in those cached samples and a sample-return mission succeeds, we could answer one of humanity's oldest questions.

**Data confidence:** High — location and activities sourced from NASA's Mars 2020 mission pages.`,

  curiosity: `**Curiosity** has been operating on Mars for over 12 years, exploring the sedimentary layers of Mt. Sharp (Aeolis Mons) in Gale Crater.

**What it's doing:** The rover is ascending Mt. Sharp's slopes, reading the layered rock record like chapters in a book. Each layer represents a different period of Martian climate history. Curiosity has already confirmed ancient habitable conditions and detected organic molecules.

**Key finding:** Gale Crater hosted a freshwater lake billions of years ago with chemical conditions favorable for life as we know it.

**Data confidence:** High — sourced from NASA JPL mission status updates.`,

  maven: `**MAVEN** has been studying Mars's upper atmosphere since 2014, investigating how the planet lost the thick atmosphere that once made it warm and wet.

**Key discovery:** MAVEN determined that the solar wind strips away 100 grams of Martian atmosphere per second — and that billions of years of this erosion removed most of Mars's original atmosphere, causing Mars to transition from a warm, potentially habitable world to the cold desert it is today.

**Current role:** In addition to atmospheric science, MAVEN now serves as a critical communication relay for surface missions including Curiosity and Perseverance.`,

  iss: `The **International Space Station** is humanity's continuously crewed laboratory in low Earth orbit, operated by an international partnership of NASA, Roscosmos, ESA, JAXA, and CSA.

**Current altitude:** ~408 km — low enough that Earth's thin upper atmosphere gradually drags it down, requiring periodic reboost maneuvers.

**What it does:** The ISS hosts rotating crews of typically 7 astronauts conducting hundreds of experiments in microgravity — from human physiology to materials science to fundamental physics that can't be done on Earth.

**Status:** The ISS has been continuously occupied since November 2, 2000 — over 24 years of uninterrupted human presence in space.`,
};

class MockAIProvider implements AIProvider {
  async generateResponse(
    messages: AIMessage[],
    context: AIContext,
    _systemPrompt: string
  ): Promise<string> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
    const missionContext = buildMissionContext(context);

    // Check for mission-specific keywords
    if (lastUserMessage.includes('artemis') || context.selectedMission?.id === 'artemis-2') {
      return MOCK_RESPONSES.artemis;
    }
    if (lastUserMessage.includes('perseverance') || context.selectedMission?.id === 'perseverance') {
      return MOCK_RESPONSES.perseverance;
    }
    if (lastUserMessage.includes('curiosity') || context.selectedMission?.id === 'curiosity') {
      return MOCK_RESPONSES.curiosity;
    }
    if (lastUserMessage.includes('maven') || context.selectedMission?.id === 'maven') {
      return MOCK_RESPONSES.maven;
    }
    if (lastUserMessage.includes('iss') || lastUserMessage.includes('space station') || context.selectedMission?.id === 'iss') {
      return MOCK_RESPONSES.iss;
    }

    // Context-aware generic response
    if (context.selectedMission) {
      const m = context.selectedMission;
      return `Based on publicly available data for **${m.name}**:

${m.description}

**Current status:** ${m.status.replace(/-/g, ' ')} — ${m.currentPhase?.description || 'See mission phases for details.'}

**Agency:** ${m.agency}
**Destination:** ${m.destination.charAt(0).toUpperCase() + m.destination.slice(1)}

${m.aiInsights?.[0]?.content || ''}

*Note: This response is based on curated public mission data. For real-time telemetry, consult the mission's official website.*`;
    }

    if (context.selectedPlanet === 'mars') {
      return `**Mars** currently hosts several active missions:\n\n• **Perseverance** rover (NASA) — exploring Jezero Crater, caching samples\n• **Curiosity** rover (NASA) — ascending Mt. Sharp in Gale Crater\n• **MAVEN** orbiter (NASA) — atmospheric science and communications relay\n• **MRO** (NASA) — high-resolution imaging and relay\n• **Mars Express** (ESA) — ongoing atmospheric and radar science\n• **TGO** (ESA) — trace gas detection, investigating the methane mystery\n\nMars is currently the most studied destination beyond Earth, with surface rovers, atmospheric orbiters, and plans for sample return and eventual crewed missions.`;
    }

    if (context.selectedPlanet === 'moon') {
      return `**The Moon** is the focus of a new era of exploration:\n\n• **LRO** (NASA) — 15+ years of detailed polar mapping\n• **KPLO/Danuri** (KARI) — South Korea's first lunar orbiter with NASA's ShadowCam\n• **Artemis II** (NASA) — crewed lunar flyby mission planned for 2025\n• **Lunar Gateway** (NASA/ESA/JAXA/CSA) — planned orbital waystation\n\nThe Moon is the near-term focus of crewed exploration, with Artemis aiming to return humans to the surface for the first time since 1972.`;
    }

    if (lastUserMessage.includes('data') || lastUserMessage.includes('source') || lastUserMessage.includes('know')) {
      return `ORBITAL displays three categories of information:\n\n**OBSERVED** — Data directly obtained from public sources such as NASA, CelesTrak, SatNOGS, and ESA.\n\n**DERIVED** — Values mathematically calculated from observed data (e.g., altitude derived from TLE orbital elements).\n\n**AI** — Analysis, summaries, and insights generated by this application based on available public data.\n\nInformation not covered by public sources is not displayed. If you ask about specific telemetry that isn't publicly available, the system will say so explicitly rather than fabricate values.`;
    }

    // Use mission context if available
    if (missionContext) {
      return `Based on available public data:\n\n${missionContext.split('\n').slice(0, 8).join('\n')}\n\n*This response synthesizes information from NASA and other public space agencies. All information is sourced from public mission data.*`;
    }

    return `I can help you explore any of the missions in ORBITAL's catalog. Try selecting a mission from the catalog, or ask me about:\n\n• **Mars missions** — "What's happening on Mars?"\n• **Artemis** — "What is Artemis II doing?"\n• **Rovers** — "What has Perseverance found?"\n• **Data sources** — "How is data labeled here?"\n\nAll responses are based on publicly available mission information.`;
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

function createProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';
  switch (provider) {
    case 'mock':
    default:
      return new MockAIProvider();
    // Future providers:
    // case 'openai': return new OpenAIProvider();
    // case 'watsonx': return new WatsonxProvider();
  }
}

// ─── Exported Service ─────────────────────────────────────────────────────────

const aiProvider = createProvider();

export const SYSTEM_PROMPT = `You are ORBITAL's AI Space Analyst — an expert in space missions, spacecraft, and planetary science.

You ONLY answer questions using information available in the provided mission data context.
You do NOT invent facts, telemetry values, or spacecraft status data.
When information is uncertain or unavailable, say: "Public data does not establish this."
You clearly distinguish between OBSERVED data (from public sources), DERIVED data (calculated), and AI interpretation.
Keep responses concise but substantive. Use markdown formatting for clarity.
You speak to curious, intelligent non-experts — make space exploration understandable without being condescending.`;

export async function generateAIResponse(
  messages: AIMessage[],
  context: AIContext
): Promise<string> {
  return aiProvider.generateResponse(messages, context, SYSTEM_PROMPT);
}

export function generateMissionPulse(mission: Mission): string {
  const insight = mission.aiInsights?.find((i) => i.type === 'summary');
  if (insight) return insight.content;

  return `${mission.name} is a ${mission.missionType} mission operated by ${mission.agency}, currently in ${mission.status.replace(/-/g, ' ')} status, exploring ${mission.destination}.`;
}
