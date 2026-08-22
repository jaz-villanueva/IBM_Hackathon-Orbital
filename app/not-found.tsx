import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-space-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl font-extralight text-orbit-dim tracking-widest">404</div>
        <div className="text-orbit-white text-xl font-light tracking-wide">SIGNAL LOST</div>
        <p className="text-orbit-dim text-sm max-w-xs mx-auto">
          The mission or page you&apos;re looking for is not in our catalog.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg border border-orbit-blue/30 text-orbit-blue text-sm hover:bg-orbit-blue/10 transition-colors mt-4"
        >
          Return to Mission Control
        </Link>
      </div>
    </div>
  );
}
