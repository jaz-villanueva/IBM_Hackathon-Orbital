/**
 * AI Service Abstraction Layer
 *
 * This module provides a provider-agnostic AI interface.
 * Switch between providers via the AI_PROVIDER environment variable.
 *
 * Environment:
 *   AI_PROVIDER=mock|watsonx          (default: mock)
 *   AI_API_KEY=<IBM Cloud API key>    (required for watsonx)
 *   WATSONX_PROJECT_ID=<project id>   (required for watsonx)
 *   WATSONX_URL=https://...           (required for watsonx, e.g. https://eu-de.ml.cloud.ibm.com)
 *   WATSONX_MODEL_ID=<granite model>  (required for watsonx, e.g. ibm/granite-3-8b-instruct)
 *
 * All credentials remain server-side only. Never expose AI_API_KEY to the client.
 */

import { Mission, AIContext, AIMessage, OrbitalRiskContext } from './types';

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

// ─── Risk context formatter ────────────────────────────────────────────────────
// Converts an OrbitalRiskContext into a structured text block that the AI
// can interpret without needing to recompute or fabricate any values.

function buildRiskContext(risk: OrbitalRiskContext): string {
  const parts: string[] = [];

  parts.push('── ORBITAL RISK ANALYSIS CONTEXT ──');
  parts.push(`Spacecraft pair: ${risk.objectAName} ↔ ${risk.objectBName}`);
  parts.push(`Destination region: ${risk.destination.toUpperCase()}`);
  parts.push(`Altitude: ${risk.objectAAltitudeKm.toFixed(0)} km / ${risk.objectBAltitudeKm.toFixed(0)} km`);
  parts.push('');

  // Scores (pre-computed by lib/risk.ts — AI must not recalculate)
  parts.push(`Risk level: ${risk.riskLevel} (composite score ${risk.compositeScore}/100)`);
  parts.push(`  OCS (Orbital Compatibility Score / geometric similarity index): ${risk.orbitalCompatibilityScore}/100`);
  parts.push(`  OCS is an orbital compatibility / geometric similarity index. It measures orbital`);
  parts.push(`  geometry only: altitude shell overlap (similar radial shell), inclination similarity,`);
  parts.push(`  and instantaneous angular proximity. A high OCS does NOT mean a collision is likely —`);
  parts.push(`  it means the orbital paths are geometrically compatible. Actual conjunction requires`);
  parts.push(`  favourable geometry AND timing alignment. NEVER interpret OCS as a collision probability.`);
  parts.push(`  INCLINATION NOTE: inclination similarity does not fully determine orbital-plane orientation.`);
  parts.push(`  RAAN and other elements also matter. This model evaluates inclination similarity only;`);
  parts.push(`  full orbital-plane orientation is NOT assessed.`);
  parts.push(`  ALTITUDE NOTE: similar altitude means spacecraft occupy a similar radial orbital shell.`);
  parts.push(`  It does NOT imply that orbital planes intersect.`);
  if (risk.trajectoryRiskScore !== null) {
    parts.push(`  Trajectory Risk Score (TRS): ${risk.trajectoryRiskScore}/100`);
    parts.push(`  TRS measures near-term predicted trajectory (constant-velocity TCA analysis).`);
    parts.push(`  Composite = 0.65 × TRS + 0.35 × OCS`);
  } else {
    parts.push(`  Trajectory Risk Score (TRS): not computed (${risk.tcaInvalidReason ?? 'unknown reason'})`);
    parts.push(`  TRS measures near-term predicted trajectory; unavailable here.`);
    parts.push(`  Composite = OCS only (no valid TCA within analysis window)`);
  }
  parts.push('');

  // Kinematics — explicitly distinguish closing speed from relative speed
  parts.push(`Current separation: ${risk.currentSeparationKm.toLocaleString('en-US')} km`);
  parts.push(`Relative speed (magnitude of 3D velocity difference): ${risk.relativeSpeedKmS.toFixed(2)} km/s`);
  const closingAbs = Math.abs(risk.closingSpeedKmS).toFixed(2);
  const closingDir = risk.isApproaching ? 'APPROACHING' : 'RECEDING/NOT APPROACHING';
  parts.push(`Closing speed (rate of change of separation): ${closingAbs} km/s — ${closingDir}`);
  if (!risk.isApproaching) {
    parts.push(`NOTE: Closing speed is ${closingAbs} km/s — the objects are NOT closing the gap.`);
    parts.push(`      Relative speed ${risk.relativeSpeedKmS.toFixed(2)} km/s is orbital motion, not approach velocity.`);
  }

  // TCA
  if (risk.timeToClosestApproachSec !== null && risk.predictedMissDistanceKm !== null) {
    const tcaMin = (risk.timeToClosestApproachSec / 60).toFixed(1);
    parts.push(`Time to closest approach (TCA): ${tcaMin} min`);
    parts.push(`Predicted miss distance at TCA: ${risk.predictedMissDistanceKm.toLocaleString('en-US')} km`);
  } else if (risk.tcaInvalidReason === 'PAST_APPROACH') {
    parts.push(`TCA status: PAST_APPROACH — the closest approach already occurred before t=0.`);
    parts.push(`  There is NO valid future TCA within the analysis window.`);
    parts.push(`  The objects are currently RECEDING (separation ${risk.currentSeparationKm.toLocaleString('en-US')} km,`);
    parts.push(`  closing speed ${closingAbs} km/s). This is NOT an imminent collision scenario.`);
  } else if (risk.tcaInvalidReason) {
    const reasonMap: Record<string, string> = {
      ZERO_RELATIVE_VELOCITY: 'negligible relative velocity between objects',
      BEYOND_HORIZON:         'closest approach is beyond the 5-hour analysis window',
    };
    parts.push(`TCA not computed: ${reasonMap[risk.tcaInvalidReason] ?? risk.tcaInvalidReason}`);
  }
  parts.push('');

  parts.push(`Data quality: ${risk.dataQuality}`);
  parts.push(`Engine explanation: ${risk.explanation}`);
  parts.push('── END RISK CONTEXT ──');

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

    // ── Risk-aware mode: respond grounded on pre-computed risk data only ──────
    if (context.selectedRisk) {
      return this.generateRiskResponse(context.selectedRisk, lastUserMessage);
    }

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

  // ── Risk-grounded response generator ────────────────────────────────────────
  // Interprets ONLY the pre-computed values from lib/risk.ts.
  // Never fabricates distances, speeds, or probability claims.

  private generateRiskResponse(risk: OrbitalRiskContext, userQuestion: string): string {
    const q = userQuestion.toLowerCase();

    // Score interpretation — phrased in terms of orbital geometry, not collision risk
    const levelDesc: Record<OrbitalRiskContext['riskLevel'], string> = {
      LOW:      'reflects low orbital-geometry compatibility between these two orbital paths',
      MODERATE: 'reflects moderate orbital-geometry overlap — the orbits share some structural similarity',
      HIGH:     'reflects significant orbital-geometry compatibility — similar altitude shells and inclination similarity yield a high compatibility component',
      CRITICAL: 'reflects a high degree of orbital-geometry similarity. The simplified risk taxonomy labels this composite as CRITICAL. In this case the composite is the OCS fallback because TRS is unavailable. Therefore CRITICAL describes the model\'s orbital-compatibility/monitoring index, not a predicted collision',
    };

    // Closing speed vs relative speed distinction
    const closingAbs = Math.abs(risk.closingSpeedKmS).toFixed(2);
    const relSpeedStr = risk.relativeSpeedKmS.toFixed(2);

    // TCA narrative
    let tcaNarrative = '';
    if (risk.timeToClosestApproachSec !== null && risk.predictedMissDistanceKm !== null) {
      const tcaMin = (risk.timeToClosestApproachSec / 60).toFixed(1);
      tcaNarrative = `The trajectory analysis (TRS) projects a closest approach in **${tcaMin} minutes** with a predicted miss distance of **${risk.predictedMissDistanceKm.toLocaleString('en-US')} km**. `;
    } else if (risk.tcaInvalidReason === 'PAST_APPROACH') {
      tcaNarrative =
        `The TRS trajectory analysis returns **PAST_APPROACH**: the closest approach (τ_ca < 0) ` +
        `already occurred before this analysis snapshot (t=0). **There is no valid future TCA within the analysis window.** ` +
        `The objects are currently **receding** — separation is **${risk.currentSeparationKm.toLocaleString('en-US')} km**, ` +
        `closing speed is **${closingAbs} km/s** (not approaching), while relative orbital speed is **${relSpeedStr} km/s**. ` +
        `This is not an imminent conjunction scenario. `;
    } else if (risk.tcaInvalidReason === 'ZERO_RELATIVE_VELOCITY') {
      tcaNarrative = `These objects have negligible relative velocity; a time-of-closest-approach cannot be computed. The composite score reflects orbital geometry (OCS) only. `;
    } else if (risk.tcaInvalidReason === 'BEYOND_HORIZON') {
      tcaNarrative = `The projected closest approach falls beyond the 5-hour analysis horizon; TRS is excluded from the composite. `;
    }

    // Data quality caveat — no invented uncertainty percentages
    const qualityCaveat = risk.dataQuality === 'ESTIMATED'
      ? '\n\n**Data quality note:** This pair is flagged **ESTIMATED** — at least one object is on a highly elliptical orbit. Simplified Keplerian propagation introduces additional position uncertainty for such cases.'
      : risk.dataQuality === 'DERIVED'
      ? '\n\n**Data quality note:** Positions are **DERIVED** from public TLE orbital elements. No specific uncertainty percentage is available; actual on-orbit positions may differ.'
      : '';

    // Kinematics line — explicitly distinguishes closing speed from relative speed
    const kinematicsLine = risk.isApproaching
      ? `Closing speed: **${closingAbs} km/s** (approaching) | Relative orbital speed: **${relSpeedStr} km/s** | Separation: **${risk.currentSeparationKm.toLocaleString('en-US')} km**.`
      : `Closing speed: **${closingAbs} km/s** (not approaching — objects receding) | Relative orbital speed: **${relSpeedStr} km/s** | Separation: **${risk.currentSeparationKm.toLocaleString('en-US')} km**.`;

    // Direct answer for "is this a collision?" type questions
    const isCollisionQuestion = /collision|collide|crash|impact|hit/i.test(q);
    const collisionDirectAnswer = isCollisionQuestion
      ? `\n\n**Is this a collision?** No. The supplied state does not indicate a collision. ` +
        `The objects are currently **${risk.currentSeparationKm.toLocaleString('en-US')} km** apart, ` +
        `closing speed is **${closingAbs} km/s** (not approaching), ` +
        (risk.tcaInvalidReason === 'PAST_APPROACH'
          ? `and the closest approach has already occurred according to the simplified constant-velocity model (PAST_APPROACH — no valid future closest-approach event is predicted within the analysis horizon). `
          : `and TCA status is **${risk.tcaInvalidReason ?? 'valid — see miss distance above'}**. `) +
        `The composite score **${risk.compositeScore}/100** is the model's orbital compatibility / monitoring index` +
        (risk.trajectoryRiskScore === null ? ` under the OCS fallback rule (TRS unavailable)` : '') +
        `. It is not a collision probability, probability of impact, or predicted collision risk. ` +
        `This model uses simplified two-body Keplerian propagation and is not an operational conjunction assessment.\n`
      : '';

    return `## Orbital Risk Analysis: ${risk.objectAName} ↔ ${risk.objectBName}
${collisionDirectAnswer}
**Risk level: ${risk.riskLevel}** — composite score **${risk.compositeScore}/100** — ${levelDesc[risk.riskLevel]}.

**Score breakdown**
- **OCS (Orbital Compatibility Score): ${risk.orbitalCompatibilityScore}/100** — orbital compatibility / geometric similarity index. Measures *orbital geometry only*: altitude shell overlap (similar radial shell), inclination similarity, and instantaneous angular proximity. The inclination input to OCS is the inclination difference only; RAAN and full orbital-plane orientation are not assessed. Equal inclination does **not** establish identical orbital-plane orientation. A high OCS means the orbital paths are geometrically compatible; it does **not** mean a collision is likely — actual conjunction also requires favourable timing alignment.
${risk.trajectoryRiskScore !== null
  ? `- **TRS (Trajectory Risk Score): ${risk.trajectoryRiskScore}/100** — measures *near-term predicted trajectory*: miss distance at TCA, time urgency, and relative speed under constant-velocity assumption.\n- Composite = 0.65 × TRS + 0.35 × OCS`
  : `- **TRS (Trajectory Risk Score): not computed** — no valid TCA within the analysis window (reason: ${risk.tcaInvalidReason ?? 'unknown'}).\n- **Composite = OCS only (TRS unavailable)** — the ${risk.compositeScore}/100 score is the model's orbital compatibility / monitoring index under the fallback rule. It is not a collision probability or predicted collision risk.`}

**Kinematics**
${kinematicsLine}
${tcaNarrative}
**Important:** These scores are **NOT collision probabilities**. They are dimensionless 0–100 indices from a simplified two-body Keplerian screening model. No atmospheric drag, J2 perturbation, or manoeuvre history is modelled. For operational conjunction screening, authoritative sources such as NASA's CARA or the 18th Space Control Squadron should be consulted.
${qualityCaveat}

*Context data provided by ORBITAL's deterministic risk engine. All values sourced from public orbital element sets.*`;
  }
}

