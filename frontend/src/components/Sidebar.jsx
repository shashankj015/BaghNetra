import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  Sparkles,
  Camera,
  MapPin,
  CheckSquare,
  AlertTriangle,
  Cpu,
  Settings,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const navItems = [
  { path: '/dashboard', label: 'Telemetry Overview', icon: LayoutDashboard },
  { path: '/ingest', label: 'SD Ingest & Triage', icon: UploadCloud },
  { path: '/runs', label: 'Processing Runs', icon: Layers },
  { path: '/tigers', label: 'Tiger Catalogue', icon: Sparkles },
  { path: '/cameras', label: 'Camera Stations', icon: Camera },
  { path: '/map', label: 'Reserve GIS Map', icon: MapPin },
  { path: '/review', label: 'Human Review Station', icon: CheckSquare, badgeKey: 'pendingReviews' },
  { path: '/alerts', label: 'Deviation Alerts', icon: AlertTriangle, badgeKey: 'activeAlerts' },
  { path: '/models', label: 'AI Models & Metrics', icon: Cpu },
  { path: '/settings', label: 'Thresholds & Settings', icon: Settings },
];

export default function Sidebar() {
  const [counts, setCounts] = useState({ pendingReviews: 0, activeAlerts: 0 });

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [revRes, altRes] = await Promise.all([
          api.get('/reviews/pending?limit=1'),
          api.get('/alerts/stats')
        ]);
        setCounts({
          pendingReviews: revRes.data.total || 0,
          activeAlerts: altRes.data.activeAlerts || 0
        });
      } catch (err) {
        // silent fallback
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'rgba(11, 16, 28, 0.95)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.75rem',
      zIndex: 40
    }}>
      {/* Brand Header */}
      <div style={{ padding: '0 0.75rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f3f4f6', letterSpacing: '-0.02em' }}>
              Bagh<span style={{ color: '#10b981' }}>Netra</span>
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pench Tiger Reserve
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ marginTop: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#9ca3af',
                background: isActive ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {badgeValue > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  background: item.badgeKey === 'activeAlerts' ? '#ef4444' : '#f59e0b',
                  color: '#ffffff'
                }}>
                  {badgeValue}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Offline Status Badge */}
      <div style={{
        marginTop: 'auto',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '0.75rem', color: '#d1d5db', fontWeight: '500' }}>Local AI Engine</span>
        </div>
        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '700', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
          OFFLINE
        </span>
      </div>
    </aside>
  );
}
