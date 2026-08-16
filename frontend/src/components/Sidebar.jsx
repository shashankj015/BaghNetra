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
  ShieldCheck,
  Activity,
  BarChart3,
  HardDrive
} from 'lucide-react';
import api from '../services/api';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/cameras', label: 'Camera Traps', icon: Camera },
  { path: '/tigers', label: 'Tigers', icon: Sparkles },
  { path: '/movement', label: 'Movement Intelligence', icon: Activity },
  { path: '/map', label: 'Occupancy Map', icon: MapPin },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle, badgeKey: 'activeAlerts' },
  { path: '/review', label: 'Review Queue', icon: CheckSquare, badgeKey: 'pendingReviews' },
  { path: '/runs', label: 'Processing Runs', icon: Layers },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
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
        // Fallback for offline mode demo
        setCounts({ pendingReviews: 24, activeAlerts: 3 });
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
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
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
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
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Offline Status Badge */}
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
      </div>
    </aside>
  );
}

