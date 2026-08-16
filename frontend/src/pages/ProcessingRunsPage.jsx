import React, { useState, useEffect } from 'react';
import { Layers, Clock, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function ProcessingRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/runs');
      setRuns(res.data.runs || []);
    } catch (err) {
      console.error('Error fetching processing runs:', err);
    } finally {
      setLoading(false);
    }
  };

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
      </div>
    </div>
  );
}
