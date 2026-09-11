import { useEffect, useState } from 'react';
import { ShieldAlert, Zap, Activity, Gauge, MapPin } from 'lucide-react';

export default function Header() {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utcTime = clock.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 bg-[#1e293b] px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#090D16]" />
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              CivicLens <span className="text-slate-600">//</span> <span className="text-blue-400">311 Emergency Dispatch</span>
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Operations Command Center
            </p>
          </div>
        </div>

        {/* Status cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* System Online */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-emerald-400">SYSTEM ONLINE</span>
          </div>

          {/* Engine badge */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 sm:flex">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Gemini 3.6 Flash</span>
          </div>

          {/* Latency */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 md:flex">
            <Gauge className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono text-xs font-semibold text-slate-300">~340ms</span>
          </div>

          {/* UTC Clock */}
          <div className="flex flex-col items-end rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1">
            <span className="font-mono text-sm font-bold tabular-nums text-blue-300">{utcTime}</span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500">UTC</span>
          </div>

          {/* Coordinates */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 lg:flex">
            <MapPin className="h-3.5 w-3.5 text-blue-400/60" />
            <span className="font-mono text-xs text-slate-400">12.9716° N, 77.5946° E</span>
            <span className="text-[10px] font-medium text-slate-600">[Bengaluru Sector]</span>
          </div>
        </div>
      </div>
    </header>
  );
}