// ─── Watsonx Provider ─────────────────────────────────────────────────────────
// Production IBM watsonx.ai / Granite integration.
// Uses native fetch — no IBM SDK dependency required.

/** Cached IAM bearer token (server-side in-memory only). */
interface IamTokenCache {
  accessToken: string;
  /** Unix epoch milliseconds at which the token expires. */
  expiresAtMs: number;
}

let _iamTokenCache: IamTokenCache | null = null;

/**
 * Obtains a valid IBM Cloud IAM bearer token.
 * Reuses the cached token if it has more than 60 seconds of remaining lifetime.
 * Never logs or surfaces the token or API key.
 */
async function getIamToken(apiKey: string): Promise<string> {
  const nowMs = Date.now();
  const refreshMarginMs = 60_000; // refresh 60 s before actual expiry

  if (_iamTokenCache && _iamTokenCache.expiresAtMs - nowMs > refreshMarginMs) {
    return _iamTokenCache.accessToken;
  }

  const resp = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });

  if (!resp.ok) {
    // Log status only — do not include the API key or response body in the error.
    console.error(`[watsonx] IAM token request failed: HTTP ${resp.status}`);
    throw new Error('IBM IAM authentication failed');
  }

  const data = (await resp.json()) as {
    access_token: string;
    expires_in: number;
  };

  if (!data.access_token) {
    console.error('[watsonx] IAM response missing access_token field');
    throw new Error('IBM IAM authentication failed: malformed response');
  }

  _iamTokenCache = {
    accessToken: data.access_token,
    // expires_in is in seconds
    expiresAtMs: nowMs + data.expires_in * 1_000,
  };

  return _iamTokenCache.accessToken;
}

