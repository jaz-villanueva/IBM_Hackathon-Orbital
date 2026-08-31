import { redirect } from 'next/navigation';

/**
 * The Satellite Explorer now lives inside the homepage's 3D scene (Earth Mode)
 * rather than as a standalone page — this route is kept as a stable, shareable
 * URL that redirects into that experience.
 */
export default function SatellitesRedirectPage() {
  redirect('/?planet=earth');
}
