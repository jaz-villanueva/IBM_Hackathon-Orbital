import { redirect, notFound } from 'next/navigation';
import { getSatelliteCatalogEntry } from '@/lib/satellites/catalog';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Individual satellite pages now live inside the homepage's Earth Mode HUD
 * rather than as standalone pages — this route stays a stable, shareable
 * deep link (e.g. from the ISS mission page's "Track ISS Live" button) that
 * redirects into that experience with the satellite pre-selected.
 */
export default async function SatelliteRedirectPage({ params }: PageProps) {
  const { id } = await params;
  if (!getSatelliteCatalogEntry(id)) notFound();
  redirect(`/?planet=earth&satellite=${encodeURIComponent(id)}`);
}
