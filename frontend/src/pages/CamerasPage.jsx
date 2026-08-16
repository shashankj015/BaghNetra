import React, { useState, useEffect } from 'react';
import { Camera, Plus, MapPin, Battery, HardDrive, Shield, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CamerasPage() {
  const [stations, setStations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    stationId: '',
    name: '',
    latitude: 21.6840,
    longitude: 79.3250,
    zone: 'CORE',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cameras');
      setStations(res.data.stations || []);
    } catch (err) {
      console.error('Error loading stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cameras', formData);
      setShowAddModal(false);
      setFormData({
        stationId: '',
        name: '',
        latitude: 21.6840,
        longitude: 79.3250,
        zone: 'CORE',
        status: 'ACTIVE'
      });
      fetchStations();
    } catch (err) {
      alert(`Error creating station: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Pench Camera Trap Grid Network
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Station coordinates, zoning (Core / Buffer / Village Adjacent) & field hardware telemetry.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Deploy New Station
        </button>
      </div>

      {/* Grid of Stations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {stations.map((st) => (
          <div key={st.stationId} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span className={`badge ${st.zone === 'CORE' ? 'badge-core' : st.zone === 'BUFFER' ? 'badge-buffer' : 'badge-village'}`}>
                  {st.zone}
                </span>
                <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: '0.35rem 0 0' }}>
                  {st.name}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: st.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>
                ● {st.status}
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: '0.75rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="#10b981" />
                <span>Station ID: <strong style={{ color: '#f3f4f6' }}>{st.stationId}</strong></span>
              </div>
              <div>GPS: {st.latitude?.toFixed(4)}, {st.longitude?.toFixed(4)}</div>
              <div>Total Captures: <strong style={{ color: '#10b981' }}>{st.totalCaptures || 0}</strong></div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280' }}>
              <span>Battery: 95%</span>
              <span>SD: 64GB High-Speed</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Station Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#f3f4f6', margin: '0 0 1rem' }}>Deploy Camera Station</h3>
            <form onSubmit={handleCreateStation} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Station ID:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PTR-C-05"
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Station Name / Location:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karmajhiri Stream Crossing"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Monitoring Zone:</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  style={{ width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="CORE">CORE (Pench Core National Park)</option>
                  <option value="BUFFER">BUFFER (Buffer Forest Sector)</option>
                  <option value="VILLAGE_ADJACENT">VILLAGE_ADJACENT (Community Boundary)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
