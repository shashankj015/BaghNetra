import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { AlertTriangle, CheckCircle, ShieldAlert, Filter, Info, MapPin, Clock } from 'lucide-react';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
=======
import { AlertTriangle, CheckCircle, ShieldAlert, Filter, Info, MapPin, Clock, Search, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const MOCK_ALERTS = [
  {
    alertId: 'ALT-991',
    severity: 'CRITICAL',
    title: 'Dispersing Tiger Approaching Village Buffer',
    description: 'Target BT004 (Raiyakassa Male) detected at PTR-B-14 moving South towards Turia village boundary. Distance: 1.2km.',
    timestamp: '2023-12-05T08:30:00Z',
    tigerId: 'BT004',
    stationId: 'PTR-B-14',
    confidence: 0.99,
    acknowledged: false,
    newEvidence: { direction: 'SOUTH', speed_kmh: 4.2, nearest_village: 'Turia' },
    previousEvidence: { last_seen: 'CORE_ZONE', distance_drift: 8.5 }
  },
  {
    alertId: 'ALT-992',
    severity: 'WARNING',
    title: 'Territorial Conflict Imminent',
    description: 'Overlapping presence of BT001 (Collarwali) and BT002 (T-15) at Karmajhiri Stream within 4 hour window.',
    timestamp: '2023-12-05T14:15:00Z',
    tigerId: 'BT001 / BT002',
    stationId: 'PTR-C-02',
    confidence: 0.92,
    acknowledged: true,
    acknowledgedBy: 'Warden Singh',
    newEvidence: { spatial_overlap: true, time_delta_hrs: 3.5 },
    previousEvidence: { baseline_separation_km: 12.0 }
  }
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
>>>>>>> origin/Trivedi-branch
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    fetchAlerts();
  }, [severityFilter, typeFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = '/alerts?';
      if (severityFilter) url += `severity=${severityFilter}&`;
      if (typeFilter) url += `type=${typeFilter}&`;

      const res = await api.get(url);
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/acknowledge`);
      fetchAlerts();
=======
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        let url = '/alerts?';
        if (severityFilter) url += `severity=${severityFilter}&`;
        if (typeFilter) url += `type=${typeFilter}&`;

        const res = await api.get(url);
        if (res.data.alerts && res.data.alerts.length > 0) {
          setAlerts(res.data.alerts);
        }
      } catch (err) {
        console.warn('Backend unavailable, using mock alerts data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [severityFilter, typeFilter]);

  const handleAcknowledge = async (alertId) => {
    try {
      // Simulate API call
      // await api.put(`/alerts/${alertId}/acknowledge`);
      
      setAlerts(prev => prev.map(a => 
        a.alertId === alertId ? { ...a, acknowledged: true, acknowledgedBy: 'Local Terminal' } : a
      ));
>>>>>>> origin/Trivedi-branch
    } catch (err) {
      alert(`Error acknowledging alert: ${err.message}`);
    }
  };

  return (
<<<<<<< HEAD
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Movement Deviation & Conflict Alert Feed
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Centroid shifts, buffer excursions, village-adjacent incursions & prolonged absence telemetry.
=======
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" /> Kinetic Action Desk
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono max-w-2xl">
            Triage center for centroid shifts, buffer excursions, village-adjacent incursions, and telemetry deviations.
>>>>>>> origin/Trivedi-branch
          </p>
        </div>
      </div>

      {/* Filters Bar */}
<<<<<<< HEAD
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.85rem'
          }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL (Village Incursion / Prolonged Absence)</option>
          <option value="WARNING">WARNING (Buffer Dispersal / Centroid Shift)</option>
          <option value="INFO">INFO (Survey Effort / New Camera Deployment)</option>
=======
      <div className="flex flex-col md:flex-row gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Filter by Target ID or Node..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer w-full md:w-auto"
        >
          <option value="">All Threat Levels</option>
          <option value="CRITICAL">CRITICAL (Village Incursion)</option>
          <option value="WARNING">WARNING (Territorial Stress)</option>
          <option value="INFO">INFO (System Updates)</option>
>>>>>>> origin/Trivedi-branch
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
<<<<<<< HEAD
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.85rem'
          }}
        >
          <option value="">All Deviation Types</option>
          <option value="VILLAGE_ADJACENT_RISK">Village Adjacent Incursion</option>
          <option value="RANGE_CENTROID_SHIFT">Range Centroid Shift</option>
          <option value="BUFFER_ENCROACHMENT">Buffer Dispersal</option>
          <option value="FIRST_STATION_CAPTURE">First Station Capture</option>
=======
          className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer w-full md:w-auto"
        >
          <option value="">All Deviation Signatures</option>
          <option value="VILLAGE_ADJACENT_RISK">Village Adjacent Incursion</option>
          <option value="RANGE_CENTROID_SHIFT">Range Centroid Shift</option>
          <option value="BUFFER_ENCROACHMENT">Buffer Dispersal</option>
>>>>>>> origin/Trivedi-branch
          <option value="PROLONGED_ABSENCE">Prolonged Absence</option>
        </select>
      </div>

      {/* Alert Cards Feed */}
<<<<<<< HEAD
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#f3f4f6', margin: 0 }}>No Matching Alerts</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Territorial stability confirmed across all active monitoring sectors.
=======
      <div className="flex flex-col gap-4">
        {alerts.length === 0 ? (
          <div className="glass-panel p-12 text-center flex flex-col items-center gap-4 border border-emerald-500/20">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center cinematic-glow">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-widest">Sector Secure</h3>
            <p className="text-muted-foreground text-sm font-mono">
              Territorial stability confirmed across all active monitoring nodes. No kinetic threats detected.
>>>>>>> origin/Trivedi-branch
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
<<<<<<< HEAD
            const borderColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
            const bgColor = isCritical ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';

            return (
              <div
                key={alert.alertId}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  borderLeft: `4px solid ${borderColor}`,
                  background: bgColor
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${isCritical ? 'badge-village' : isWarning ? 'badge-buffer' : 'badge-core'}`}>
                        {alert.severity}
                      </span>
                      <span className="badge badge-tiger">{alert.tigerId}</span>
                      {alert.isSurveyArtifact && (
                        <span className="badge badge-blank">Survey Effort Expansion</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', margin: '0.25rem 0' }}>
                      {alert.title}
                    </h3>
                  </div>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(alert.alertId)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <CheckCircle size={14} /> Acknowledge Alert
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                      ✓ Acknowledged by {alert.acknowledgedBy}
                    </span>
                  )}
                </div>

                <p style={{ color: '#d1d5db', fontSize: '0.85rem', margin: '0.5rem 0 0.75rem' }}>
                  {alert.description}
                </p>

                {/* Evidence breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.65rem', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#9ca3af' }}>Historical Evidence:</strong>
                    <pre style={{ margin: '0.2rem 0 0', color: '#f3f4f6', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {JSON.stringify(alert.previousEvidence, null, 1)}
                    </pre>
                  </div>
                  <div>
                    <strong style={{ color: '#9ca3af' }}>New Run Detection:</strong>
                    <pre style={{ margin: '0.2rem 0 0', color: '#f3f4f6', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {JSON.stringify(alert.newEvidence, null, 1)}
                    </pre>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginTop: '0.65rem' }}>
                  <span>Station: {alert.stationId || 'Sector Level'} • Timestamp: {new Date(alert.timestamp).toLocaleString()}</span>
                  <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
=======
            
            return (
              <div
                key={alert.alertId}
                className={`glass-panel p-6 rounded-xl border-l-4 relative overflow-hidden group ${
                  isCritical ? 'border-l-destructive bg-destructive/5' : 
                  isWarning ? 'border-l-accent bg-accent/5' : 
                  'border-l-primary bg-primary/5'
                }`}
              >
                
                {/* Background Scanline */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-30 z-0 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row gap-6">
                  
                  {/* Info Column */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border uppercase ${
                          isCritical ? 'bg-destructive/10 text-destructive border-destructive/30' : 
                          isWarning ? 'bg-accent/10 text-accent border-accent/30' : 
                          'bg-primary/10 text-primary border-primary/30'
                        }`}>
                          {alert.severity}
                        </span>
                        {alert.tigerId && (
                          <span className="text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border border-white/20 bg-muted/30 text-foreground">
                            TARGET: {alert.tigerId}
                          </span>
                        )}
                      </div>
                      
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.alertId)}
                          className="bg-muted/40 hover:bg-white/20 border border-white/20 text-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-3 h-3" /> Acknowledge
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold font-mono tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/30">
                          ✓ ACK BY {alert.acknowledgedBy}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl font-heading font-bold mb-2 uppercase ${isCritical ? 'text-destructive' : isWarning ? 'text-accent' : 'text-primary'}`}>
                      {alert.title}
                    </h3>
                    
                    <p className="text-sm text-foreground/80 leading-relaxed font-mono mb-4 border-b border-border pb-4">
                      {alert.description}
                    </p>

                    <div className="flex flex-wrap justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> NODE: {alert.stationId || 'SECTOR WIDE'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> T-MINUS: {new Date(alert.timestamp).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> CONF: {Math.round((alert.confidence || 0.99) * 100)}%</span>
                    </div>
                  </div>

                  {/* Evidence Breakdown Column */}
                  <div className="lg:w-[400px] flex flex-col gap-3">
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <div className="text-[9px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Historical Baseline
                      </div>
                      <pre className="text-[10px] text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(alert.previousEvidence, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <div className="text-[9px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-destructive' : 'bg-accent'}`}></div> Active Deviation
                      </div>
                      <pre className={`text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed ${isCritical ? 'text-red-300' : 'text-orange-300'}`}>
                        {JSON.stringify(alert.newEvidence, null, 2)}
                      </pre>
                    </div>
                  </div>

>>>>>>> origin/Trivedi-branch
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
