import React, { useState } from 'react';
import { 
  BarChart3, Download, FileText, Calendar, Filter, Share2, 
  ShieldCheck, Globe, FileSpreadsheet, Sparkles, CheckCircle2 
} from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'REP-2023-11', title: 'Monthly Tiger Occupancy & Overlap Analysis - Nov 2023', type: 'Occupancy', date: '2023-12-01', status: 'Generated' },
  { id: 'REP-NTCA-Q3', title: 'NTCA Spatially Explicit Capture-Recapture (SECR) Report', type: 'Population', date: '2023-11-20', status: 'Generated' },
  { id: 'REP-DISP-01', title: 'Territorial Overlap & Conflict Threat Matrix (Turia-Karmajhiri)', type: 'Movement', date: '2023-11-15', status: 'Generated' },
];

export default function ReportsPage() {
  const [reports] = useState(MOCK_REPORTS);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const handleDownloadGIS = (type) => {
    const backendBase = 'http://localhost:5000/api/export/spatial';
    if (type === 'geojson') {
      window.open(`${backendBase}/geojson`, '_blank');
      setDownloadSuccess('Exported Reserve GeoJSON FeatureCollection successfully.');
    } else if (type === 'csv') {
      window.open(`${backendBase}/csv`, '_blank');
      setDownloadSuccess('Exported NTCA Spatial Monitoring CSV successfully.');
    }
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDownloadSuccess('New Spatial Compliance Report compiled successfully.');
      setTimeout(() => setDownloadSuccess(''), 4000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <BarChart3 className="w-8 h-8 text-primary" /> Intelligence Reports & Forest Dept Exports
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Scientific GIS spatial data, NTCA census compliance spreadsheets, and territorial overlap dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownloadGIS('geojson')}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest"
          >
            <Globe className="w-4 h-4" /> Export GeoJSON
          </button>
          <button
            onClick={() => handleDownloadGIS('csv')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export NTCA CSV
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-400 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Quick Action Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/30 border border-primary/30 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-primary/20 text-primary">
                <Globe className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">Complete Reserve GeoJSON Package</h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Standard GIS FeatureCollection with layers for individual MCP home ranges, activity centroids, camera capture sightings, and territorial overlap polygons.
            </p>
          </div>
          <button
            onClick={() => handleDownloadGIS('geojson')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-colors"
          >
            Download
          </button>
        </div>

        <div className="bg-muted/30 border border-emerald-500/30 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">NTCA Spatial Territory CSV</h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Official forest department spreadsheet format with tiger IDs, centroid GPS coordinates, total captures, MCP areas in km², and overlapping neighbor individuals.
            </p>
          </div>
          <button
            onClick={() => handleDownloadGIS('csv')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* Left Col: Generator config */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-xl border border-border flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Report Parameters
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Report Type</label>
              <select className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50">
                <option>Territorial Overlap & Conflict Risk Matrix</option>
                <option>Population Estimation (Spatially Explicit CMR)</option>
                <option>Occupancy Dynamics & Centroid Shifts</option>
                <option>NTCA Monthly Summary Dossier</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Temporal Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" defaultValue="2023-11-01" className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-primary/50" />
                <input type="date" defaultValue="2023-11-30" className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-primary/50" />
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

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest disabled:opacity-50 mt-2"
            >
              {generating ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Compiling GIS Data...' : 'Compile New Report'}
            </button>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
              <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Data Integrity
              </div>
              <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                All generated reports include cryptographic hashes verifying telemetry data and polygon geometry.
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
                    <button 
                      onClick={() => handleDownloadGIS('csv')}
                      className="bg-muted/30 hover:bg-muted/40 border border-border p-2 rounded-lg text-foreground transition-colors" 
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadGIS('geojson')}
                      className="bg-muted/30 hover:bg-muted/40 border border-border p-2 rounded-lg text-foreground transition-colors" 
                      title="Download GeoJSON"
                    >
                      <Globe className="w-4 h-4" />
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
