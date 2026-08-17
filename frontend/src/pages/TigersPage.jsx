import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter } from 'lucide-react';
import api from '../services/api';

export default function TigersPage() {
  const [tigers, setTigers] = useState([]);
=======
import { Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter, ShieldAlert, Fingerprint } from 'lucide-react';
import api from '../services/api';

const MOCK_TIGERS = [
  { tigerId: 'BT001', name: 'Collarwali', sex: 'Female', estimatedAge: 16, status: 'RESIDENT', occupiedArea: 42.5, totalCaptures: 1450, lastSeen: '2023-11-20T08:30:00Z', primaryZone: 'CORE' },
  { tigerId: 'BT002', name: 'T-15 (Langdi)', sex: 'Female', estimatedAge: 8, status: 'RESIDENT', occupiedArea: 28.1, totalCaptures: 820, lastSeen: '2023-12-01T06:15:00Z', primaryZone: 'CORE' },
  { tigerId: 'BT003', name: 'Patdev Male', sex: 'Male', estimatedAge: 6, status: 'RESIDENT', occupiedArea: 65.3, totalCaptures: 340, lastSeen: '2023-12-02T22:45:00Z', primaryZone: 'CORE' },
  { tigerId: 'BT004', name: 'Raiyakassa Male', sex: 'Male', estimatedAge: 4, status: 'DISPERSING', occupiedArea: 80.2, totalCaptures: 112, lastSeen: '2023-12-05T03:20:00Z', primaryZone: 'BUFFER' },
  { tigerId: 'BT005', name: 'T-65 (Karmajhiri)', sex: 'Female', estimatedAge: 9, status: 'RESIDENT', occupiedArea: 35.6, totalCaptures: 560, lastSeen: '2023-11-28T18:10:00Z', primaryZone: 'CORE' }
];

export default function TigersPage() {
  const [tigers, setTigers] = useState(MOCK_TIGERS);
>>>>>>> origin/Trivedi-branch
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    const fetchTigers = async () => {
      try {
        const url = statusFilter ? `/tigers?status=${statusFilter}` : '/tigers';
        const res = await api.get(url);
        if (res.data.tigers && res.data.tigers.length > 0) {
          setTigers(res.data.tigers);
        }
      } catch (err) {
        console.warn('Backend offline, using mock tiger data');
      } finally {
        setLoading(false);
      }
    };
    fetchTigers();
  }, [statusFilter]);

  const filtered = tigers.filter(t => 
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tigerId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-primary" /> Individual Target Database
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Biometric flank stripe registry, activity centroids, and classified occupied home range polygons. Restricted access.
>>>>>>> origin/Trivedi-branch
          </p>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search Database (e.g. BT001, Collarwali)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        <div className="relative group min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="" className="bg-background">All Target Statuses</option>
            <option value="RESIDENT" className="bg-background">Resident (Core)</option>
            <option value="DISPERSING" className="bg-background">Dispersing (Buffer)</option>
            <option value="TRANSIENT" className="bg-background">Transient</option>
            <option value="ABSENT" className="bg-background">Missing / Absent</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
>>>>>>> origin/Trivedi-branch
        {filtered.map((tiger) => (
          <Link
            key={tiger.tigerId}
            to={`/tigers/${tiger.tigerId}`}
<<<<<<< HEAD
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
=======
            className="block group"
          >
            <div className="glass-panel p-5 rounded-xl h-full flex flex-col group-hover:-translate-y-1 group-hover:border-primary/40 transition-all duration-300 relative overflow-hidden">
              
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50 z-0 pointer-events-none"></div>

              {/* Profile Image / Mugshot Block */}
              <div className="w-full aspect-[4/3] bg-black/60 rounded-lg mb-4 border border-border relative overflow-hidden z-10 flex items-center justify-center">
                {/* Fallback pattern block */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 opacity-50"></div>
                <Fingerprint className="w-16 h-16 text-white/5 group-hover:text-primary/20 transition-colors duration-500" />
                
                {/* Simulated Reticle */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary/40"></div>
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary/40"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary/40"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary/40"></div>
                
                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-primary/60 uppercase">
                  MATCH_CONF: 99.4%
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30">
                    ID: {tiger.tigerId}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${tiger.status === 'RESIDENT' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : tiger.status === 'DISPERSING' ? 'border-accent/30 text-accent bg-accent/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                    {tiger.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold font-heading text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tiger.name || 'Unnamed Individual'}
                </h3>

                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                  {tiger.sex} // ~{tiger.estimatedAge} YRS
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-4">
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Primary Zone</div>
                    <div className="font-semibold text-foreground">{tiger.primaryZone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Est. Territory</div>
                    <div className="font-semibold text-accent">{tiger.occupiedArea || 'N/A'} km²</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Detections</div>
                    <div className="font-semibold text-primary">{tiger.totalCaptures || 0}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Last Intel</div>
                    <div className="font-semibold text-foreground">{new Date(tiger.lastSeen).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

>>>>>>> origin/Trivedi-branch
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