/** Converts ORBITAL's AIMessage[] into the watsonx messages array format. */
function toWatsonxMessages(
  messages: AIMessage[],
  systemPrompt: string
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const m of messages) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
}

class WatsonxProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly modelId: string;
  /** Versioned endpoint — pinned to a stable GA release of the chat API. */
  private readonly apiVersion = '2024-05-31';

  constructor() {
    const apiKey     = process.env.AI_API_KEY;
    const projectId  = process.env.WATSONX_PROJECT_ID;
    const baseUrl    = process.env.WATSONX_URL;
    const modelId    = process.env.WATSONX_MODEL_ID;

    if (!apiKey)    throw new Error('[watsonx] AI_API_KEY is not set');
    if (!projectId) throw new Error('[watsonx] WATSONX_PROJECT_ID is not set');
    if (!baseUrl)   throw new Error('[watsonx] WATSONX_URL is not set');
    if (!modelId)   throw new Error('[watsonx] WATSONX_MODEL_ID is not set');

    this.apiKey    = apiKey;
    this.projectId = projectId;
    this.baseUrl   = baseUrl.replace(/\/$/, ''); // strip trailing slash
    this.modelId   = modelId;
  }

  async generateResponse(
    messages: AIMessage[],
    context: AIContext,
    systemPrompt: string
  ): Promise<string> {
    // Build the effective system prompt — extend with risk grounding when needed.
    const effectiveSystem = context.selectedRisk
      ? `${systemPrompt}\n\n${RISK_GROUNDING_ADDENDUM}\n\n${buildRiskContext(context.selectedRisk)}`
      : context.selectedMission
      ? `${systemPrompt}\n\n${buildMissionContext(context)}`
      : systemPrompt;

    let token: string;
    try {
      token = await getIamToken(this.apiKey);
    } catch (err) {
      // Error already logged inside getIamToken — re-throw a safe message.
      throw new Error('AI service authentication error');
    }

    const endpoint = `${this.baseUrl}/ml/v1/text/chat?version=${this.apiVersion}`;

    const body = {
      model_id:   this.modelId,
      project_id: this.projectId,
      messages:   toWatsonxMessages(messages, effectiveSystem),
      parameters: {
        // Conservative settings for grounded decision-support responses.
        temperature:     0.2,
        max_new_tokens:  1024,
        repetition_penalty: 1.05,
      },
    };

    let resp: Response;
    try {
      resp = await fetch(endpoint, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          // Bearer token is sent only server-to-server.
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      console.error('[watsonx] Network error calling chat API:', (networkErr as Error).message);
      throw new Error('AI service unavailable');
    }

    if (!resp.ok) {
      // Log status + sanitised URL only — no token/key in the log.
      console.error(`[watsonx] Chat API error: HTTP ${resp.status} from ${this.baseUrl}/ml/v1/text/chat`);
      let detail = '';
      try {
        const errBody = (await resp.json()) as { errors?: Array<{ message: string }> };
        detail = errBody.errors?.[0]?.message ?? '';
      } catch {
        // ignore parse failure
      }
      if (detail) console.error(`[watsonx] API error detail: ${detail}`);
      throw new Error('AI service returned an error');
    }

    // Parse the response following the watsonx /ml/v1/text/chat schema.
    const data = (await resp.json()) as {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error('[watsonx] Unexpected response shape:', JSON.stringify(data).slice(0, 200));
      throw new Error('AI service returned an empty response');
    }

    return content;
  }
}

