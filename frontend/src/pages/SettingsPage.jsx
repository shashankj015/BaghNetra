import React, { useState } from 'react';
<<<<<<< HEAD
import { Settings, Save, Sliders, Shield, HardDrive } from 'lucide-react';
=======
import { Settings, Save, Sliders, Shield, HardDrive, Cpu, AlertTriangle, Fingerprint } from 'lucide-react';
>>>>>>> origin/Trivedi-branch
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
<<<<<<< HEAD
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
=======
    <div className="flex flex-col gap-6 pb-10 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-8 h-8 text-primary animate-[spin_10s_linear_infinite]" /> System Configuration
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Adjust AI inference thresholds, spatial deviation limits, and data retention policies.
          </p>
        </div>
        
        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase px-4 py-2 rounded-lg flex items-center gap-2">
            ✓ CONFIG SECURED
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* CV Thresholds */}
        <div className="glass-panel p-6 rounded-xl border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 mb-5 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" /> Biometric Inference Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Blank Quarantine Confidence (0.50 - 0.99)
              </label>
              <input
                type="number" step="0.01" min="0.50" max="0.99"
                value={config.blankThreshold}
                onChange={(e) => setConfig({ ...config, blankThreshold: parseFloat(e.target.value) })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 font-mono"
              />
              <span className="text-[10px] text-muted-foreground/60 font-mono">Default: 0.85 (High confidence prevents dropped wildlife frames)</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Stripe Auto-Confirm (Cosine Sim.)
              </label>
              <input
                type="number" step="0.01" min="0.70" max="0.95"
                value={config.highIdThreshold}
                onChange={(e) => setConfig({ ...config, highIdThreshold: parseFloat(e.target.value) })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 font-mono"
              />
              <span className="text-[10px] text-muted-foreground/60 font-mono">Default: 0.82 (Bypasses human review queue)</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Ambiguous Review Floor (Cosine Sim.)
              </label>
              <input
                type="number" step="0.01" min="0.40" max="0.75"
                value={config.lowIdThreshold}
                onChange={(e) => setConfig({ ...config, lowIdThreshold: parseFloat(e.target.value) })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 font-mono"
              />
              <span className="text-[10px] text-muted-foreground/60 font-mono">Below this score: Flagged as UNKNOWN ASSET</span>
            </div>
          </div>
        </div>

        {/* Spatial Intelligence */}
        <div className="glass-panel p-6 rounded-xl border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" /> Spatial Deviation Alerts
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Core Centroid Shift Tolerance (Km)
              </label>
              <input
                type="number" step="0.1"
                value={config.coreCentroidShiftKm}
                onChange={(e) => setConfig({ ...config, coreCentroidShiftKm: parseFloat(e.target.value) })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 font-mono"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Prolonged Absence Window (Days)
              </label>
              <input
                type="number"
                value={config.prolongedAbsenceDays}
                onChange={(e) => setConfig({ ...config, prolongedAbsenceDays: parseInt(e.target.value) })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 font-mono"
              />
              <span className="text-[10px] text-muted-foreground/60 font-mono">Triggers alert if asset is unseen beyond this period.</span>
            </div>
          </div>
        </div>

        {/* System Operations */}
        <div className="glass-panel p-6 rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
               <HardDrive className="w-6 h-6 text-red-500" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Quarantine Purge Policy</h4>
               <p className="text-[10px] font-mono text-muted-foreground mt-1">Permanently delete 'Blank' frames after {config.autoPurgeDays} days to reclaim storage.</p>
             </div>
          </div>
          <button type="button" className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors">
            Force Purge Now
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end border-t border-border pt-6 mt-2">
          <button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Save className="w-4 h-4" /> Commit Changes to Kernel
          </button>
        </div>

>>>>>>> origin/Trivedi-branch
      </form>
    </div>
  );
}
