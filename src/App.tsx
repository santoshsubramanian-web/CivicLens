import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Upload, Send, Terminal } from 'lucide-react';

interface TicketData {
  issue_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  location_description: string;
  needs_immediate_dispatch: boolean;
  recommended_action: string;
  evidence_summary: string;
}

export default function App() {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setCoords(`Lat: ${lat}, Lng: ${lng}`);
      },
      () => setCoords(null)
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !file) {
      setError("Please provide an issue description or upload an image.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    const payloadDescription = coords
      ? `${description}\n\n[ATTACHED GEOLOCATION: ${coords}]`
      : description;
    if (description || coords) formData.append("description", payloadDescription);
    if (file) formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: TicketData = await response.json();
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans p-6">
      {/* Telemetry Header */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold tracking-wider">CIVICLENS</h1>
            <p className="text-xs text-slate-400 font-mono">311 DISPATCH COMMAND CENTER</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM ONLINE
          </span>
          <span className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-400">
            ENGINE: GEMINI 3.6 FLASH
          </span>
          <span className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-400">
            {coords ? `GPS: [${coords}]` : 'GPS: [ACQUIRING...]'}
          </span>
        </div>
      </header>

      {/* Main Console Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Console: Intake */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-slate-800 shadow-xl">
          <h2 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" /> INCIDENT INTAKE CONSOLE
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">FIELD REPORT / TELEMETRY LOG</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDescription("CRITICAL: High-voltage cable snapped and sparking on wet road at 45th Street.")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-[10px] font-mono transition-all"
                >
                  + Preset: Power Hazard
                </button>
                <button
                  type="button"
                  onClick={() => setDescription("MODERATE: Major pothole on Main Street causing traffic slowdown near civic center.")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded text-[10px] font-mono transition-all"
                >
                  + Preset: Road Damage
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe infrastructure damage, location, or emergency context..."
                className="w-full h-32 bg-[#090D16] border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">VISUAL EVIDENCE UPLOAD</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {error && <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded font-mono">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "ANALYZING TELEMETRY..." : "ANALYZE & DISPATCH TICKET"}
            </button>
          </form>
        </div>

 {/* Right Console: Processed Output */}
<div className="bg-[#0F172A] p-6 rounded-xl border border-slate-800 shadow-xl">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-sm font-mono text-slate-400 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400" /> REAL-TIME INCIDENT RESPONSE
    </h2>
    {ticket && (
      <button
        onClick={() => {
          const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `civiclens-ticket-${Date.now()}.json`;
          a.click();
        }}
        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-xs font-mono transition-all"
      >
        EXPORT JSON PAYLOAD
      </button>
    )}
  </div>

  {!ticket ? (
    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-600 font-mono text-xs">
      AWAITING INCIDENT TELEMETRY...
    </div>
  ) : (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex justify-between items-center p-3 bg-[#090D16] rounded border border-slate-800">
        <span className="text-slate-400">SEVERITY LEVEL:</span>
        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
          ticket.severity === 'CRITICAL' ? 'bg-rose-900/80 text-rose-200 border border-rose-500 animate-pulse' :
          ticket.severity === 'HIGH' ? 'bg-amber-900/80 text-amber-200 border border-amber-500' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500'
        }`}>
          {ticket.severity}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-[#090D16] rounded border border-slate-800">
          <div className="text-slate-500 text-[10px]">CATEGORY</div>
          <div className="text-slate-200 font-bold mt-1 uppercase">{ticket.issue_type}</div>
        </div>
        <div className="p-3 bg-[#090D16] rounded border border-slate-800">
          <div className="text-slate-500 text-[10px]">DISPATCH DISCRETION</div>
          <div className={`font-bold mt-1 ${ticket.needs_immediate_dispatch ? 'text-rose-400' : 'text-emerald-400'}`}>
            {ticket.needs_immediate_dispatch ? 'EMERGENCY DISPATCH' : 'ROUTINE QUEUE'}
          </div>
        </div>
        <div className="p-3 bg-[#090D16] rounded border border-slate-800">
          <div className="text-slate-500 text-[10px]">TARGET SLA</div>
          <div className="text-amber-400 font-bold mt-1">
            {ticket.severity === 'CRITICAL' ? '< 30 MINS' : '< 4 HOURS'}
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#090D16] rounded border border-slate-800">
        <div className="text-slate-500 text-[10px] mb-1">LOCATION SUMMARY</div>
        <div className="text-slate-300">{ticket.location_description}</div>
      </div>

      <div className="p-3 bg-[#090D16] rounded border border-slate-800">
        <div className="text-slate-500 text-[10px] mb-1">ACTION PLAN</div>
        <div className="text-cyan-300">{ticket.recommended_action}</div>
      </div>

      <div className="p-3 bg-[#090D16] rounded border border-slate-800">
        <div className="text-slate-500 text-[10px] mb-1">EVIDENCE SUMMARY</div>
        <div className="text-slate-400">{ticket.evidence_summary}</div>
      </div>
    </div>
  )}
</div>
</main>
</div>)}
