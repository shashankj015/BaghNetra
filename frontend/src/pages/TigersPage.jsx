import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter } from 'lucide-react';
import api from '../services/api';

export default function TigersPage() {
  const [tigers, setTigers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTigers();
  }, [statusFilter]);

  const fetchTigers = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/tigers?status=${statusFilter}` : '/tigers';
      const res = await api.get(url);
      setTigers(res.data.tigers || []);
    } catch (err) {
      console.error('Error loading tigers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tigers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tigerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Pench Resident Tiger Catalogue
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Biometric flank stripe registry, activity centroids & occupied home range polygons.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by Tiger ID (BT001) or Name (Collarwali)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.6rem 0.85rem 0.6rem 2.25rem',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.85rem'
          }}
        >
          <option value="">All Statuses</option>
          <option value="RESIDENT">Resident</option>
          <option value="DISPERSING">Dispersing</option>
          <option value="TRANSIENT">Transient</option>
          <option value="ABSENT">Absent</option>
        </select>
      </div>

      {/* Tiger Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((tiger) => (
          <Link
            key={tiger.tigerId}
            to={`/tigers/${tiger.tigerId}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span className="badge badge-tiger" style={{ marginBottom: '0.35rem' }}>
                    {tiger.tigerId}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', margin: 0 }}>
                    {tiger.name}
                  </h3>
                </div>
                <span className={`badge ${tiger.status === 'RESIDENT' ? 'badge-core' : tiger.status === 'DISPERSING' ? 'badge-buffer' : 'badge-blank'}`}>
                  {tiger.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
                <div>Sex: <strong style={{ color: '#f3f4f6' }}>{tiger.sex}</strong></div>
                <div>Age: <strong style={{ color: '#f3f4f6' }}>~{tiger.estimatedAge} yrs</strong></div>
                <div>Occupied Area: <strong style={{ color: '#10b981' }}>{tiger.occupiedArea || 'N/A'} km²</strong></div>
                <div>Captures: <strong style={{ color: '#f59e0b' }}>{tiger.totalCaptures || 0}</strong></div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.7rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                <span>Stations: {tiger.stations?.length || 0} monitored</span>
                <span>Last: {new Date(tiger.lastSeen).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
