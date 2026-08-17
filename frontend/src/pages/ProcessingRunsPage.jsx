import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Layers, Clock, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function ProcessingRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);
=======
import { Layers, Clock, HardDrive, CheckCircle2, AlertCircle, RefreshCw, Activity, Cpu } from 'lucide-react';
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
    createdAt: '2023-11-20T08:15:00Z'
  },
  {
    runId: 'RUN-2023-11-21-002',
    stationId: 'PTR-B-14 (Turia)',
    status: 'COMPLETED',
    processedImages: 8920,
    totalImages: 8920,
    blankCount: 8800,
    tigerCount: 2,
    throughputFps: 38.2,
    diskSpaceSavedMB: 7600,
    createdAt: '2023-11-21T10:30:00Z'
  },
  {
    runId: 'RUN-2023-11-25-003',
    stationId: 'PTR-C-05 (Karmajhiri)',
    status: 'PROCESSING',
    processedImages: 1200,
    totalImages: 5000,
    blankCount: 1150,
    tigerCount: 1,
    throughputFps: 45.1,
    diskSpaceSavedMB: 980,
    createdAt: new Date().toISOString()
  }
];

export default function ProcessingRunsPage() {
  const [runs, setRuns] = useState(MOCK_RUNS);
  const [loading, setLoading] = useState(true);
>>>>>>> origin/Trivedi-branch

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/runs');
<<<<<<< HEAD
      setRuns(res.data.runs || []);
    } catch (err) {
      console.error('Error fetching processing runs:', err);
=======
      if (res.data.runs && res.data.runs.length > 0) {
        setRuns(res.data.runs);
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock processing runs.');
>>>>>>> origin/Trivedi-branch
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Batch Processing Run History
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Auditable execution logs, throughput benchmarks & quarantine disk space reclamation.
          </p>
        </div>
        <button onClick={fetchRuns} className="btn-secondary">
          <RefreshCw size={16} /> Refresh Runs
        </button>
      </div>

      {/* Table of Runs */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#9ca3af' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Run Identifier</th>
              <th style={{ padding: '0.85rem 1rem' }}>Station</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Images</th>
              <th style={{ padding: '0.85rem 1rem' }}>Blanks</th>
              <th style={{ padding: '0.85rem 1rem' }}>Tigers</th>
              <th style={{ padding: '0.85rem 1rem' }}>Speed (FPS)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Space Saved</th>
              <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                  No batch runs executed yet. Ingest an SD card folder to start.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.runId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#f3f4f6' }}>
                    {run.runId}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#9ca3af' }}>
                    {run.stationId || 'PTR-C-01'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${run.status === 'COMPLETED' ? 'badge-core' : run.status === 'PROCESSING' ? 'badge-buffer' : 'badge-village'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#f3f4f6' }}>
                    {run.processedImages} / {run.totalImages}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#9ca3af' }}>
                    {run.blankCount}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#f59e0b', fontWeight: '700' }}>
                    {run.tigerCount}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#3b82f6', fontWeight: '600' }}>
                    {run.throughputFps || 0} fps
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#10b981' }}>
                    {run.diskSpaceSavedMB || 0} MB
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
=======
  useEffect(() => {
    fetchRuns();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Layers className="w-8 h-8 text-primary" /> Processing Telemetry
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Auditable execution logs, throughput benchmarks & quarantine disk space reclamation.
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
                <th className="p-4 font-bold">Blanks Filtered</th>
                <th className="p-4 font-bold">Tiger Yield</th>
                <th className="p-4 font-bold">Speed</th>
                <th className="p-4 font-bold">Storage Delta</th>
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
                        {run.stationId || 'UNKNOWN_NODE'}
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
                      <td className="p-4 text-emerald-400 font-bold flex items-center gap-1">
                        -{Math.round((run.diskSpaceSavedMB || 0) / 1024 * 10) / 10} <span className="text-xs text-muted-foreground">GB</span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
>>>>>>> origin/Trivedi-branch
      </div>
    </div>
  );
}
