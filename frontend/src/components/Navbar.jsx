import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Shield, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: '60px',
      background: 'rgba(11, 16, 28, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>
          Monitoring Jurisdiction: <strong style={{ color: '#f3f4f6' }}>Pench National Park & Buffer</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Officer Profile Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#000000'
          }}>
            {user?.name ? user.name[0] : 'P'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f3f4f6', lineHeight: 1.2 }}>
              {user?.name || 'Pench Officer'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981', textTransform: 'uppercase', fontWeight: '600' }}>
              {user?.badgeNumber || 'PTR-DFO'} • {user?.role || 'Biologist'}
            </div>
          </div>
        </div>

        {/* Quick Ingest Button */}
        <Link to="/ingest" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
          + New SD Ingestion
        </Link>
      </div>
    </header>
  );
}
