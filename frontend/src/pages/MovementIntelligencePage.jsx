import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Crosshair, Radar, AlertOctagon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_ALERTS = [
  {
    id: 'ALT-991',
    type: 'CRITICAL',
    title: 'Dispersing Tiger Approaching Village Buffer',
    description: 'Target BT004 (Raiyakassa Male) detected at PTR-B-14 moving South towards Turia village boundary. Distance: 1.2km.',
    timestamp: '10 MINS AGO',
    action: 'DISPATCH RAPID RESPONSE',
    tigerId: 'BT004'
  },
  {
    id: 'ALT-992',
    type: 'WARNING',
    title: 'Territorial Conflict Imminent',
    description: 'Overlapping presence of BT001 (Collarwali) and BT002 (T-15) at Karmajhiri Stream within 4 hour window.',
    timestamp: '2 HOURS AGO',
    action: 'MONITOR CAMERAS',
    tigerId: 'BT001'
  },
  {
    id: 'ALT-993',
    type: 'SYSTEM',
    title: 'Camera Node Offline',
    description: 'Station PTR-C-05 (Sita Ghat) failed to transmit scheduled heartbeat. Last signal at 04:00 AM.',
    timestamp: '5 HOURS AGO',
    action: 'SCHEDULE MAINTENANCE',
    stationId: 'PTR-C-05'
  },
  {
    id: 'ALT-994',
    type: 'INFO',
    title: 'Sudden Territory Shift Detected',
    description: 'Target BT003 activity centroid shifted 4.5km East over the last 14 days. Re-calculating Minimum Convex Polygon.',
    timestamp: '1 DAY AGO',
    action: 'VIEW DOSSIER',
    tigerId: 'BT003'
  }
];

export default function MovementIntelligencePage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Activity className="w-8 h-8 text-destructive animate-pulse" /> Kinetic Movement Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-3xl font-mono">
            Automated anomaly detection engine monitoring spatial drift, territorial conflicts, and human-wildlife interface boundaries.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-1">Engine Status</div>
          <div className="text-sm font-mono text-foreground bg-destructive/10 border border-destructive/30 px-3 py-1 rounded">
            THREAT_ANALYSIS_ACTIVE
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: High Priority Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-accent" /> Active Threat & Anomaly Feed
          </h2>

          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`glass-panel p-5 rounded-xl border-l-4 relative overflow-hidden group ${
                alert.type === 'CRITICAL' ? 'border-l-destructive bg-destructive/5' : 
                alert.type === 'WARNING' ? 'border-l-accent bg-accent/5' : 
                alert.type === 'SYSTEM' ? 'border-l-blue-500 bg-blue-500/5' : 
                'border-l-primary bg-primary/5'
              }`}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50 z-0 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {alert.type === 'CRITICAL' && <AlertOctagon className="w-4 h-4 text-destructive" />}
                    {alert.type === 'WARNING' && <Crosshair className="w-4 h-4 text-accent" />}
                    {alert.type === 'SYSTEM' && <Radar className="w-4 h-4 text-blue-500" />}
                    {alert.type === 'INFO' && <Activity className="w-4 h-4 text-primary" />}
                    <span className="text-[10px] font-bold font-mono tracking-widest opacity-80 uppercase">
                      {alert.id} // {alert.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{alert.timestamp}</span>
                </div>

                <h3 className={`text-lg font-bold font-heading mb-2 uppercase ${
                  alert.type === 'CRITICAL' ? 'text-destructive' : 
                  alert.type === 'WARNING' ? 'text-accent' : 
                  alert.type === 'SYSTEM' ? 'text-blue-500' : 'text-primary'
                }`}>
                  {alert.title}
                </h3>
                
                <p className="text-sm text-foreground/80 leading-relaxed font-mono mb-4">
                  {alert.description}
                </p>

                <div className="flex items-center gap-4 border-t border-border pt-4 mt-4">
                  <button className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors ${
                    alert.type === 'CRITICAL' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 
                    alert.type === 'WARNING' ? 'bg-accent/20 text-accent hover:bg-accent/30' : 
                    alert.type === 'SYSTEM' ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' : 
                    'bg-primary/20 text-primary hover:bg-primary/30'
                  }`}>
                    {alert.action}
                  </button>
                  
                  {alert.tigerId && (
                    <Link to={`/tigers/${alert.tigerId}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      VIEW TARGET PROFILE <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Global Risk Stats */}
        <div className="space-y-6">
          
          <div className="glass-panel p-5 rounded-xl border border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-3 mb-4">
              Current Risk Assessment
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Human-Wildlife Conflict Probability</span>
                  <span className="text-sm font-bold text-destructive">ELEVATED</span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive w-3/4 animate-pulse"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Territorial Stress Index</span>
                  <span className="text-sm font-bold text-accent">MODERATE</span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-1/2"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Sensor Grid Integrity</span>
                  <span className="text-sm font-bold text-blue-500">92% ONLINE</span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-3 mb-4">
              Kinetic Trends (7 Days)
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">Dispersing Movements</span>
                <span className="flex items-center gap-1 text-sm font-bold text-accent">
                  <TrendingUp className="w-4 h-4" /> +2
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">Village Proximity Alerts</span>
                <span className="flex items-center gap-1 text-sm font-bold text-destructive">
                  <TrendingUp className="w-4 h-4" /> +1
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">Unidentified Individuals</span>
                <span className="flex items-center gap-1 text-sm font-bold text-primary">
                  <TrendingDown className="w-4 h-4" /> 0
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
