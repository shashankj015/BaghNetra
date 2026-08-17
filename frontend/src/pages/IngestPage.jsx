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
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', margin: '0 0 0.5rem' }}>
          Single Frame Live Inspection
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Upload an individual camera trap frame to view the live multi-stage neural network decision tree.
        </p>

        <form onSubmit={handleSingleImageUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSingleFile(e.target.files[0])}
            style={{ color: '#9ca3af', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn-secondary" disabled={!singleFile || isUploadingSingle}>
            <UploadCloud size={16} /> {isUploadingSingle ? 'Analyzing...' : 'Run Neural Triage'}
          </button>
        </form>

        {singleResult && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <h4 style={{ color: '#f3f4f6', margin: '0 0 0.5rem' }}>Neural Triage Result:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div><strong>Blank Status:</strong> {singleResult.image.blank ? 'BLANK (Quarantined)' : 'NON_BLANK (Wildlife)'}</div>
              <div><strong>Blank Score:</strong> {Math.round(singleResult.image.blankConfidence * 100)}%</div>
              <div><strong>Tiger Detected:</strong> {singleResult.image.tigerDetected ? 'YES' : 'NO'}</div>
              <div><strong>Predicted ID:</strong> {singleResult.image.tigerId || 'Unknown Candidate'}</div>
              <div><strong>ID Confidence:</strong> {Math.round(singleResult.image.identificationConfidence * 100)}%</div>
              <div><strong>Review Needed:</strong> {singleResult.image.reviewStatus === 'PENDING' ? 'YES' : 'NO'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