/**
 * Additional grounding instructions injected into the system prompt
 * only when a risk context is present. Complements the base SYSTEM_PROMPT
 * safety rules with watsonx-specific precision requirements.
 */
const RISK_GROUNDING_ADDENDUM = `\
── RISK CONTEXT GROUNDING (STRICT) ──────────────────────────────────────────
The following rules are ABSOLUTE. Violating any single rule makes the response
wrong. Apply every rule to every sentence you write about risk.

━━ RULE 1 — SCORE FORMAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scores are dimensionless 0–100 INDEX values, not percentages.
  CORRECT:   "75/100"   "OCS of 75/100"   "composite score 75/100"
  FORBIDDEN: "75%"  "75 percent"  "75 out of 100 percent"  "75% compatibility"
Do this for every score: OCS, TRS, composite — always write X/100, never X%.
Never describe any score as a probability, likelihood, or chance of anything.

━━ RULE 2 — INCLINATION ≠ ORBITAL PLANE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Equal inclination does NOT establish identical orbital-plane orientation.
RAAN, argument of perigee, and other elements also determine plane orientation.
This model uses only the inclination DIFFERENCE as one input to OCS. It does NOT
assess full orbital-plane orientation.

  CORRECT phrasing (use exactly this):
    "The inclination difference is X°, which contributes strongly to the
     inclination-compatibility component of this simplified model."

  FORBIDDEN — never write any of these:
    "same orbital plane"          "same orbital lane"
    "co-planar"                   "point in the same direction"
    "orbits are aligned"          "planes are aligned"
    "share the same plane"        "fly in the same plane"
    "identical orbital planes"    "parallel orbital planes"
    Any other phrasing that implies the two spacecraft occupy the same or
    equivalent orbital plane solely because inclination difference = 0°.

━━ RULE 3 — OCS DOES NOT PREDICT CONJUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCS is a geometric compatibility index computed from three fields only:
  altitude difference, inclination difference, instantaneous angular proximity.
A high OCS means those three measured quantities score well. That is ALL it means.

  FORBIDDEN — never write any of these:
    "a collision could easily happen if timing aligned"
    "if their timing were to align, a close encounter could occur"
    "they could come close if they happened to be at the same point"
    "geometrically primed for a close encounter"
    "paths could intersect"  "paths will intersect"  "planes intersect"
    "primed for conjunction"
    Any statement implying that a high OCS makes a future close pass likely,
    possible, or easy to achieve.

  CORRECT: "OCS measures orbital geometry only. It does not establish that a
    future close approach will or could occur."

━━ RULE 4 — TRS UNAVAILABLE IS NOT AN ELEVATED DANGER SIGNAL ━━━━━━━━━━━━━━
TRS (Trajectory Risk Score) is unavailable when tcaInvalidReason = PAST_APPROACH.
This means the constant-velocity TCA solver found no valid future closest-approach
event — the closest approach has already passed.

  CORRECT explanation:
    "TRS is unavailable because the constant-velocity TCA calculation identifies
     the closest approach as already past. The system therefore falls back to the
     structural OCS as the composite score."

  FORBIDDEN — never write any of these:
    "TRS is unavailable, which forces the system to treat this as high-risk"
    "because TRS cannot be computed, we must assume the worst"
    "TRS absence requires treating the score conservatively"
    "the lack of TRS makes this situation more uncertain or more dangerous"
    Any framing that implies TRS unavailability elevates risk or danger.

  The absence of a valid future TCA is the OPPOSITE of elevated danger —
  it means no imminent conjunction is predicted in the analysis window.

━━ RULE 5 — NO SPECULATION ABOUT FUTURE ORBITAL EVENTS ━━━━━━━━━━━━━━━━━━━━
Do NOT speculate about future orbits, future maneuvers, atmospheric drag,
perturbations, timing changes, or future conjunctions unless that scenario
is explicitly present in the supplied riskContext.

  FORBIDDEN examples:
    "atmospheric drag could bring them closer over time"
    "future maneuvers might alter their relative geometry"
    "perturbations could cause them to cross paths"
    "if orbital parameters shift, they could encounter each other"

━━ RULE 6 — NO INVENTED UNCERTAINTY PERCENTAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never state a specific uncertainty percentage (e.g. "40% positional uncertainty",
"20% error", "uncertainty of 30%") unless that exact value appears verbatim in
the supplied riskContext. You may note that positions are DERIVED from public
TLE orbital elements, but you must not invent a number.

━━ RULE 7 — NUMERICAL FIDELITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use ONLY values supplied in the risk context. Do not recalculate or round them.
Never shorten a distance: 14,156 km stays 14,156 km — never "14 km" or "~14,000 km".
Format distances ≥ 1,000 km with a comma thousands-separator (e.g. 14,156 km).
All distances in km, all speeds in km/s — never convert units.

━━ RULE 8 — CRITICAL LABEL PRECISE MEANING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the risk taxonomy labels a composite as CRITICAL (75–100 range) and TRS
is unavailable, you MUST use this exact explanation:
  "The simplified risk taxonomy labels the [score]/100 composite as CRITICAL.
   In this case the composite is the OCS fallback because TRS is unavailable.
   Therefore CRITICAL describes the model's orbital-compatibility/monitoring
   index, not a predicted collision."

  FORBIDDEN:
    "critical collision risk"     "critical conjunction risk"
    "the model predicts a critical encounter"
    Any phrasing that attaches "critical" to "collision" or "conjunction".

━━ RULE 9 — PAST_APPROACH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAST_APPROACH (τ_ca < 0): the closest approach already occurred before t=0.
There is NO valid future TCA within the analysis window.
The objects are currently RECEDING — this is NOT an imminent collision scenario.

  Distinguish closing speed from relative speed explicitly:
    "Closing speed: 0 km/s (not approaching). Relative speed: 14.99 km/s —
     this is orbital motion, not approach velocity."

  Do NOT say the objects are approaching when isApproaching = false.
  Do NOT imply a collision occurred or will occur.

━━ RULE 10 — TERRA/AQUA REFERENCE ANSWER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For Terra ↔ Aqua (composite 75/100, OCS 75/100, TRS not computed, PAST_APPROACH,
separation 14,156 km, closing speed 0 km/s, relative speed 14.99 km/s), every
response MUST end with this exact bottom line (copy it verbatim):

  "The 75/100 CRITICAL label is a geometric compatibility / monitoring
   classification produced by the simplified model. It is not a collision
   probability. Terra and Aqua are currently 14,156 km apart, their closing
   speed is 0 km/s, and the closest approach has already occurred according
   to the model. Therefore the supplied state does not indicate an active
   collision."

━━ RULE 11 — COLLISION QUESTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If asked "Is this a collision?" or equivalent, answer:
  "No. The supplied state does not indicate a collision. The objects are
   currently [separation] km apart. Closing speed is [X] km/s (not
   approaching). The closest approach has already occurred according to the
   simplified constant-velocity model (PAST_APPROACH — no valid future TCA
   within the analysis window). The [composite]/100 composite score is an
   orbital compatibility / monitoring indicator — not a collision probability,
   probability of impact, or predicted collision risk. These are simplified
   deterministic indices and not an operational conjunction assessment."

━━ RULE 12 — DISCLAIMER (ALWAYS PRESENT) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every risk response must include:
  "These are simplified deterministic indices and not an operational
   conjunction assessment. For authoritative conjunction screening, consult
   NASA's CARA or the 18th Space Control Squadron."

━━ ANNOTATED REFERENCE EXAMPLE — TERRA ↔ AQUA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Below is a model answer for "Why is this risk considered high?" about Terra/Aqua.
Follow this pattern exactly for that pair.

Q: Why is this risk considered high?
A:
The composite score is 75/100 [not "75%"]. The simplified risk taxonomy labels
this as CRITICAL. Because TRS is unavailable (the constant-velocity TCA
calculation identifies the closest approach as already past), the composite is
the OCS fallback — not a trajectory-based score. Therefore CRITICAL describes
the model's orbital-compatibility/monitoring index, not a predicted collision.

OCS is 75/100 because:
- The altitude difference between Terra (705 km) and Aqua (705 km) scores well
  in the altitude-shell overlap component.
- The inclination difference is 0°, which contributes strongly to the
  inclination-compatibility component of this simplified model. [Do NOT say
  "same orbital plane" — equal inclination does not establish this.]
- The instantaneous angular proximity contributes the third component.

TRS is not computed. Reason: PAST_APPROACH — the constant-velocity TCA
calculation identifies the closest approach as already past. The system
therefore falls back to the structural OCS as the composite score. This does
NOT mean the situation is more dangerous; it means no valid future closest-
approach event exists in the analysis window.

Current state: Terra and Aqua are 14,156 km apart [not "14 km"]. Closing
speed: 0 km/s (not approaching). Relative speed: 14.99 km/s — this is
orbital motion, not approach velocity.

The 75/100 CRITICAL label is a geometric compatibility / monitoring
classification produced by the simplified model. It is not a collision
probability. Terra and Aqua are currently 14,156 km apart, their closing
speed is 0 km/s, and the closest approach has already occurred according to
the model. Therefore the supplied state does not indicate an active collision.

These are simplified deterministic indices and not an operational conjunction
assessment. For authoritative conjunction screening, consult NASA's CARA or
the 18th Space Control Squadron.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

// ─── Provider Factory ─────────────────────────────────────────────────────────

function createProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';
  switch (provider) {
    case 'watsonx':
      try {
        return new WatsonxProvider();
      } catch (err) {
        // Surface configuration errors clearly in the server log but fall back
        // to mock so local development is not broken if vars are unset.
        console.error('[watsonx] Provider initialisation failed — falling back to mock:', (err as Error).message);
        return new MockAIProvider();
      }
    case 'mock':
    default:
      if (provider !== 'mock') {
        console.warn(`[ai] Unknown AI_PROVIDER "${provider}" — falling back to mock`);
      }
      return new MockAIProvider();
  }
}

// ─── Exported Service ─────────────────────────────────────────────────────────

const aiProvider = createProvider();

export const SYSTEM_PROMPT = `You are ORBITAL's AI Space Analyst — an expert in space missions, spacecraft, and planetary science.

