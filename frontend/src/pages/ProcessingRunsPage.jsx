import React, { useState, useEffect } from 'react';
import { 
  Layers, Clock, HardDrive, CheckCircle2, AlertCircle, RefreshCw, 
  Activity, Cpu, MapPin, Download, Globe, FileSpreadsheet, X, 
  ExternalLink, Crosshair, Network, Sparkles, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MOCK_RUNS = [
  {
    runId: 'RUN-2023-11-20-001',
    stationId: 'PTR-C-02 (Sita Ghat)',
    status: 'COMPLETED',
    processedImages: 4502,
    totalImages: 4502,
    blankCount: 4210,
    tigerCount: 14,
    throughputFps: 42.5,
    diskSpaceSavedMB: 3850,
    createdAt: '2023-11-20T08:15:00Z',
    spatialSummary: {
      individualCount: 2,
      individuals: [
        {
          tigerId: 'BT001',
          name: 'Collarwali',
          sex: 'FEMALE',
          capturesInRun: 9,
          totalHistoricalCaptures: 42,
          runStations: ['PTR-C-01', 'PTR-C-02'],
          occupiedAreaKm2: 28.4,
          activityCentroid: { latitude: 21.684, longitude: 79.325 }
        },
        {
          tigerId: 'BT002',
          name: 'T-15',
          sex: 'MALE',
          capturesInRun: 5,
          totalHistoricalCaptures: 38,
          runStations: ['PTR-C-02'],
          occupiedAreaKm2: 45.1,
          activityCentroid: { latitude: 21.652, longitude: 79.341 }
        }
      ],
      overlaps: [
        {
          tiger1: { tigerId: 'BT001', name: 'Collarwali' },
          tiger2: { tigerId: 'BT002', name: 'T-15' },
          overlapAreaKm2: 6.4,
          interactionType: 'MATING_PAIR_OVERLAP',
          managementSignal: 'BREEDING_MONITORING'
        }
      ]
    }
  }
];

export default function ProcessingRunsPage() {
  const [runs, setRuns] = useState(MOCK_RUNS);
  const [loading, setLoading] = useState(true);
  const [selectedRunDossier, setSelectedRunDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/runs');
      if (res.data.runs && res.data.runs.length > 0) {
        setRuns(res.data.runs);
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock processing runs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const openSpatialDossier = async (run) => {
    if (run.spatialSummary) {
      setSelectedRunDossier({ runId: run.runId, ...run.spatialSummary });
      return;
    }

    setLoadingDossier(true);
    try {
      const res = await api.get(`/runs/${run.runId}/spatial-summary`);
      setSelectedRunDossier(res.data.spatialSummary || { runId: run.runId, individuals: [], overlaps: [] });
    } catch (err) {
      console.error('Error fetching spatial dossier:', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleExportRun = (runId, type) => {
    const url = `http://localhost:5000/api/export/runs/${runId}/${type}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Layers className="w-8 h-8 text-primary" /> Processing Telemetry & Spatial Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Auditable execution logs, post-run MCP home range consolidation, and Forest Department GIS exports.
          </p>
        </div>
        <button 
          onClick={fetchRuns} 
          className="bg-muted/30 hover:bg-muted/40 border border-border text-foreground px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Telemetry
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-muted/50 border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <HardDrive className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Space Reclaimed</div>
            <div className="text-xl font-black text-foreground">
              {Math.round(runs.reduce((acc, r) => acc + (r.diskSpaceSavedMB || 0), 0) / 1024)} <span className="text-sm text-emerald-500">GB</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Avg Throughput</div>
            <div className="text-xl font-black text-foreground">
              {Math.round(runs.reduce((acc, r) => acc + (r.throughputFps || 0), 0) / (runs.length || 1))} <span className="text-sm text-primary">FPS</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Blank Frames</div>
            <div className="text-xl font-black text-foreground">
              {(runs.reduce((acc, r) => acc + (r.blankCount || 0), 0)).toLocaleString()} <span className="text-sm text-accent">TRASHED</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Processed</div>
            <div className="text-xl font-black text-foreground">
              {(runs.reduce((acc, r) => acc + (r.processedImages || 0), 0)).toLocaleString()} <span className="text-sm text-blue-500">FRAMES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Runs */}
      <div className="glass-panel overflow-hidden border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="p-4 font-bold">Run ID</th>
                <th className="p-4 font-bold">Node / Station</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Progress</th>
                <th className="p-4 font-bold">Blanks</th>
                <th className="p-4 font-bold">Tiger Yield</th>
                <th className="p-4 font-bold">Speed</th>
                <th className="p-4 font-bold">Spatial Dossier</th>
                <th className="p-4 font-bold">T-Zero</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-muted-foreground font-mono text-sm">
                    No processing logs available. Ingest node data to begin telemetry.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const isCompleted = run.status === 'COMPLETED';
                  const isProcessing = run.status === 'PROCESSING';

                  return (
                    <tr key={run.runId} className="border-b border-border hover:bg-muted/30 transition-colors font-mono text-sm group">
                      <td className="p-4 font-bold text-foreground">
                        {run.runId}
                      </td>
                      <td className="p-4 text-muted-foreground group-hover:text-foreground transition-colors">
                        {run.stationId || 'PTR-C-01'}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded border uppercase ${
                          isCompleted ? 'bg-primary/10 text-primary border-primary/30' : 
                          isProcessing ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 
                          'bg-destructive/10 text-destructive border-destructive/30'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{run.processedImages}</span>
                          <span className="text-muted-foreground text-xs">/ {run.totalImages}</span>
                        </div>
                        {isProcessing && (
                          <div className="w-full bg-muted/30 h-1 mt-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full animate-pulse" 
                              style={{ width: `${(run.processedImages / run.totalImages) * 100}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-accent font-bold">
                        {run.blankCount}
                      </td>
                      <td className="p-4 text-primary font-bold">
                        {run.tigerCount}
                      </td>
                      <td className="p-4 text-foreground">
                        {run.throughputFps || 0} <span className="text-xs text-muted-foreground">FPS</span>
                      </td>
                      <td className="p-4">
                        {isCompleted ? (
                          <button
                            onClick={() => openSpatialDossier(run)}
                            className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Spatial Dossier</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">Computing...</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spatial Dossier Slide-Over / Modal */}
      {selectedRunDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                    Run Spatial Dossier
                  </span>
                  <span className="text-xs font-mono text-muted-foreground font-bold">{selectedRunDossier.runId}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-1">
                  Individual Capture Telemetry & Territorial Intelligence
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportRun(selectedRunDossier.runId, 'geojson')}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>GeoJSON</span>
                </button>
                <button
                  onClick={() => handleExportRun(selectedRunDossier.runId, 'csv')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <Link
                  to="/map"
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on Map</span>
                </Link>
                <button
                  onClick={() => setSelectedRunDossier(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              
              {/* Key Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 border border-border p-3.5 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Individuals Detected</div>
                  <div className="text-2xl font-bold font-heading text-primary mt-1">
                    {selectedRunDossier.individualCount || selectedRunDossier.individuals?.length || 0}
                  </div>
                </div>
                <div className="bg-muted/30 border border-border p-3.5 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Active Overlaps</div>
                  <div className="text-2xl font-bold font-heading text-rose-400 mt-1">
                    {selectedRunDossier.overlaps?.length || 0}
                  </div>
                </div>
                <div className="bg-muted/30 border border-border p-3.5 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Generated Timestamp</div>
                  <div className="text-xs font-mono text-foreground mt-2 truncate">
                    {new Date(selectedRunDossier.generatedAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Detected Individuals List */}
              <div>
                <h4 className="text-xs font-bold font-heading uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Captured Tiger Individuals & Spatial Metrics
                </h4>

                <div className="flex flex-col gap-3">
                  {(selectedRunDossier.individuals || []).map((ind) => (
                    <div key={ind.tigerId} className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">
                            {ind.tigerId}
                          </span>
                          <span className="text-sm font-bold text-foreground">{ind.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({ind.sex || 'UNKNOWN'})</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-muted-foreground mt-2">
                          <div>Captures in Run: <strong className="text-foreground">{ind.capturesInRun || 1}</strong></div>
                          <div>Total Captures: <strong className="text-foreground">{ind.totalHistoricalCaptures || 1}</strong></div>
                          <div>Home Range: <strong className="text-emerald-400">{ind.occupiedAreaKm2 || 0} km²</strong></div>
                          <div>Stations: <strong className="text-foreground">{(ind.runStations || []).join(', ') || 'N/A'}</strong></div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-muted-foreground shrink-0">
                        {ind.activityCentroid?.latitude && (
                          <div className="bg-background/80 border border-border px-3 py-1.5 rounded-lg text-[11px]">
                            Centroid: {ind.activityCentroid.latitude.toFixed(4)}, {ind.activityCentroid.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Territorial Overlaps */}
              {selectedRunDossier.overlaps?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold font-heading uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
                    <Network className="w-4 h-4 text-rose-400" /> Territorial Overlap & Interaction Signals
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRunDossier.overlaps.map((ov, idx) => (
                      <div key={idx} className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold font-mono text-foreground">
                            {ov.tiger1.name || ov.tiger1.tigerId} ⇄ {ov.tiger2.name || ov.tiger2.tigerId}
                          </span>
                          <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                            {ov.managementSignal || ov.interactionType}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          Intersection Area: <strong className="text-rose-400">{ov.overlapAreaKm2 || 0} km²</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
