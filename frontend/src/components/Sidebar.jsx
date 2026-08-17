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
<<<<<<< HEAD
  ShieldCheck
=======
  ShieldCheck,
  Activity,
  BarChart3,
  HardDrive
>>>>>>> origin/Trivedi-branch
} from 'lucide-react';
import api from '../services/api';

const navItems = [
<<<<<<< HEAD
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
=======
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/ingest', label: 'AI Ingest & Re-ID', icon: UploadCloud },
  { path: '/cameras', label: 'Camera Traps', icon: Camera },
  { path: '/tigers', label: 'Tigers', icon: Sparkles },
  { path: '/movement', label: 'Movement Intelligence', icon: Activity },
  { path: '/map', label: 'Occupancy Map', icon: MapPin },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle, badgeKey: 'activeAlerts' },
  { path: '/review', label: 'Review Queue', icon: CheckSquare, badgeKey: 'pendingReviews' },
  { path: '/runs', label: 'Processing Runs', icon: Layers },
  { path: '/models', label: 'AI Models', icon: Cpu },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
>>>>>>> origin/Trivedi-branch
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
<<<<<<< HEAD
        // silent fallback
=======
        // Fallback for offline mode demo
        setCounts({ pendingReviews: 24, activeAlerts: 3 });
>>>>>>> origin/Trivedi-branch
      }
    };

    fetchCounters();
<<<<<<< HEAD
    const interval = setInterval(fetchCounters, 8000);
=======
    const interval = setInterval(fetchCounters, 15000);
>>>>>>> origin/Trivedi-branch
    return () => clearInterval(interval);
  }, []);

  return (
<<<<<<< HEAD
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
=======
    <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-card/70 border-r border-border flex flex-col p-5 z-40 backdrop-blur-xl transition-colors">
      
      {/* Brand Header */}
      <div className="pb-6 border-b border-border mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center cinematic-glow shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-extrabold text-foreground tracking-tight flex items-center">
              Bagh<span className="text-primary ml-1 font-black">Netra</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono mt-0.5">
              Forest Intelligence
>>>>>>> origin/Trivedi-branch
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
<<<<<<< HEAD
      <nav style={{ marginTop: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
=======
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
>>>>>>> origin/Trivedi-branch
        {navItems.map((item) => {
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
<<<<<<< HEAD
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
=======
              className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group no-underline
                ${isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/25 shadow-sm' 
                  : 'text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground hover:translate-x-0.5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className="text-sm tracking-tight">{item.label}</span>
                  </div>
                  {badgeValue > 0 && (
                    <span className={`
                      text-[10px] font-bold font-mono px-2 py-0.5 rounded-full
                      ${item.badgeKey === 'activeAlerts' 
                        ? 'bg-destructive/15 text-destructive border border-destructive/30' 
                        : 'bg-accent/15 text-accent border border-accent/30'}
                    `}>
                      {badgeValue}
                    </span>
                  )}
                </>
>>>>>>> origin/Trivedi-branch
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Offline Status Badge */}
<<<<<<< HEAD
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
=======
      <div className="mt-auto pt-4 border-t border-border">
        <div className="bg-muted/40 border border-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              <span className="text-xs text-foreground font-bold tracking-tight font-mono">● OFFLINE KERNEL</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 leading-tight font-mono">
            Local Edge Engine — No cloud required.
          </p>
          
          {/* Mini System Resources */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[9px] text-muted-foreground mb-1 font-mono uppercase tracking-wider font-semibold">
                <span>Core CPU</span>
                <span className="text-foreground">64%</span>
              </div>
              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50">
                <div className="h-full bg-primary w-[64%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-muted-foreground mb-1 font-mono uppercase tracking-wider font-semibold">
                <span>NVMe Storage</span>
                <span className="text-foreground">78 GB free</span>
              </div>
              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50">
                <div className="h-full bg-accent w-[82%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
>>>>>>> origin/Trivedi-branch
      </div>
    </aside>
  );
}
<<<<<<< HEAD
=======

>>>>>>> origin/Trivedi-branch