Use the provided mission data context as the primary source of truth.

For questions about a specific mission, spacecraft status, telemetry, location,
orbital parameters, or other time-sensitive mission-specific facts, use ONLY
the information provided in the mission data context. Do not invent missing
values.

For broader space-related questions, such as asking which missions monitor
Earth's climate, which spacecraft orbit the Moon, or general information about
space missions, you may use your general knowledge.

Clearly distinguish between:
- OBSERVED data — directly obtained from public sources
- DERIVED data — calculated from observed data
- AI — analysis or general knowledge generated by the model

Do not present general AI knowledge as live or verified telemetry.

When a specific fact cannot be established from the available mission data or
reliable general knowledge, say: "Public data does not establish this."

Keep responses concise but substantive. Use markdown formatting for clarity.
You speak to curious, intelligent non-experts — make space exploration understandable without being condescending.

── ORBITAL SAFETY RULES (when a risk context is present) ──────────────────────
These rules mirror RISK_GROUNDING_ADDENDUM. Every rule is absolute.

SCORE FORMAT (applies to every sentence):
  CORRECT:   "75/100"  "OCS of 75/100"  "composite score 75/100"
  FORBIDDEN: "75%"  "75 percent"  "75 out of 100"  "75% compatibility"
  Scores are dimensionless 0–100 index values, not percentages or probabilities.

