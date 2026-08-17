import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { 
  Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter, 
  ShieldAlert, Fingerprint, Camera, Eye, ChevronRight, Layers, Tag
} from 'lucide-react';
=======
<<<<<<< HEAD
import { Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter } from 'lucide-react';
import api from '../services/api';

export default function TigersPage() {
  const [tigers, setTigers] = useState([]);
=======
import { Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter, ShieldAlert, Fingerprint } from 'lucide-react';
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
import api from '../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  return `http://localhost:5000/${clean}`;
};

export default function TigersPage() {
<<<<<<< HEAD
  const [tigers, setTigers] = useState([]);
=======
  const [tigers, setTigers] = useState(MOCK_TIGERS);
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
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
      setLoading(true);
      try {
        const url = statusFilter ? `/tigers?status=${statusFilter}` : '/tigers';
        const res = await api.get(url);
        if (res.data.tigers && res.data.tigers.length > 0) {
          setTigers(res.data.tigers);
        }
      } catch (err) {
        console.warn('Error loading tigers from database:', err);
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
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
<<<<<<< HEAD
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <Fingerprint className="w-8 h-8 text-primary" /> Individual Tiger Stripe Database
            </h1>
            <span className="bg-primary/20 text-primary text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-primary/30">
              {tigers.length} ATRW Dataset Targets
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Biometric flank stripe registry generated directly from the ATRW camera-trap dataset. Each individual is catalogued with its authentic photos and 512-D neural stripe embeddings.
=======
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-primary" /> Individual Target Database
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Biometric flank stripe registry, activity centroids, and classified occupied home range polygons. Restricted access.
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
          </p>
        </div>
      </div>

<<<<<<< HEAD
      {/* Search & Filter Bar */}
=======
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
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by Tiger ID (e.g. TIGER_153, TIGER_088, TIGER_001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors shadow-sm"
          />
        </div>
        
        <div className="relative group min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer shadow-sm"
          >
            <option value="">All Tiger Statuses</option>
            <option value="RESIDENT">Resident (Core Area)</option>
            <option value="DISPERSING">Dispersing (Corridor)</option>
            <option value="TRANSIENT">Transient</option>
          </select>
        </div>
      </div>

<<<<<<< HEAD
      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-primary gap-3">
          <Fingerprint className="w-10 h-10 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase">Loading Biometric Registry...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-white/[0.02]">
          <Fingerprint className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <div className="text-sm font-bold text-foreground">No Tigers Match Search Query</div>
          <div className="text-xs text-muted-foreground mt-1">Try clearing filters or searching another Tiger ID.</div>
        </div>
      ) : (
        /* Tigers Grid with Real Photos & Stripe Print Indicators */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((tiger) => {
            const photoUrl = getImageUrl(tiger.representativeImage || (tiger.referenceImages && tiger.referenceImages[0]));
            const captureCount = tiger.totalCaptures || (tiger.referenceImages ? tiger.referenceImages.length : 0);
=======
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
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872

            return (
              <Link
                key={tiger.tigerId}
                to={`/tigers/${tiger.tigerId}`}
                className="group block"
              >
                <div className="bg-card border border-border hover:border-primary/50 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-sm">
                  {/* Photo Container with Stripe Overlay */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt={tiger.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                      }}
                    />

                    {/* Top ID Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-black/80 backdrop-blur-md text-primary text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-primary/40 shadow-md">
                        {tiger.tigerId}
                      </span>
                    </div>

                    {/* Real Capture Count Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1 shadow-md">
                        <Camera className="w-3 h-3" /> {captureCount} Photos
                      </span>
                    </div>

                    {/* Stripe Biometric Watermark / Hover Banner */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Fingerprint className="w-3.5 h-3.5 text-primary" /> Stripe Print 512-D
                      </span>
                      <span className="text-white/80 group-hover:text-primary transition-colors flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-foreground text-base group-hover:text-primary transition-colors">
                          {tiger.name}
                        </h3>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          tiger.status === 'RESIDENT' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {tiger.status}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>Sex: <strong>{tiger.sex || 'Unknown'}</strong></span>
                        <span>•</span>
                        <span>Age: ~<strong>{tiger.estimatedAge || 4.5}y</strong></span>
                      </div>
                    </div>

                    {/* Stripe Print Summary Pill */}
                    <div className="bg-muted/30 p-2 rounded-xl border border-border/60 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                      <span className="truncate">Stripe Ridge Signature</span>
                      <span className="text-primary font-bold">||e|| = 1.0</span>
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
              </Link>
            );
          })}
        </div>
      )}
=======
              </div>

>>>>>>> origin/Trivedi-branch
            </div>
          </Link>
        ))}
      </div>
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
    </div>
  );
}
