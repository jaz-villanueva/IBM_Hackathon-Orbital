/**
 * Plain-language explanations for orbital/satellite concepts, used by
 * ExplainPopover and the /learn hub. Content only — no data or calculations.
 */

export interface Concept {
  id: string;
  title: string;
  short: string;
}

export const CONCEPTS: Concept[] = [
  {
    id: 'orbit',
    title: 'What is an orbit?',
    short: 'An orbit is a repeating path an object follows around a larger body due to gravity. A satellite in orbit is moving forward fast enough that as gravity pulls it down, the curve of the Earth falls away beneath it at the same rate — so it keeps "falling around" the planet instead of into it.',
  },
  {
    id: 'altitude',
    title: 'What is altitude?',
    short: 'Altitude is the distance between the satellite and Earth\'s surface (not the distance to Earth\'s center). Low Earth orbit satellites like the ISS orbit a few hundred kilometers up; geostationary satellites orbit about 35,786 km up.',
  },
  {
    id: 'velocity',
    title: 'What is orbital velocity?',
    short: 'Orbital velocity is how fast a satellite must travel to stay in a stable orbit at a given altitude. Lower orbits require higher speeds — the ISS travels at roughly 7.7 km/s (about 27,600 km/h) to maintain its orbit.',
  },
  {
    id: 'inclination',
    title: 'What is inclination?',
    short: 'Inclination is the tilt of a satellite\'s orbital plane relative to Earth\'s equator, in degrees. A 0° inclination orbits directly above the equator; a 90° (polar) orbit passes near both poles. Inclination roughly bounds how far north and south a satellite\'s ground track reaches.',
  },
  {
    id: 'ground-track',
    title: 'What is a ground track?',
    short: 'A ground track is the path traced on Earth\'s surface directly beneath a satellite as it orbits. Because Earth rotates while the satellite\'s orbital plane stays roughly fixed in space, successive ground tracks shift westward on each pass, producing the characteristic sinusoidal (S-shaped) pattern seen on ground-track maps.',
  },
  {
    id: 'tle',
    title: 'What is a TLE?',
    short: 'A Two-Line Element set (TLE) — or its modern successor, GP (General Perturbations) data — is a compact, standardized description of a satellite\'s orbit at a specific moment (epoch), published by organizations like CelesTrak. It\'s the raw input used to calculate where a satellite is and will be.',
  },
  {
    id: 'tracking',
    title: 'How are satellites tracked?',
    short: 'Satellites are tracked from the ground using radar and optical observations, which produce orbital element sets (like TLEs/GP data). Anyone can then mathematically propagate those elements forward in time to estimate a satellite\'s position — this is exactly what Orbital does.',
  },
  {
    id: 'ground-station',
    title: 'What is a ground station?',
    short: 'A ground station is a radio antenna on Earth that sends commands to, or listens for signals from, satellites as they pass overhead. Networks of volunteer-operated ground stations (like SatNOGS) share their observations publicly.',
  },
  {
    id: 'signal',
    title: 'How do satellites communicate with Earth?',
    short: 'Satellites transmit radio signals at specific frequencies, using specific modulation schemes, that ground stations can receive and decode. Signal strength (measured in dBm) indicates how strong the received signal was — weaker (more negative) values mean a fainter signal.',
  },
];

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
