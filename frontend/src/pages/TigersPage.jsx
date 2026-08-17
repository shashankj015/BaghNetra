import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, MapPin, Calendar, Activity, Plus, Search, Filter, 
  ShieldAlert, Fingerprint, Camera, Eye, ChevronRight, Layers, Tag,
  PlusCircle, X, CheckCircle2
} from 'lucide-react';
import api from '../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  let clean = path;
  if (clean.includes('/uploads/')) {
    clean = 'uploads/' + clean.split('/uploads/').pop();
  } else if (clean.includes('\\uploads\\')) {
    clean = 'uploads/' + clean.split('\\uploads\\').pop();
  } else if (clean.includes('/sample-data/')) {
    clean = 'sample-data/' + clean.split('/sample-data/').pop();
  } else if (clean.includes('/re-id/')) {
    clean = 're-id/' + clean.split('/re-id/').pop();
  } else if (clean.includes('/re id/')) {
    clean = 're-id/' + clean.split('/re id/').pop();
  } else {
    clean = clean.replace(/^\/+/, '');
  }
  return `http://localhost:5000/${clean}`;
};

export default function TigersPage() {
  const [tigers, setTigers] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Tiger Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newTiger, setNewTiger] = useState({
    tigerId: '',
    name: '',
    sex: 'MALE',
    estimatedAge: '4.0',
    status: 'RESIDENT',
    cameraStation: 'PTR-C-01',
    imagePath: '',
    healthNotes: 'Resident adult individual with verified stripe telemetry.'
  });

  const fetchTigers = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/tigers?status=${statusFilter}` : '/tigers';
      const [res, camRes] = await Promise.all([
        api.get(url),
        api.get('/cameras')
      ]);
      if (res.data.tigers && res.data.tigers.length > 0) {
        setTigers(res.data.tigers);
      }
      if (camRes.data.stations?.length > 0) {
        setStations(camRes.data.stations);
      }
    } catch (err) {
      console.warn('Error loading tigers from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTigers();
  }, [statusFilter]);

  const handleOpenAddModal = () => {
    const nextNum = tigers.length + 1;
    setNewTiger({
      tigerId: `TIGER_${nextNum.toString().padStart(3, '0')}`,
      name: `Pench Wild Tiger #${nextNum}`,
      sex: 'MALE',
      estimatedAge: '4.0',
      status: 'RESIDENT',
      cameraStation: stations[0]?.stationId || 'PTR-C-01',
      imagePath: '',
      healthNotes: 'Resident adult individual with verified stripe telemetry.'
    });
    setShowAddModal(true);
  };

  const handleCreateTigerSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/tigers/enroll-from-image', {
        ...newTiger,
        tigerId: newTiger.tigerId.trim().toUpperCase(),
        estimatedAge: parseFloat(newTiger.estimatedAge) || 4.0
      });

      setSuccessMsg(`Successfully registered ${newTiger.tigerId} (${newTiger.name})! It is now localized on the map.`);
      setShowAddModal(false);
      await fetchTigers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(`Error registering tiger: ${err.response?.data?.error || err.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = tigers.filter(t => 
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.tigerId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <Fingerprint className="w-8 h-8 text-primary" /> Individual Tiger Stripe Database
            </h1>
            <span className="bg-primary/20 text-primary text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-primary/30">
              {tigers.length} Registered Individuals
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Biometric flank stripe registry and territorial home range tracker. Catalogued individuals are mapped to surveyed camera stations.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Tiger</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by Tiger ID or Name (e.g. TIGER_001, BT001, Collarwali)..."
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
          <div className="text-xs text-muted-foreground mt-1">Try clearing filters or registering a new individual.</div>
        </div>
      ) : (
        /* Tigers Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((tiger) => {
            const photoUrl = getImageUrl(tiger.representativeImage || (tiger.referenceImages && tiger.referenceImages[0]));
            const captureCount = tiger.totalCaptures || (tiger.referenceImages ? tiger.referenceImages.length : 1);

            return (
              <Link
                key={tiger.tigerId}
                to={`/tigers/${tiger.tigerId}`}
                className="group block"
              >
                <div className="bg-card border border-border hover:border-primary/50 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-sm">
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                    <img
                      src={photoUrl || 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80'}
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

                    {/* Home Range Area Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-black/75 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1 shadow-md">
                        <MapPin className="w-3 h-3" /> {tiger.occupiedArea || 0} km²
                      </span>
                    </div>

                    {/* Bottom Inspect Banner */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Fingerprint className="w-3.5 h-3.5 text-primary" /> {tiger.sex || 'UNKNOWN'}
                      </span>
                      <span className="text-white/80 group-hover:text-primary transition-colors flex items-center gap-0.5">
                        Inspect Dossier <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        {tiger.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                        <span>Age: {tiger.estimatedAge || '4.0'} yrs</span>
                        <span>•</span>
                        <span className="text-primary font-semibold">{tiger.status}</span>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-2.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Stations: <strong>{tiger.stations?.length || 1}</strong></span>
                      <span>Captures: <strong>{captureCount}</strong></span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Register New Tiger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Register New Tiger Individual</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTigerSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Tiger ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTiger.tigerId}
                    onChange={(e) => setNewTiger({ ...newTiger, tigerId: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Individual Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTiger.name}
                    onChange={(e) => setNewTiger({ ...newTiger, name: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Sex
                  </label>
                  <select
                    value={newTiger.sex}
                    onChange={(e) => setNewTiger({ ...newTiger, sex: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTiger.estimatedAge}
                    onChange={(e) => setNewTiger({ ...newTiger, estimatedAge: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Status
                  </label>
                  <select
                    value={newTiger.status}
                    onChange={(e) => setNewTiger({ ...newTiger, status: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="RESIDENT">Resident</option>
                    <option value="DISPERSING">Dispersing</option>
                    <option value="TRANSIENT">Transient</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Initial Camera Station / Location *
                </label>
                <select
                  value={newTiger.cameraStation}
                  onChange={(e) => setNewTiger({ ...newTiger, cameraStation: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {stations.map(st => (
                    <option key={st.stationId} value={st.stationId}>
                      {st.stationId} — {st.name} ({st.zone})
                    </option>
                  ))}
                  {stations.length === 0 && (
                    <option value="PTR-C-01">PTR-C-01 — Karmajhiri Core</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Representative Photo URL / Path (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. sample-data/sd_card_run_01/tiger_01.jpg"
                  value={newTiger.imagePath}
                  onChange={(e) => setNewTiger({ ...newTiger, imagePath: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Health Notes / Stripe Observation
                </label>
                <textarea
                  rows="2"
                  value={newTiger.healthNotes}
                  onChange={(e) => setNewTiger({ ...newTiger, healthNotes: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md disabled:opacity-50 transition-colors"
                >
                  {addLoading ? 'Registering...' : 'Save & Map Tiger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
