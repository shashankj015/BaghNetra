import React, { useState } from 'react';
import { BarChart3, Download, FileText, Calendar, Filter, Share2, ShieldCheck } from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'REP-2023-11', title: 'Monthly Occupancy Analysis - Nov 2023', type: 'Occupancy', date: '2023-12-01', status: 'Generated' },
  { id: 'REP-2023-Q3', title: 'Q3 Biomass & Prey Base Estimation', type: 'Biomass', date: '2023-10-15', status: 'Generated' },
  { id: 'REP-DISP-01', title: 'Sub-adult Dispersal Corridors (Turia-Karmajhiri)', type: 'Movement', date: '2023-11-20', status: 'Generated' },
];

export default function ReportsPage() {
  const [reports] = useState(MOCK_REPORTS);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <BarChart3 className="w-8 h-8 text-primary" /> Intelligence Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Scientific export, population estimation, and automated NTCA compliance documents.
          </p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {generating ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}
          {generating ? 'Compiling Data...' : 'Generate New Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Generator config */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-xl border border-border flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Report Parameters
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Report Type</label>
              <select className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50">
                <option>Population Estimation (Spatially Explicit CMR)</option>
                <option>Occupancy Dynamics</option>
                <option>Human-Wildlife Conflict Risk Matrix</option>
                <option>NTCA Monthly Summary</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Temporal Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-primary/50" />
                <input type="date" className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Spatial Extent</label>
              <select className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50">
                <option>Full Reserve (Core + Buffer)</option>
                <option>Core Zone Only</option>
                <option>Turia Sector</option>
                <option>Karmajhiri Sector</option>
              </select>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
              <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Data Integrity
              </div>
              <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                All generated reports include cryptographic hashes verifying telemetry data has not been altered since capture.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Archive */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-xl border border-border flex-1">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> Document Archive
            </h3>

            <div className="flex flex-col gap-3">
              {reports.map((report) => (
                <div key={report.id} className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold font-mono tracking-widest uppercase text-muted-foreground border border-border px-2 py-0.5 rounded">
                          {report.id}
                        </span>
                        <span className="text-[9px] font-bold font-mono tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          {report.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{report.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">Generated: {report.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="bg-muted/30 hover:bg-muted/40 border border-border p-2 rounded-lg text-foreground transition-colors" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="bg-muted/30 hover:bg-muted/40 border border-border p-2 rounded-lg text-foreground transition-colors" title="Share Secure Link">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