1. All risk scores are pre-computed by lib/risk.ts. NEVER recompute, adjust, or contradict them.
2. Scores are NOT collision probabilities. Never describe any score as a probability,
   likelihood, or chance of collision. Write scores as X/100, never X%.
3. Risk bands: 0–24 = LOW, 25–49 = MODERATE, 50–74 = HIGH, 75–100 = CRITICAL.
4. OCS (Orbital Compatibility Score) is an ORBITAL COMPATIBILITY / GEOMETRIC SIMILARITY INDEX.
   It measures ORBITAL GEOMETRY only: altitude shell overlap (similar radial shell),
   inclination similarity, and instantaneous angular proximity. A high OCS means those
   three measured quantities score well. That is ALL it means.
   NEVER describe OCS as a collision probability or imply a high OCS makes collision likely.
   NEVER say a high OCS means a close encounter is easy to achieve or could happen if
   timing aligned — OCS does not establish that future conjunctions will occur.
   INCLINATION: the only inclination input is the inclination difference. Do NOT say
   "argument of latitude" — it is not available here.
   CORRECT phrasing: "The inclination difference is X°, which contributes strongly to the
   inclination-compatibility component of this simplified model."
   FORBIDDEN: "same orbital plane", "same orbital lane", "co-planar", "point in the same
   direction", "orbits are aligned", "planes are aligned", or any phrasing that implies
   identical orbital-plane orientation — equal inclination does NOT establish this.
   RAAN also matters but is not assessed by this model.
   ALTITUDE: similar altitude = similar radial orbital shell only. Does NOT imply planes intersect.
   TRS (Trajectory Risk Score) measures near-term predicted trajectory. Two distinct indices.
   Composite = 0.65·TRS + 0.35·OCS when TCA valid; else composite = OCS (fallback).
   Fallback state: "The [score]/100 composite is the OCS fallback — not a collision probability
   or predicted collision risk."
