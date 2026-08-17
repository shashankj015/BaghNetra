import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Filter, Info, MapPin, Clock } from 'lucide-react';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    } catch (err) {
      alert(`Error acknowledging alert: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Movement Deviation & Conflict Alert Feed
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Centroid shifts, buffer excursions, village-adjacent incursions & prolonged absence telemetry.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
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
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          <option value="PROLONGED_ABSENCE">Prolonged Absence</option>
        </select>
      </div>

      {/* Alert Cards Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#f3f4f6', margin: 0 }}>No Matching Alerts</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Territorial stability confirmed across all active monitoring sectors.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
