(()=>{var e={};e.id=700,e.ids=[700],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},1577:(e,s,t)=>{"use strict";t.r(s),t.d(s,{patchFetch:()=>v,routeModule:()=>f,serverHooks:()=>b,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>g});var a={};t.r(a),t.d(a,{POST:()=>m});var i=t(2706),r=t(8203),n=t(5994),o=t(9187);let c={artemis:`**Artemis II** is NASA's first crewed mission to the vicinity of the Moon since 1972 — a critical test before humans land on the Moon again.

**What it's doing:** The four-person crew (Reid Wiseman, Victor Glover, Christina Koch, and Jeremy Hansen) will fly aboard Orion on a 10-day free-return trajectory around the Moon. The mission doesn't land — it validates every deep-space crewed system before Artemis III attempts the first lunar landing in over 50 years.

**Why it matters:** Artemis II is the final test before humans walk on the Moon again. It also marks the first Black astronaut and first Canadian to travel to lunar distance.

**Data confidence:** High — all information sourced from NASA public releases.`,perseverance:`**Perseverance** has been exploring Jezero Crater since February 2021, systematically investigating an ancient lake bed and river delta for signs of past microbial life.

**What it's doing now:** The rover is in its fourth science campaign, exploring the upper delta margin — a geologically diverse zone where ancient lake sediments meet older crater materials. It has collected over 20 carefully selected rock core samples for potential return to Earth.

**Why it matters:** Jezero Crater is one of the most promising places in the solar system to look for ancient life. If biosignatures exist in those cached samples and a sample-return mission succeeds, we could answer one of humanity's oldest questions.

**Data confidence:** High — location and activities sourced from NASA's Mars 2020 mission pages.`,curiosity:`**Curiosity** has been operating on Mars for over 12 years, exploring the sedimentary layers of Mt. Sharp (Aeolis Mons) in Gale Crater.

**What it's doing:** The rover is ascending Mt. Sharp's slopes, reading the layered rock record like chapters in a book. Each layer represents a different period of Martian climate history. Curiosity has already confirmed ancient habitable conditions and detected organic molecules.

**Key finding:** Gale Crater hosted a freshwater lake billions of years ago with chemical conditions favorable for life as we know it.

**Data confidence:** High — sourced from NASA JPL mission status updates.`,maven:`**MAVEN** has been studying Mars's upper atmosphere since 2014, investigating how the planet lost the thick atmosphere that once made it warm and wet.

**Key discovery:** MAVEN determined that the solar wind strips away 100 grams of Martian atmosphere per second — and that billions of years of this erosion removed most of Mars's original atmosphere, causing Mars to transition from a warm, potentially habitable world to the cold desert it is today.

**Current role:** In addition to atmospheric science, MAVEN now serves as a critical communication relay for surface missions including Curiosity and Perseverance.`,iss:`The **International Space Station** is humanity's continuously crewed laboratory in low Earth orbit, operated by an international partnership of NASA, Roscosmos, ESA, JAXA, and CSA.

**Current altitude:** ~408 km — low enough that Earth's thin upper atmosphere gradually drags it down, requiring periodic reboost maneuvers.

**What it does:** The ISS hosts rotating crews of typically 7 astronauts conducting hundreds of experiments in microgravity — from human physiology to materials science to fundamental physics that can't be done on Earth.

**Status:** The ISS has been continuously occupied since November 2, 2000 — over 24 years of uninterrupted human presence in space.`};class l{async generateResponse(e,s,t){await new Promise(e=>setTimeout(e,800+600*Math.random()));let a=[...e].reverse().find(e=>"user"===e.role)?.content.toLowerCase()||"",i=function(e){let s=[];if(e.selectedMission){let t=e.selectedMission;s.push(`SELECTED MISSION: ${t.name}`),s.push(`Agency: ${t.agency}`),s.push(`Destination: ${t.destination}`),s.push(`Status: ${t.status}`),s.push(`Type: ${t.missionType}`),s.push(`Description: ${t.description}`),s.push(`Objectives: ${t.objectives.join("; ")}`),t.currentPhase&&s.push(`Current Phase: ${t.currentPhase.name} — ${t.currentPhase.description}`),t.currentLocation&&s.push(`Current Location [${t.currentLocation.label}]: ${t.currentLocation.description}`),t.spacecraft.length>0&&s.push(`Spacecraft: ${t.spacecraft.map(e=>e.name).join(", ")}`),t.aiInsights&&t.aiInsights.length>0&&(s.push("\nCURATED INSIGHTS:"),t.aiInsights.forEach(e=>{s.push(`[${e.type.toUpperCase()}] ${e.content}`)}));let a=t.events.slice(-3);a.length>0&&(s.push("\nRECENT EVENTS:"),a.forEach(e=>{s.push(`- ${e.timestamp}: ${e.title} — ${e.description}`)}))}return e.selectedPlanet&&!e.selectedMission&&s.push(`SELECTED PLANET/DESTINATION: ${e.selectedPlanet}`),e.visibleMissions&&e.visibleMissions.length>0&&s.push(`
VISIBLE MISSIONS (${e.visibleMissions.length}): `+e.visibleMissions.map(e=>`${e.shortName||e.name} [${e.status}]`).join(", ")),s.join("\n")}(s);if(a.includes("artemis")||s.selectedMission?.id==="artemis-2")return c.artemis;if(a.includes("perseverance")||s.selectedMission?.id==="perseverance")return c.perseverance;if(a.includes("curiosity")||s.selectedMission?.id==="curiosity")return c.curiosity;if(a.includes("maven")||s.selectedMission?.id==="maven")return c.maven;if(a.includes("iss")||a.includes("space station")||s.selectedMission?.id==="iss")return c.iss;if(s.selectedMission){let e=s.selectedMission;return`Based on publicly available data for **${e.name}**:

${e.description}

**Current status:** ${e.status.replace(/-/g," ")} — ${e.currentPhase?.description||"See mission phases for details."}

**Agency:** ${e.agency}
**Destination:** ${e.destination.charAt(0).toUpperCase()+e.destination.slice(1)}

${e.aiInsights?.[0]?.content||""}

*Note: This response is based on curated public mission data. For real-time telemetry, consult the mission's official website.*`}return"mars"===s.selectedPlanet?`**Mars** currently hosts several active missions:

• **Perseverance** rover (NASA) — exploring Jezero Crater, caching samples
• **Curiosity** rover (NASA) — ascending Mt. Sharp in Gale Crater
• **MAVEN** orbiter (NASA) — atmospheric science and communications relay
• **MRO** (NASA) — high-resolution imaging and relay
• **Mars Express** (ESA) — ongoing atmospheric and radar science
• **TGO** (ESA) — trace gas detection, investigating the methane mystery

Mars is currently the most studied destination beyond Earth, with surface rovers, atmospheric orbiters, and plans for sample return and eventual crewed missions.`:"moon"===s.selectedPlanet?`**The Moon** is the focus of a new era of exploration:

• **LRO** (NASA) — 15+ years of detailed polar mapping
• **KPLO/Danuri** (KARI) — South Korea's first lunar orbiter with NASA's ShadowCam
• **Artemis II** (NASA) — crewed lunar flyby mission planned for 2025
• **Lunar Gateway** (NASA/ESA/JAXA/CSA) — planned orbital waystation

The Moon is the near-term focus of crewed exploration, with Artemis aiming to return humans to the surface for the first time since 1972.`:a.includes("data")||a.includes("source")||a.includes("know")?`ORBITAL displays three categories of information:

**OBSERVED** — Data directly obtained from public sources such as NASA, CelesTrak, SatNOGS, and ESA.

**DERIVED** — Values mathematically calculated from observed data (e.g., altitude derived from TLE orbital elements).

**AI** — Analysis, summaries, and insights generated by this application based on available public data.

Information not covered by public sources is not displayed. If you ask about specific telemetry that isn't publicly available, the system will say so explicitly rather than fabricate values.`:i?`Based on available public data:

${i.split("\n").slice(0,8).join("\n")}

*This response synthesizes information from NASA and other public space agencies. All information is sourced from public mission data.*`:`I can help you explore any of the missions in ORBITAL's catalog. Try selecting a mission from the catalog, or ask me about:

• **Mars missions** — "What's happening on Mars?"
• **Artemis** — "What is Artemis II doing?"
• **Rovers** — "What has Perseverance found?"
• **Data sources** — "How is data labeled here?"

All responses are based on publicly available mission information.`}}let d=(process.env.AI_PROVIDER,new l),u=`You are ORBITAL's AI Space Analyst — an expert in space missions, spacecraft, and planetary science.

You ONLY answer questions using information available in the provided mission data context.
You do NOT invent facts, telemetry values, or spacecraft status data.
When information is uncertain or unavailable, say: "Public data does not establish this."
You clearly distinguish between OBSERVED data (from public sources), DERIVED data (calculated), and AI interpretation.
Keep responses concise but substantive. Use markdown formatting for clarity.
You speak to curious, intelligent non-experts — make space exploration understandable without being condescending.`;async function p(e,s){return d.generateResponse(e,s,u)}var h=t(9164);async function m(e){try{let{messages:s,missionId:t,planet:a}=await e.json();if(!s||!Array.isArray(s))return o.NextResponse.json({error:"Invalid messages"},{status:400});let i={};if(t){let e=(0,h.P2)(t);e&&(i.selectedMission=e)}a&&(i.selectedPlanet=a);let r=await p(s,i);return o.NextResponse.json({content:r,role:"assistant",timestamp:new Date().toISOString()})}catch(e){return console.error("AI API error:",e),o.NextResponse.json({error:"Failed to generate response"},{status:500})}}let f=new i.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/ai/route",pathname:"/api/ai",filename:"route",bundlePath:"app/api/ai/route"},resolvedPagePath:"C:\\Users\\Ron\\Desktop\\COLLEJ\\misc\\IBM hacka_orbital_myidea\\orbital\\app\\api\\ai\\route.ts",nextConfigOutput:"",userland:a}),{workAsyncStorage:y,workUnitAsyncStorage:g,serverHooks:b}=f;function v(){return(0,n.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:g})}},6487:()=>{},8335:()=>{}};var s=require("../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),a=s.X(0,[989,452,164],()=>t(1577));module.exports=a})();