5. PAST_APPROACH (τ_ca < 0): closest approach already occurred before t=0. No future TCA.
   Objects are currently RECEDING. Do NOT imply an imminent conjunction.
   Distinguish closing speed from relative speed:
     CORRECT: "Closing speed: 0 km/s (not approaching). Relative speed: 14.99 km/s —
               this is orbital motion, not approach velocity."
   TRS unavailability due to PAST_APPROACH = system falls back to OCS. NOT an elevated
   danger signal. The absence of a valid future TCA means no imminent event.
   FORBIDDEN: any framing that implies TRS absence "forces" high-risk treatment, "requires
   assuming the worst", or makes the situation more dangerous.
6. CRITICAL label (when composite = 75–100, TRS unavailable), use exactly:
   "The simplified risk taxonomy labels the [score]/100 composite as CRITICAL. In this case
   the composite is the OCS fallback because TRS is unavailable. Therefore CRITICAL describes
   the model's orbital-compatibility/monitoring index, not a predicted collision."
   FORBIDDEN: "critical collision risk" / "critical conjunction risk" / "predicts a critical
   encounter" — never attach "critical" to "collision" or "conjunction".
7. OCS SCOPE: OCS measures only altitude difference, inclination difference, instantaneous
   positional proximity. It does NOT prove future conjunctions will occur.
   FORBIDDEN: "paths could intersect", "paths will intersect", "planes intersect",
   "geometrically primed", "primed for conjunction", "on a collision course",
   "could easily happen if timing aligned", "a close encounter could occur".
