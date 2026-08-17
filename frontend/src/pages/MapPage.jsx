import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';
import { Layers, MapPin, Sparkles, Filter } from 'lucide-react';

export default function MapPage() {
  const [stations, setStations] = useState([]);
  const [tigers, setTigers] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [selectedTiger, setSelectedTiger] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [stRes, tgRes, ovRes] = await Promise.all([
        api.get('/cameras'),
        api.get('/tigers'),
        api.get('/tigers/overlaps')
      ]);
      setStations(stRes.data.stations || []);
      setTigers(tgRes.data.tigers || []);
      setOverlaps(ovRes.data.overlaps || []);
    } catch (err) {
      console.error('Error loading GIS map data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 120px)' }}>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: '#f3f4f6', margin: 0 }}>
            Pench Tiger Reserve Interactive GIS Telemetry Map
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Live territorial polygon overlays, activity centroids, camera grid, and territorial interaction zones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedTiger}
            onChange={(e) => setSelectedTiger(e.target.value)}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.8rem'
            }}
          >
            <option value="">Show All Resident Individuals</option>
            {tigers.map(t => (
              <option key={t.tigerId} value={t.tigerId}>
                Highlight: {t.name} ({t.tigerId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Map & Overlap Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        <LeafletTigerMap
          stations={stations}
          tigers={tigers}
          height="100%"
          selectedTigerId={selectedTiger || null}
        />

        {/* Right Info: Territorial Overlaps */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', color: '#f3f4f6', margin: '0 0 0.5rem' }}>
            Territorial Overlap Analysis
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
            Territorial overlap serves as an early management signal for breeding pairs or territorial conflict.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {overlaps.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                No significant overlap detected between resident ranges.
              </div>
            ) : (
              overlaps.map((ov, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${ov.interactionType === 'MATING_PAIR_OVERLAP' ? '#ec4899' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: '#f3f4f6' }}>
                    <span>{ov.tiger1.tigerId} ⇄ {ov.tiger2.tigerId}</span>
                    <span style={{ fontSize: '0.65rem', color: ov.interactionType === 'MATING_PAIR_OVERLAP' ? '#ec4899' : '#f59e0b' }}>
                      {ov.interactionType === 'MATING_PAIR_OVERLAP' ? 'Breeding Overlap' : 'Territorial Stress'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Shared Stations: {ov.sharedStations.join(', ') || 'Adjacent ranges'}<br />
                    Centroid Distance: {ov.centroidDistanceKm} km
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
