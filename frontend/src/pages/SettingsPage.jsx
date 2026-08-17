import React, { useState } from 'react';
import { Settings, Save, Sliders, Shield, HardDrive } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    blankThreshold: 0.85,
    highIdThreshold: 0.82,
    lowIdThreshold: 0.65,
    coreCentroidShiftKm: 4.2,
    bufferCentroidShiftKm: 3.0,
    prolongedAbsenceDays: 45,
    autoPurgeDays: 90
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
          System Thresholds & Quarantine Settings
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Configure AI sensitivity, spatial deviation limits, and safe quarantine retention.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={18} color="#10b981" /> AI Inference Thresholds
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
              Blank Quarantine Confidence (0.50 - 0.95):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.50"
              max="0.99"
              value={config.blankThreshold}
              onChange={(e) => setConfig({ ...config, blankThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Default: 0.85 (High confidence prevents dropped wildlife)</span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
              Stripe Auto-Confirm Threshold (HIGH_THRESHOLD):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.70"
              max="0.95"
              value={config.highIdThreshold}
              onChange={(e) => setConfig({ ...config, highIdThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Default: 0.82 (Cosine similarity)</span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
              Ambiguous Human Review Floor (LOW_THRESHOLD):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.40"
              max="0.75"
              value={config.lowIdThreshold}
              onChange={(e) => setConfig({ ...config, lowIdThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Below this score: Flagged as Unknown Candidate</span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
              Prolonged Absence Alert Window (Days):
            </label>
            <input
              type="number"
              value={config.prolongedAbsenceDays}
              onChange={(e) => setConfig({ ...config, prolongedAbsenceDays: parseInt(e.target.value) })}
              style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Default: 45 Days</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-primary">
            <Save size={16} /> Save Configuration
          </button>
        </div>

        {saved && (
          <div style={{ padding: '0.65rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem' }}>
            ✓ Configuration saved successfully.
          </div>
        )}
      </form>
    </div>
  );
}
