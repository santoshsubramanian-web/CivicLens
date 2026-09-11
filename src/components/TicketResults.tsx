import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertOctagon, AlertTriangle, CheckCircle2, MapPin, Siren,
  Code2, Radar, Copy, Check,
  ShieldAlert, Clock, Building2, Quote, FileText, Terminal, Zap,
} from 'lucide-react';

export interface TicketData {
  issue_type?: string;
  location?: string;
  severity?: string;
  dispatch_needed?: boolean;
  recommended_action?: string;
  evidence_summary?: string;
  incident_id?: string;
  response_sla?: string;
  required_agency?: string;
  incident_category?: string;
  [key: string]: unknown;
}

interface TicketResultsProps {
  data: TicketData | null;
  loading: boolean;
  error: string | null;
}

function severityConfig(severity: string | undefined) {
  const s = (severity ?? '').toUpperCase();
  if (s === 'CRITICAL') {
    return {
      label: 'CRITICAL',
      border: 'border-rose-500/50',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      glow: 'glow-rose',
      Icon: AlertOctagon,
    };
  }
  if (s === 'HIGH') {
    return {
      label: 'HIGH',
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'glow-amber',
      Icon: AlertTriangle,
    };
  }
  if (s === 'MODERATE') {
    return {
      label: 'MODERATE',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'glow-emerald',
      Icon: ShieldAlert,
    };
  }
  return {
    label: s || 'LOW',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'glow-emerald',
    Icon: CheckCircle2,
  };
}

export default function TicketResults({ data, loading, error }: TicketResultsProps) {
  const [copied, setCopied] = useState(false);

  const copyJSON = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]">
        <div className="radar-grid absolute inset-0 opacity-40" />
        <div className="radar-sweep absolute inset-0" />
        <div className="relative flex flex-col items-center">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-800 border-t-blue-500" />
            <Radar className="absolute inset-0 m-auto h-8 w-8 text-blue-500/50" />
          </div>
          <p className="mt-6 text-sm font-semibold text-blue-300">Analyzing evidence...</p>
          <p className="mt-1 text-xs text-slate-500">Gemini 3.6 Flash is processing the report</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-rose-900/50 bg-rose-950/10">
        <div className="radar-grid absolute inset-0 opacity-20" />
        <div className="relative flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
            <AlertOctagon className="h-7 w-7 text-rose-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-rose-300">Analysis Failed</p>
          <p className="mt-1 max-w-xs text-center text-xs text-rose-400/70">{error}</p>
        </div>
      </div>
    );
  }

  // --- Default / Awaiting state ---
  if (!data) {
    return (
      <div className="relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]/50">
        <div className="radar-grid absolute inset-0 opacity-50" />
        <div className="radar-sweep absolute inset-0" />

        {/* Radar pulse rings */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border border-blue-500/20 animate-radar-pulse" />
          <div className="absolute h-24 w-24 rounded-full border border-blue-500/20 animate-radar-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute h-24 w-24 rounded-full border border-blue-500/20 animate-radar-pulse" style={{ animationDelay: '2s' }} />
          {/* Sweep line */}
          <div className="absolute h-32 w-32 animate-sweep">
            <div className="absolute left-1/2 top-1/2 h-16 w-px origin-top bg-gradient-to-b from-blue-400/60 to-transparent" />
          </div>
          {/* Center icon */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#090D16] ring-1 ring-blue-500/20">
            <Radar className="h-7 w-7 text-blue-500/60" />
          </div>
        </div>

        <p className="relative mt-6 font-mono text-sm font-semibold tracking-widest text-slate-400">
          AWAITING INCIDENT TELEMETRY...
        </p>
        <p className="relative mt-1 text-xs text-slate-600">Submit a report to generate a dispatch ticket</p>
      </div>
    );
  }

  // --- Active / Results state ---
  const sev = severityConfig(data.severity);

  const metricCards: Array<{
    key: string;
    label: string;
    value: string;
    Icon: LucideIcon;
    isDispatch?: boolean;
  }> = [
    { key: 'category', label: 'Incident Category', value: data.incident_category ?? data.issue_type ?? '—', Icon: FileText },
    {
      key: 'dispatch',
      label: 'Immediate Dispatch',
      value: data.dispatch_needed ? 'YES / EMERGENCY DISPATCH' : 'NO / ROUTINE',
      Icon: Siren,
      isDispatch: true,
    },
    { key: 'sla', label: 'Response SLA Target', value: data.response_sla ?? '—', Icon: Clock },
    { key: 'agency', label: 'Assigned Agency', value: data.required_agency ?? '—', Icon: Building2 },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Processed Incident Response</h2>
      </div>

      {/* Priority Header — Severity Banner */}
      <div className={`relative overflow-hidden rounded-xl border ${sev.border} ${sev.bg} ${sev.glow} px-5 py-4`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${sev.bg} ring-1 ${sev.border}`}>
            <sev.Icon className={`h-6 w-6 ${sev.text}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hazard Severity</p>
            <p className={`text-2xl font-bold ${sev.text} text-shadow-glow`}>{sev.label}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-xs text-slate-400">{data.incident_id ?? 'ID—'}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-600">Incident ID</span>
          </div>
        </div>
        {data.issue_type && (
          <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
            <Zap className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Classification:</span>
            <span className="text-xs font-medium text-slate-300">{data.issue_type}</span>
          </div>
        )}
      </div>

      {/* Key Metrics Grid — 4 cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map(({ key, label, value, Icon, isDispatch }) => {
          const dispatch = isDispatch && data.dispatch_needed;
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 ${
                isDispatch
                  ? dispatch
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 bg-[#090D16]/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3 w-3 ${isDispatch ? (dispatch ? 'text-rose-400' : 'text-emerald-400') : 'text-blue-400/60'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              </div>
              <p className={`mt-1.5 font-mono text-xs font-bold ${
                isDispatch
                  ? dispatch ? 'text-rose-400 animate-dispatch-pulse' : 'text-emerald-400'
                  : 'text-slate-200'
              }`}>
                {value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Location */}
      {data.location && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#090D16]/40 px-4 py-3">
          <MapPin className="h-4 w-4 text-blue-400/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Location:</span>
          <span className="font-mono text-xs text-slate-300">{data.location}</span>
        </div>
      )}

      {/* Action Plan Box */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/10 p-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Recommended Field Action</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {data.recommended_action ?? 'No recommendation available.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.03] hover:shadow-rose-500/30 active:scale-[0.98]">
            <Siren className="h-3.5 w-3.5" />
            Confirm Dispatch
          </button>
          <button
            onClick={copyJSON}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-blue-500/30 hover:text-blue-300"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy JSON Payload'}
          </button>
        </div>
      </div>

      {/* Evidence Summary — Terminal-style quote block */}
      {data.evidence_summary && (
        <div className="rounded-xl border border-white/10 bg-[#090D16]/80 p-4">
          <div className="flex items-center gap-2">
            <Quote className="h-3.5 w-3.5 text-blue-400/60" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Evidence Summary</span>
          </div>
          <blockquote className="mt-2 border-l-2 border-blue-500/40 pl-3 font-mono text-sm leading-relaxed text-slate-300">
            <span className="text-slate-600">{'> '}</span>
            {data.evidence_summary}
          </blockquote>
        </div>
      )}

      {/* Raw JSON */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Raw JSON Response</span>
        </div>
        <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-[#090D16] p-4 font-mono text-xs leading-relaxed text-slate-400 scrollbar-thin">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
