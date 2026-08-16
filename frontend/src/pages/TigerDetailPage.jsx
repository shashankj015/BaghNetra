import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';

export default function TigerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchTigerDetails();
  }, [id]);

  const fetchTigerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tigers/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching tiger details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateOccupancy = async () => {
    setRecalculating(true);
    try {
      await api.post(`/tigers/${id}/regenerate-occupancy`);
      await fetchTigerDetails();
    } catch (err) {
      alert(`Error recalculating occupancy: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading Tiger Profile...</div>;
  }

  if (!data || !data.tiger) {
    return <div style={{ color: '#ef4444', textAlign: 'center', padding: '3rem' }}>Tiger ID not found.</div>;
  }

  const { tiger, movementRecords, recentImages } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Button & Top Header */}
      <div>
        <Link to="/tigers" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Tiger Catalogue
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-tiger" style={{ fontSize: '0.85rem' }}>{tiger.tigerId}</span>
              <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>{tiger.name}</h1>
              <span className="badge badge-core">{tiger.status}</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {tiger.healthNotes || 'Resident individual monitored in Pench Tiger Reserve.'}
            </p>
          </div>

          <button
            onClick={handleRecalculateOccupancy}
            className="btn-secondary"
            disabled={recalculating}
          >
            <RefreshCw size={16} className={recalculating ? 'spin' : ''} /> {recalculating ? 'Recalculating...' : 'Regenerate Occupancy Area'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Estimated Territory Area</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
            {tiger.occupiedArea || 'N/A'} km²
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>100% Minimum Convex Polygon</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Total Camera Captures</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
            {tiger.totalCaptures || movementRecords?.length || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Across {tiger.stations?.length || 0} stations</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Activity Centroid</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6', marginTop: '0.25rem' }}>
            {tiger.activityCentroid?.latitude?.toFixed(4)}, {tiger.activityCentroid?.longitude?.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Mean spatial location</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Monitoring History</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6', marginTop: '0.35rem' }}>
            {new Date(tiger.firstSeen).toLocaleDateString()} — {new Date(tiger.lastSeen).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Sex: {tiger.sex} • Age: ~{tiger.estimatedAge}y</div>
        </div>
      </div>

      {/* Territory Map + Movement Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Map */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: '0 0 0.75rem' }}>
            Territorial Home Range & Centroid
          </h3>
          <LeafletTigerMap
            tigers={[tiger]}
            center={[tiger.activityCentroid?.latitude || 21.6950, tiger.activityCentroid?.longitude || 79.3500]}
            zoom={12}
            height="380px"
            selectedTigerId={tiger.tigerId}
          />
        </div>

        {/* Movement Telemetry History */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: '0 0 0.75rem' }}>
            Camera Station Capture Trail
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(!movementRecords || movementRecords.length === 0) ? (
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No individual movement captures recorded yet.</p>
            ) : (
              movementRecords.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #10b981',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#f3f4f6' }}>{rec.stationId}</strong>
                    <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                      {new Date(rec.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    Zone: {rec.zone} • Confidence: {Math.round((rec.confidence || 0.9) * 100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
