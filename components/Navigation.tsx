'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Clock, Database, X, Menu, ChevronRight } from 'lucide-react';
import { Mission } from '@/lib/types';

interface NavProps {
  selectedPlanet?: string;
  onPlanetSelect?: (planet: string) => void;
  /** Optional callback: scroll the page back to the 3D map section. */
  onScrollToMap?: () => void;
}

export function Navigation({ selectedPlanet, onPlanetSelect, onScrollToMap }: NavProps) {
  const router   = useRouter();
  const pathname = usePathname();

  /**
   * Handle a planet button click from the top navigation.
   *
   * • If we're already on the home page (/), scroll back to the map and select.
   * • If we're on any other route (e.g. /missions), navigate to /?planet=<id>.
   *   page.tsx picks up the `planet` search-param on mount and calls handlePlanetSelect.
   */
  const handleNavPlanetClick = useCallback((id: string) => {
    if (pathname === '/') {
      onScrollToMap?.();
      onPlanetSelect?.(id);
    } else {
      router.push(`/?planet=${id}`);
    }
  }, [pathname, router, onScrollToMap, onPlanetSelect]);

  const [utcTime, setUtcTime] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Mission[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().replace('GMT', 'UTC').split(' ').slice(1).join(' ')
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results?.map((r: { mission: Mission }) => r.mission) || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, handleSearch]);

  const planets = [
    { id: 'earth', label: 'EARTH', color: 'text-blue-400' },
    { id: 'moon', label: 'MOON', color: 'text-slate-300' },
    { id: 'mars', label: 'MARS', color: 'text-orange-400' },
  ];

  const navLinks = [
    { href: '/', label: 'EXPLORE' },
    { href: '/missions', label: 'MISSIONS' },
    { href: '/timeline', label: 'TIMELINE' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-space-border">
      <div className="max-w-screen-2xl mx-auto h-full px-4 lg:px-6 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-6 h-6 relative">
            <div className="absolute inset-0 rounded-full border border-orbit-blue/60 group-hover:border-orbit-blue transition-colors" />
            <div className="absolute inset-[4px] rounded-full border border-orbit-cyan/40" />
            <div className="absolute inset-[8px] rounded-full bg-orbit-blue/30" />
          </div>
          <div>
            <div className="text-orbit-white font-semibold text-sm tracking-widest leading-none">ORBITAL</div>
            <div className="text-orbit-dim text-[9px] tracking-widest leading-none mt-0.5">AI MISSION ATLAS</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-xs tracking-widest text-orbit-dim hover:text-orbit-white transition-colors rounded"
            >
              {link.label}
            </Link>
          ))}

          {/* Planet selectors */}
          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-space-border">
            {planets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleNavPlanetClick(p.id)}
                className={`px-3 py-1.5 text-xs tracking-widest transition-all rounded ${
                  selectedPlanet === p.id
                    ? `${p.color} bg-white/5 font-medium`
                    : 'text-orbit-dim hover:text-orbit-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-orbit-dim font-mono tracking-wider">
            <Clock size={10} className="text-orbit-blue/60" />
            <span>{utcTime}</span>
          </div>

          {/* Data status indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded glass-subtle">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-orbit-dim tracking-wider">LIVE</span>
            <Database size={9} className="text-orbit-dim ml-0.5" />
          </div>

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded glass-subtle text-orbit-dim hover:text-orbit-white transition-colors text-xs"
            >
              <Search size={12} />
              <span className="hidden sm:block tracking-wider">SEARCH</span>
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="flex items-center gap-2 p-3 border-b border-space-border">
                  <Search size={14} className="text-orbit-dim shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search missions, spacecraft, agencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-orbit-white placeholder-orbit-dim/50 outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <X size={14} className="text-orbit-dim hover:text-orbit-white" />
                    </button>
                  )}
                </div>
                {searching && (
                  <div className="p-3 text-xs text-orbit-dim text-center">Searching...</div>
                )}
                {!searching && searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.slice(0, 8).map((m) => (
                      <Link
                        key={m.id}
                        href={`/missions/${m.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors border-b border-space-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-orbit-white font-medium truncate">{m.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-orbit-dim uppercase tracking-wider">{m.agency}</span>
                            <span className="text-[10px] text-orbit-dim">·</span>
                            <span className={`text-[10px] capitalize tracking-wider status-${m.status}`}>{m.status.replace(/-/g, ' ')}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-orbit-dim shrink-0 mt-0.5" />
                      </Link>
                    ))}
                  </div>
                )}
                {!searching && searchQuery && searchResults.length === 0 && (
                  <div className="p-4 text-xs text-orbit-dim text-center">No missions found</div>
                )}
                {!searchQuery && (
                  <div className="p-3 text-xs text-orbit-dim/60 text-center tracking-wider">
                    Try: Perseverance · Artemis · ISS · Mars · Moon
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden p-1.5 text-orbit-dim hover:text-orbit-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-space-border px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2 text-sm text-orbit-dim hover:text-orbit-white tracking-wider" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-space-border flex gap-2">
            {planets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  handleNavPlanetClick(p.id);
                  setMobileOpen(false);
                }}
                className={`px-3 py-1.5 text-xs tracking-widest rounded glass-subtle ${p.color}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
