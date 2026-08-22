import { getMissionById, MISSIONS } from '@/lib/missions';
import { MissionDetail } from '@/components/MissionDetail';
import { NavigationWrapper } from '@/components/NavigationWrapper';
import { AIAnalystWrapper } from '@/components/AIAnalystWrapper';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const mission = getMissionById(params.id);
  if (!mission) return { title: 'Mission Not Found — ORBITAL' };
  return {
    title: `${mission.name} — ORBITAL AI Mission Atlas`,
    description: mission.description.substring(0, 160),
  };
}

export default function MissionPage({ params }: PageProps) {
  const mission = getMissionById(params.id);
  if (!mission) notFound();

  return (
    <div className="min-h-screen bg-space-black">
      <NavigationWrapper />
      <div className="pt-14">
        <MissionDetail mission={mission} />
      </div>
      <AIAnalystWrapper mission={mission} />
    </div>
  );
}
