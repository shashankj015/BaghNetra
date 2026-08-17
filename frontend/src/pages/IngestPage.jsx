import React, { useState, useEffect } from 'react';
import { UploadCloud, Folder, Play, CheckCircle, AlertCircle, HardDrive, Clock, Activity, Sparkles, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function IngestPage() {
  const [folderPath, setFolderPath] = useState('sample-data/sd_card_run_01');
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('PTR-C-01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [singleFile, setSingleFile] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.get('/cameras');
        setStations(res.data.stations || []);
      } catch (err) {
        console.error('Error loading stations:', err);
      }
    };
    fetchStations();
  }, []);

  const handleStartBatchRun = async (e) => {
    e.preventDefault();
    if (!folderPath) return;

    setIsProcessing(true);
    setMessage('');
    try {
      const res = await api.post('/runs/start', {
        folderPath,
        stationId: selectedStation,
        options: { batchSize: 4 }
      });
      setCurrentRun(res.data);
      setMessage(`Batch ingestion initiated for ${res.data.totalImages} camera trap images.`);
      
      // Start polling run status
      pollRunProgress(res.data.runId);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
      setIsProcessing(false);
    }
  };

  const pollRunProgress = (runId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/runs/${runId}`);
        const runData = res.data.run;
        setProgress(runData);

        if (runData.status === 'COMPLETED' || runData.status === 'FAILED') {
          clearInterval(interval);
          setIsProcessing(false);
          setMessage(`Run finished with status: ${runData.status}`);
        }
      } catch (err) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleSingleImageUpload = async (e) => {
    e.preventDefault();
    if (!singleFile) return;

    setIsUploadingSingle(true);
    setSingleResult(null);
    try {
      const formData = new FormData();
      formData.append('file', singleFile);
      formData.append('stationId', selectedStation);

      const res = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSingleResult(res.data);
    } catch (err) {
      alert(`Upload error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploadingSingle(false);
    }
  };

  const percentComplete = progress && progress.totalImages > 0
    ? Math.round((progress.processedImages / progress.totalImages) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
          Camera Trap Ingestion & Streaming Batch Triage
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Ingest raw SD card folders without overloading RAM. High-throughput local CPU inference for Pench field offices.
        </p>
      </div>

      {/* SD Card Ingestion Panel */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', margin: '0 0 1rem' }}>
          Batch SD Card Folder Ingestion
        </h3>

        <form onSubmit={handleStartBatchRun} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.35rem' }}>
                SD Card / Camera Folder Path on Field Laptop:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Folder size={18} color="#10b981" />
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="e.g. D:\DCIM\100MEDIA or sample-data/sd_card_run_01"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.35rem' }}>
                Default Camera Station:
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
                disabled={isProcessing}
              >
                {stations.map(st => (
                  <option key={st.stationId} value={st.stationId}>
                    {st.stationId} — {st.name} ({st.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              • Safe Blank Quarantine Active • Camera Clock Drift Compensator Enabled
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing || !folderPath}
              style={{ opacity: isProcessing ? 0.6 : 1 }}
            >
              <Play size={16} /> {isProcessing ? 'Processing Batch...' : 'Start Camera Trap Triage'}
            </button>
          </div>
        </form>

        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: '0.85rem'
          }}>
            {message}
          </div>
        )}

        {/* Live Progress Bar & Telemetry */}
        {progress && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#f3f4f6' }}>
                Batch Progress: {progress.processedImages} / {progress.totalImages} Frames
              </span>
              <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#10b981' }}>
                {percentComplete}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${percentComplete}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Processing Speed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6' }}>{progress.throughputFps || 0} fps</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Blanks Quarantined</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#9ca3af' }}>{progress.blankCount || 0}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Tigers Detected</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>{progress.tigerCount || 0}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Review Needed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>{progress.reviewCount || 0}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Disk Space Saved</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{progress.diskSpaceSavedMB || 0} MB</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Single Frame Triage Tool */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#10b981" /> Instant Single Frame AI Classifier
          </h3>
          <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
            Real-Time Edge AI
          </span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Select or drop any camera trap photo below. The AI pipeline will immediately classify if it is <strong>🐅 Tiger</strong>, <strong>👤 Human</strong>, <strong>🌿 Blank</strong>, or <strong>🦌 Other Wildlife</strong>.
        </p>

        <form onSubmit={handleSingleImageUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px dashed rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#e5e7eb',
            fontSize: '0.85rem'
          }}>
            <UploadCloud size={18} color="#10b981" />
            <span>{singleFile ? singleFile.name : 'Choose or Drop Image File...'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSingleFile(file);
                  // Auto-submit immediately upon file selection
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('stationId', selectedStation);
                  setIsUploadingSingle(true);
                  setSingleResult(null);
                  api.post('/images/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  }).then(res => {
                    setSingleResult(res.data);
                  }).catch(err => {
                    alert('Error analyzing image: ' + (err.response?.data?.error || err.message));
                  }).finally(() => {
                    setIsUploadingSingle(false);
                  });
                }
              }}
              style={{ display: 'none' }}
            />
          </label>

          {isUploadingSingle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.85rem' }}>
              <Activity size={16} className="animate-spin" /> Running Neural Triage (~200ms)...
            </div>
          )}
        </form>

        {/* Instant Result Card */}
        {singleResult && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: singleResult.image.tigerDetected
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.1))'
              : (singleResult.aiAnalysis?.has_human || singleResult.image.detectedClass === 'human')
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.1))'
              : singleResult.image.blank
              ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(31, 41, 55, 0.3))'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.2))',
            border: `1px solid ${
              singleResult.image.tigerDetected ? '#f59e0b'
              : (singleResult.aiAnalysis?.has_human || singleResult.image.detectedClass === 'human') ? '#3b82f6'
              : singleResult.image.blank ? '#6b7280' : '#10b981'
            }`,
            borderRadius: '12px'
          }}>
            {/* Top Verdict Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>
                  {singleResult.image.tigerDetected ? '🐅'
                   : (singleResult.aiAnalysis?.has_human || singleResult.image.detectedClass === 'human') ? '👤'
                   : singleResult.image.blank ? '🌿' : '🦌'}
                </span>
                <div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: singleResult.image.tigerDetected ? '#fbbf24'
                      : (singleResult.aiAnalysis?.has_human || singleResult.image.detectedClass === 'human') ? '#60a5fa'
                      : singleResult.image.blank ? '#9ca3af' : '#34d399'
                  }}>
                    {singleResult.image.tigerDetected
                      ? `TIGER DETECTED — ${singleResult.image.tigerId ? `MATCH: ${singleResult.image.tigerId}` : 'NEW CANDIDATE'}`
                      : (singleResult.aiAnalysis?.has_human || singleResult.image.detectedClass === 'human')
                      ? 'HUMAN PATROL DETECTED (Privacy Safeguard Active)'
                      : singleResult.image.blank
                      ? 'BLANK / EMPTY FRAME (Quarantined)'
                      : `WILDLIFE DETECTED (${(singleResult.image.detectedClass || 'Animal').toUpperCase()})`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.2rem' }}>
                    {singleResult.image.fileName} • Processed in {singleResult.aiAnalysis?.processing_time_ms || 190} ms on CPU
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>AI Decision Status</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#10b981' }}>
                  {singleResult.aiAnalysis?.status || singleResult.image.reviewStatus}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Blank Score</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: singleResult.image.blank ? '#ef4444' : '#10b981' }}>
                  {Math.round(singleResult.image.blankConfidence * 100)}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Tiger Confidence</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: singleResult.image.tigerDetected ? '#f59e0b' : '#9ca3af' }}>
                  {Math.round(singleResult.image.tigerConfidence * 100)}%
                </div>
              </div>

              {singleResult.image.tigerDetected && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Stripe Match</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#3b82f6' }}>
                    {Math.round((singleResult.image.identificationConfidence || 0) * 100)}%
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Human Review</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: singleResult.image.reviewStatus === 'PENDING' ? '#ef4444' : '#10b981' }}>
                  {singleResult.image.reviewStatus === 'PENDING' ? 'QUEUED' : 'NOT REQUIRED'}
                </div>
              </div>
            </div>

            {/* Top Candidates for Tigers */}
            {singleResult.aiAnalysis?.candidates?.length > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                <strong>Top Identification Candidates:</strong>{' '}
                {singleResult.aiAnalysis.candidates.slice(0, 3).map((c, i) => (
                  <span key={i} style={{ marginLeft: '0.5rem', color: '#f3f4f6' }}>
                    {i + 1}. {c.tigerId} ({Math.round(c.similarity * 100)}%)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
