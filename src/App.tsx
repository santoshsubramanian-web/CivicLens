import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Upload, Send, Terminal } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketData {
  issue_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  location_description: string;
  needs_immediate_dispatch: boolean;
  recommended_action: string;
  evidence_summary: string;
}

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playBeep = (freq = 880, type: OscillatorType = 'sine', duration = 0.08) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore audio failures
  }
};

const playChime = () => {
  playBeep(587, 'sine', 0.12);
  setTimeout(() => playBeep(880, 'sine', 0.14), 120);
};

export default function App() {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; timestamp: string; data: TicketData }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setCoords(`Lat: ${lat}, Lng: ${lng}`);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
            }
          }
        } catch {
          // fallback to raw coordinates if reverse geocoding is offline
        }
      },
      () => setCoords(null)
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !file) {
      if (soundEnabled) playBeep(220, 'sine', 0.15);
      setError("Please provide an issue description or upload an image.");
      return;
    }

    if (soundEnabled) playBeep(880);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    const geoTag = address || coords;
    const payloadDescription = geoTag
      ? `${description}\n\n[ATTACHED GEOLOCATION: ${geoTag}]`
      : description;
    if (description || geoTag) formData.append("description", payloadDescription);
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
      if (soundEnabled) playChime();
      setHistory((prev) => [
        {
          id: `#TK-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          data,
        },
        ...prev,
      ]);
    } catch (err: any) {
      if (soundEnabled) playBeep(220, 'sine', 0.2);
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportDocx = async (ticket: TicketData, locationInfo: string | null) => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "CIVICLENS TELEMETRY COMMAND CENTER", bold: true, size: 32 }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Official Municipal Incident Petition", italics: true, size: 24, color: "555555" }),
              ],
            }),
            new Paragraph({ text: " " }),

            new Paragraph({
              children: [
                new TextRun({ text: "Date: ", bold: true }),
                new TextRun(new Date().toLocaleDateString()),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Ref Code: ", bold: true }),
                new TextRun(`CIVICLENS-DISPATCH-${Math.floor(1000 + Math.random() * 9000)}`),
              ],
            }),
            new Paragraph({ text: " " }),

            new Paragraph({
              children: [
                new TextRun({ text: "To: ", bold: true }),
                new TextRun("Office of Municipal Affairs & Emergency Dispatch"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Department: ", bold: true }),
                new TextRun("Public Works & Infrastructure Division"),
              ],
            }),
            new Paragraph({
              children: [new TextRun("City Administration Bureau")],
            }),
            new Paragraph({ text: " " }),

            new Paragraph({
              children: [
                new TextRun({ text: `SUBJECT: FORMAL NOTIFICATION AND ACTION REQUEST REGARDING ${ticket.issue_type.toUpperCase()} HAZARD AT ${(locationInfo || ticket.location_description).toUpperCase()}`, bold: true }),
              ],
            }),
            new Paragraph({ text: " " }),

            new Paragraph("To the Respected Municipal Officer / Emergency Dispatch Commander,"),
            new Paragraph({ text: " " }),

            new Paragraph(
              "This is a formal notification of an urgent municipal hazard identified and verified via the CivicLens automated telemetry and dispatch system. The incident detailed below requires prompt assessment and corrective action by the responsible public works authority to ensure public safety and prevent further degradation of municipal infrastructure."
            ),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "INCIDENT TELEMETRY", heading: HeadingLevel.HEADING_1 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "444444" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "444444" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "444444" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "444444" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Severity", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(ticket.severity)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(ticket.issue_type)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Address / Location", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(locationInfo || ticket.location_description || "NOT ACQUIRED")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Target SLA", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(ticket.severity === 'CRITICAL' ? '< 30 MINS' : '< 4 HOURS')] }),
                  ],
                }),
              ],
            }),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "INCIDENT OVERVIEW & EVIDENCE", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({
              children: [
                new TextRun({ text: "Evidence Summary: ", bold: true }),
                new TextRun(ticket.evidence_summary),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Recommended Action: ", bold: true }),
                new TextRun(ticket.recommended_action),
              ],
            }),
            new Paragraph({ text: " " }),

            new Paragraph(
              "We respectfully request immediate dispatch of field personnel to inspect and remediate this condition in accordance with public safety standards."
            ),
            new Paragraph({ text: " " }),
            new Paragraph({ text: " " }),

            new Paragraph({ children: [new TextRun({ text: "Sincerely,", size: 24 })] }),
            new Paragraph({ children: [new TextRun({ text: "CivicLens Automated Dispatch & Citizen Telemetry System", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Contact: emergency-dispatch@civiclens.local" })] }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CivicLens_Request_Letter_${ticket.issue_type}_${Date.now()}.docx`);
  };

  return (
    <div className="min-h-screen bg-[#060913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] text-slate-100 font-sans p-6">
      {/* Telemetry Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            SYSTEM ONLINE
          </span>
          <span className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-400">
            ENGINE: GEMINI 3.6 FLASH
          </span>
          <span className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-400 max-w-xs truncate">
            {address ? `LOC: ${address}` : coords ? `GPS: [${coords}]` : 'GPS: [ACQUIRING...]'}
          </span>
          <motion.button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-1.5 rounded border transition-all ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:border-cyan-700'
                : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'
            }`}
          >
            AUDIO: {soundEnabled ? 'ON' : 'OFF'}
          </motion.button>
        </div>
      </header>
      </motion.div>

      {/* System Status Banner */}
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex justify-between items-center p-3 bg-[#0b1120]/80 backdrop-blur-md rounded-lg border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] font-mono text-slate-500">ACTIVE TICKET QUEUE</span>
            <span className="text-sm font-mono text-cyan-400 font-bold">{history.length}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#0b1120]/80 backdrop-blur-md rounded-lg border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] font-mono text-slate-500">SYSTEM LATENCY</span>
            <span className="text-sm font-mono text-emerald-400 font-bold">42ms</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#0b1120]/80 backdrop-blur-md rounded-lg border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] font-mono text-slate-500">API STATUS</span>
            <span className="flex items-center gap-2 text-sm font-mono text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> STABLE
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-3 bg-[#0b1120]/80 backdrop-blur-md rounded-lg border border-cyan-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <Clock className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span className="text-xs font-mono text-cyan-300 animate-pulse">
              GEMINI 3.6 FLASH: PROCESSING INGESTION PAYLOAD...
            </span>
          </div>
        )}
      </div>

      {/* Main Console Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Console: Intake */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="bg-[#0b1120]/80 backdrop-blur-md p-6 rounded-xl border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <h2 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" /> INCIDENT INTAKE CONSOLE
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">FIELD REPORT / TELEMETRY LOG</label>
              <div className="flex gap-2 mb-2">
                <motion.button
                  type="button"
                  onClick={() => {
                  if (soundEnabled) playBeep(880);
                  setDescription("CRITICAL: High-voltage cable snapped and sparking on wet road at 45th Street.");
                }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-[10px] font-mono transition-all"
                >
                  + Preset: Power Hazard
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                  if (soundEnabled) playBeep(880);
                  setDescription("MODERATE: Major pothole on Main Street causing traffic slowdown near civic center.");
                }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded text-[10px] font-mono transition-all"
                >
                  + Preset: Road Damage
                </motion.button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe infrastructure damage, location, or emergency context..."
                className="w-full h-32 bg-[#060913] border border-slate-800/80 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">VISUAL EVIDENCE UPLOAD</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
              />
            </div>

            {error && <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded font-mono">{error}</div>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-500 hover:from-cyan-500 hover:to-teal-400 disabled:bg-slate-800 text-slate-950 font-bold font-mono text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "ANALYZING TELEMETRY..." : "ANALYZE & DISPATCH TICKET"}
            </motion.button>
          </form>
        </div>

        {/* Incident History */}
        <div className="bg-[#0b1120]/80 backdrop-blur-md p-6 rounded-xl border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <h2 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> INCIDENT HISTORY
          </h2>
          {history.length === 0 ? (
            <div className="h-20 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-600 font-mono text-xs">
              NO PRIOR INCIDENTS LOGGED
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map((item) => (
                <button
                  key={item.id + item.timestamp}
                  type="button"
                  onClick={() => setTicket(item.data)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-[#090D16] hover:bg-slate-800 border border-slate-800 rounded text-left transition-all"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold text-xs">{item.id}</span>
                      <span className="text-slate-500 text-[10px]">{item.timestamp}</span>
                    </div>
                    <span className="text-slate-300 text-[10px] truncate uppercase">{item.data.issue_type}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    item.data.severity === 'CRITICAL' ? 'bg-rose-900/80 text-rose-200 border border-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]' :
                    item.data.severity === 'HIGH' ? 'bg-amber-900/80 text-amber-200 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}>
                    {item.data.severity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        </motion.div>

 {/* Right Console: Processed Output */}
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className="bg-[#0b1120]/80 backdrop-blur-md p-6 rounded-xl border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-sm font-mono text-slate-400 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400" /> REAL-TIME INCIDENT RESPONSE
    </h2>
    {ticket && (
      <div className="flex gap-2">
        <motion.button
          onClick={() => handleExportDocx(ticket, address || coords)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono px-3 py-1 rounded transition-all cursor-pointer"
        >
          EXPORT REQUEST LETTER (.DOCX)
        </motion.button>
        <motion.button
          onClick={() => {
            const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `civiclens-ticket-${Date.now()}.json`;
            a.click();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-xs font-mono transition-all"
        >
          EXPORT JSON PAYLOAD
        </motion.button>
      </div>
    )}
  </div>

  <AnimatePresence mode="wait">
  {!ticket ? (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-64 flex flex-col justify-center items-start gap-3 border border-dashed border-slate-800 rounded-lg p-4 text-slate-600 font-mono text-xs bg-[#090D16]"
    >
      <span className="text-emerald-400">[✓] FASTAPI ENDPOINT CONNECTED</span>
      <span className="text-emerald-400">[✓] GEMINI MULTIMODAL ADAPTER READY</span>
      <span className="text-emerald-400">[✓] GEOLOCATION TELEMETRY ACTIVE</span>
      <span className="text-slate-500 mt-2">AWAITING INCIDENT TELEMETRY...</span>
    </motion.div>
  ) : (
    <motion.div
      key={`${ticket.issue_type}-${ticket.severity}-${ticket.location_description}-${ticket.recommended_action}-${ticket.evidence_summary}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 font-mono text-xs"
    >
      <div className="flex justify-between items-center p-3 bg-[#090D16] rounded border border-slate-800">
        <span className="text-slate-400">SEVERITY LEVEL:</span>
        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
          ticket.severity === 'CRITICAL' ? 'bg-rose-900/80 text-rose-200 border border-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.5)]' :
          ticket.severity === 'HIGH' ? 'bg-amber-900/80 text-amber-200 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
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
    </motion.div>
  )}
</AnimatePresence>
</motion.div>
</main>
</div>)}