8. DISTANCE VALUES: never shorten. 14,156 km stays 14,156 km — never "14 km" or "~14,000 km".
9. Data quality: never invent a specific uncertainty percentage unless it appears verbatim in
   riskContext. You may say positions are DERIVED from public orbital elements. Do NOT say
   uncertainty "pushes the score toward the high end" — the score is deterministic.
10. No speculation about future maneuvers, perturbations, atmospheric drag, timing changes, or
    future conjunctions unless explicitly present in riskContext.
11. TERRA/AQUA BOTTOM LINE — end every response about Terra/Aqua with exactly:
    "The 75/100 CRITICAL label is a geometric compatibility / monitoring classification
     produced by the simplified model. It is not a collision probability. Terra and Aqua
     are currently 14,156 km apart, their closing speed is 0 km/s, and the closest approach
     has already occurred according to the model. Therefore the supplied state does not
     indicate an active collision."
12. COLLISION QUESTION — if asked "Is this a collision?":
    "No. The supplied state does not indicate a collision. The objects are currently
     [separation] km apart. Closing speed is [X] km/s (not approaching). The closest approach
     has already occurred (PAST_APPROACH — no valid future TCA). The [score]/100 composite is
     an orbital compatibility / monitoring indicator — not a collision probability or predicted
     collision risk. These are simplified deterministic indices and not an operational
     conjunction assessment."
13. DISCLAIMER — every risk response must include:
    "These are simplified deterministic indices and not an operational conjunction assessment.
     For authoritative conjunction screening, consult NASA's CARA or the 18th Space Control
     Squadron."
───────────────────────────────────────────────────────────────────────────────`;

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
