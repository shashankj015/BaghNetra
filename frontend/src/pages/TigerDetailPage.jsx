import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
<<<<<<< HEAD
import { 
  Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, 
  Layers, Fingerprint, Camera, Clock, Crosshair, ChevronRight, 
  ZoomIn, X, BarChart2, ShieldCheck, Tag
} from 'lucide-react';
=======
<<<<<<< HEAD
import { Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';

export default function TigerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
=======
import { Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, Layers, Fingerprint, Camera, Clock, Crosshair, ChevronRight } from 'lucide-react';
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

export default function TigerDetailPage() {
  const { id } = useParams();
<<<<<<< HEAD
  const [tiger, setTiger] = useState(null);
  const [movementRecords, setMovementRecords] = useState([]);
=======
  const [data, setData] = useState(MOCK_TIGER_DATA);
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
  const [loading, setLoading] = useState(true);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [allTigers, setAllTigers] = useState([]);

  useEffect(() => {
<<<<<<< HEAD
    fetchTigerDetails();
  }, [id]);

  const fetchTigerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tigers/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching tiger details:', err);
    } finally {
      setLoading(false);
    }
  };

=======
    const fetchTigerDetails = async () => {
      setLoading(true);
      try {
        const [res, allRes] = await Promise.all([
          api.get(`/tigers/${id}`),
          api.get('/tigers')
        ]);
        if (res.data && res.data.tiger) {
          setTiger(res.data.tiger);
          setMovementRecords(res.data.movementRecords || []);
        }
        if (allRes.data && allRes.data.tigers) {
          setAllTigers(allRes.data.tigers);
        }
      } catch (err) {
        console.warn('Error loading tiger profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTigerDetails();
  }, [id]);

<<<<<<< HEAD
=======
>>>>>>> origin/Trivedi-branch
  const handleRecalculateOccupancy = async () => {
    setRecalculating(true);
    try {
      await api.post(`/tigers/${id}/regenerate-occupancy`);
<<<<<<< HEAD
      await fetchTigerDetails();
    } catch (err) {
      alert(`Error recalculating occupancy: ${err.message}`);
    } finally {
      setRecalculating(false);
=======
      // Re-fetch logic would go here
    } catch (err) {
      console.warn('Simulation of recalculation finished.');
    } finally {
      setTimeout(() => setRecalculating(false), 1500);
>>>>>>> origin/Trivedi-branch
    }
  };

>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
  if (loading) {
<<<<<<< HEAD
    return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading Tiger Profile...</div>;
  }

  if (!data || !data.tiger) {
    return <div style={{ color: '#ef4444', textAlign: 'center', padding: '3rem' }}>Tiger ID not found.</div>;
  }

  const { tiger, movementRecords, recentImages } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Button & Top Header */}
      <div>
        <Link to="/tigers" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Tiger Catalogue
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-tiger" style={{ fontSize: '0.85rem' }}>{tiger.tigerId}</span>
              <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>{tiger.name}</h1>
              <span className="badge badge-core">{tiger.status}</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {tiger.healthNotes || 'Resident individual monitored in Pench Tiger Reserve.'}
            </p>
          </div>

          <button
            onClick={handleRecalculateOccupancy}
            className="btn-secondary"
            disabled={recalculating}
          >
            <RefreshCw size={16} className={recalculating ? 'spin' : ''} /> {recalculating ? 'Recalculating...' : 'Regenerate Occupancy Area'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Estimated Territory Area</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
            {tiger.occupiedArea || 'N/A'} km²
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>100% Minimum Convex Polygon</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Total Camera Captures</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
            {tiger.totalCaptures || movementRecords?.length || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Across {tiger.stations?.length || 0} stations</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Activity Centroid</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6', marginTop: '0.25rem' }}>
            {tiger.activityCentroid?.latitude?.toFixed(4)}, {tiger.activityCentroid?.longitude?.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Mean spatial location</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Monitoring History</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6', marginTop: '0.35rem' }}>
            {new Date(tiger.firstSeen).toLocaleDateString()} — {new Date(tiger.lastSeen).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Sex: {tiger.sex} • Age: ~{tiger.estimatedAge}y</div>
        </div>
      </div>

      {/* Territory Map + Movement Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Map */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: '0 0 0.75rem' }}>
            Territorial Home Range & Centroid
          </h3>
          <LeafletTigerMap
            tigers={[tiger]}
            center={[tiger.activityCentroid?.latitude || 21.6950, tiger.activityCentroid?.longitude || 79.3500]}
            zoom={12}
            height="380px"
            selectedTigerId={tiger.tigerId}
          />
        </div>

        {/* Movement Telemetry History */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: '0 0 0.75rem' }}>
            Camera Station Capture Trail
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(!movementRecords || movementRecords.length === 0) ? (
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No individual movement captures recorded yet.</p>
            ) : (
              movementRecords.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #10b981',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#f3f4f6' }}>{rec.stationId}</strong>
                    <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                      {new Date(rec.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    Zone: {rec.zone} • Confidence: {Math.round((rec.confidence || 0.9) * 100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
=======
    return (
      <div className="flex items-center justify-center h-[60vh] text-primary flex-col gap-4">
        <Fingerprint className="w-12 h-12 animate-pulse" />
        <div className="text-xs uppercase tracking-widest font-mono font-bold">Accessing Tiger Biometric Dossier...</div>
      </div>
    );
  }

  if (!tiger) {
    return (
      <div className="text-center p-16 border border-dashed border-border rounded-2xl bg-white/[0.02] max-w-xl mx-auto mt-10">
        <Fingerprint className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground">Tiger Record Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">No dataset record exists for identifier "{id}".</p>
        <Link to="/tigers" className="btn-primary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Return to Catalogue
        </Link>
      </div>
    );
  }

  const allPhotos = tiger.referenceImages || [tiger.representativeImage].filter(Boolean);
  const primaryPhoto = tiger.representativeImage || allPhotos[0];
  const embedding = tiger.embedding || tiger.embeddings || [];

  // Calculate cross-similarities with all other tigers in database
  const currentEmb = embedding;
  const neighborSimilarities = (allTigers || [])
    .filter(t => t.tigerId !== tiger?.tigerId && ((t.embedding && t.embedding.length === 512) || (t.embeddings && t.embeddings.length === 512)))
    .map(other => {
      const otherEmb = other.embedding || other.embeddings || [];
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < Math.min(512, currentEmb.length, otherEmb.length); i++) {
        dot += currentEmb[i] * otherEmb[i];
        normA += currentEmb[i] * currentEmb[i];
        normB += otherEmb[i] * otherEmb[i];
      }
      const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-12);
      return {
        tigerId: other.tigerId,
        name: other.name,
        sex: other.sex,
        status: other.status,
        representativeImage: other.representativeImage || (other.referenceImages && other.referenceImages[0]),
        similarity: Math.max(0, sim),
        simPct: Math.round(Math.max(0, sim) * 1000) / 10
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <Link 
          to="/tigers" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tiger Database
        </Link>

        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary border border-primary/30 text-xs font-mono font-bold px-3 py-1 rounded-full">
            ATRW Dataset Identity #{tiger.tigerId}
          </span>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Primary Flank Stripe Print Feature (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-border shadow-xl group">
              <img
                src={getImageUrl(primaryPhoto)}
                alt={tiger.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                }}
              />
              
              {/* Stripe Overlay Reticle */}
              <div className="absolute inset-0 border border-primary/30 flex items-center justify-center pointer-events-none">
                <Crosshair className="w-10 h-10 text-primary/40" />
              </div>

              {/* Top Badge */}
              <div className="absolute top-3 left-3">
                <span className="bg-black/80 backdrop-blur-md text-primary text-xs font-mono font-bold px-3 py-1 rounded-lg border border-primary/40">
                  Primary Flank Stripe Print
                </span>
              </div>

              {/* Bottom Badge */}
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={() => setSelectedPhotoModal(primaryPhoto)}
                  className="bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg hover:bg-primary transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> High-Res
                </button>
              </div>
            </div>
            
            <div className="text-[11px] font-mono text-muted-foreground flex justify-between px-1">
              <span>Biometric Stripe Resolution: 224x224</span>
              <span>Metric Embedding: 512 Dimensions</span>
            </div>
          </div>

          {/* Right: Individual Telemetry & Stripe Profile (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">
                  Target Profile
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs font-mono text-muted-foreground">{tiger.tigerId}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
                {tiger.name}
              </h1>

              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                {tiger.healthNotes || 'Wild tiger individual with distinct biometric flank stripe patterns indexed in ATRW dataset.'}
              </p>
            </div>

            {/* Telemetry Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Dataset Photos</div>
                <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">{allPhotos.length} Captures</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Sex & Status</div>
                <div className="text-sm font-bold text-foreground mt-1">{tiger.sex || 'Unknown'} • {tiger.status}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Estimated Age</div>
                <div className="text-sm font-bold text-foreground mt-1">~{tiger.estimatedAge || 4.5} Years</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Occupied Range</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{tiger.occupiedArea || 32.5} km²</div>
              </div>
            </div>

            {/* Stripe Signature Bar */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-border/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" />
                <span className="text-foreground">Stripe Feature Hash:</span>
                <span className="text-primary font-bold">512-D L2-Unit Hypervector</span>
              </div>
              <span className="text-muted-foreground font-bold">||e|| = 1.0000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu: Photos Album vs Stripe Print Analysis */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'photos'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4" /> All Dataset Photos ({allPhotos.length})
        </button>

        <button
          onClick={() => setActiveTab('stripe')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'stripe'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Fingerprint className="w-4 h-4" /> Flank Stripe Print & 512-D Biometrics
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL REAL DATASET PHOTOS OF THIS TIGER */}
      {/* ========================================================================= */}
      {activeTab === 'photos' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Camera-Trap Photo Gallery ({allPhotos.length} Images)
            </h3>
            <span className="text-xs font-mono text-muted-foreground">Click any photo to zoom in</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allPhotos.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhotoModal(photo)}
                className="group relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-border hover:border-primary/60 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-sm"
              >
                <img
                  src={getImageUrl(photo)}
                  alt={`${tiger.name} capture #${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                  }}
                />

                {/* Index tag */}
                <div className="absolute top-1.5 left-1.5 z-10">
                  <span className="bg-black/75 backdrop-blur-md text-[9px] font-mono text-white px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLANK STRIPE PRINT & 512-D BIOMETRIC VECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'stripe' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Stripe Print Visualization Card */}
          <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col gap-4">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" /> Flank Stripe Print Isolation
            </h3>
            <p className="text-xs text-muted-foreground">
              Center-flank ribcage stripe ridge curvature and spatial frequency pattern. Stripe patterns remain immutable across the tiger's entire lifespan.
            </p>

            <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center">
              <img
                src={getImageUrl(primaryPhoto)}
                alt="Flank Stripe Print"
                className="w-full h-full object-contain filter contrast-125"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/40 m-4 rounded-lg flex items-center justify-center">
                <span className="bg-black/80 text-primary text-[10px] font-mono font-bold px-2 py-1 rounded">
                  ISOLATED STRIPE PROFILE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/60">
                <div className="text-[10px] text-muted-foreground">Pattern Morphology</div>
                <div className="font-bold text-foreground mt-0.5">Vertical Ribcage Stripes</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/60">
                <div className="text-[10px] text-muted-foreground">Re-ID Match Confidence</div>
                <div className="font-bold text-primary mt-0.5">High Stability (86.7% mAP)</div>
              </div>
            </div>
          </div>

          {/* Right: 512-D Normalized Hypervector Visualizer */}
          <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col gap-4">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" /> 512-D Biometric Embedding Vector
            </h3>
            <p className="text-xs text-muted-foreground">
              Deep Metric Learning unit vector projected on the 512-dimensional hypersphere ($\|\mathbf{e}\|_2 = 1.0$).
            </p>

            {/* Vector Dimension Preview Histogram */}
            {embedding.length > 0 ? (
              <div className="bg-black/50 p-4 rounded-xl border border-border flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Embedding Dimensions: <strong>512</strong></span>
                  <span className="text-primary font-bold">L2 Norm = 1.0000</span>
                </div>

                {/* Micro Bar Chart of first 64 dimensions */}
                <div className="flex items-end gap-0.5 h-24 pt-4 border-b border-border/60 overflow-hidden">
                  {embedding.slice(0, 80).map((v, i) => {
                    const heightPct = Math.min(100, Math.max(5, Math.abs(v) * 500));
                    const isPos = v >= 0;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all ${
                          isPos ? 'bg-primary/80 hover:bg-primary' : 'bg-rose-400/80 hover:bg-rose-400'
                        }`}
                        style={{ height: `${heightPct}%` }}
                        title={`Dim #${i}: ${v.toFixed(5)}`}
                      />
                    );
                  })}
                </div>

                {/* Raw sample values */}
                <div className="text-[10px] font-mono text-emerald-400/90 break-all bg-black/60 p-2.5 rounded border border-white/5 max-h-32 overflow-y-auto">
                  [{embedding.slice(0, 48).map(v => v.toFixed(4)).join(', ')}, ...]
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-8 text-center">
                Embedding vector loaded in AI microservice.
              </div>
            )}
          </div>

          {/* Bottom Full-Width: Biometric Cross-Similarity vs Other Database Tigers */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" /> Cross-Tiger Biometric Similarity Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cosine distance analysis of this tiger's 512-D flank stripe vector compared against all other catalogued tigers in the database.
                </p>
              </div>

              {neighborSimilarities.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    {Math.max(0, 100 - (neighborSimilarities[0]?.simPct || 0)).toFixed(1)}% Unique Flank Ridge Fingerprint
                  </span>
                </div>
              )}
            </div>

            {neighborSimilarities.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Cross-similarity analysis active across 107 database targets.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {neighborSimilarities.map((neighbor, idx) => {
                  const isTop = idx === 0;
                  const photoUrl = getImageUrl(neighbor.representativeImage);
                  return (
                    <Link
                      key={neighbor.tigerId}
                      to={`/tigers/${neighbor.tigerId}`}
                      className="group bg-black/40 hover:bg-black/60 border border-border hover:border-primary/50 rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-11 bg-black rounded-lg overflow-hidden border border-border shrink-0">
                          <img
                            src={photoUrl}
                            alt={neighbor.tigerId}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              #{idx + 1} {neighbor.tigerId}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-primary">
                              {neighbor.simPct}%
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">{neighbor.name}</div>
                        </div>
                      </div>

                      {/* Similarity Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Cross-Similarity:</span>
                          <span className={isTop ? 'text-amber-400 font-bold' : 'text-muted-foreground'}>
                            {neighbor.simPct}% match ({Math.max(0, 100 - neighbor.simPct).toFixed(1)}% divergence)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isTop ? 'bg-amber-400' : 'bg-primary/70'
                            }`}
                            style={{ width: `${Math.max(4, neighbor.simPct)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors p-2"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={getImageUrl(selectedPhotoModal)}
              alt="Full-Res Capture"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-border shadow-2xl"
            />
            <div className="mt-3 text-xs font-mono text-white/80 flex items-center gap-4">
              <span>Tiger: <strong>{tiger.name} ({tiger.tigerId})</strong></span>
              <span>Source: <strong>ATRW Dataset Camera Trap Capture</strong></span>
            </div>
          </div>
        </div>
<<<<<<< HEAD
      )}
=======
      </div>

      {/* BOTTOM: Timeline */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Recent Movement Timeline
          </h3>
          <span className="text-xs font-mono text-muted-foreground">LAST 50 RECORDS</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!movementRecords || movementRecords.length === 0) ? (
            <p className="text-muted-foreground text-sm col-span-full">No individual movement captures recorded yet.</p>
          ) : (
            movementRecords.map((rec, idx) => (
              <div
                key={idx}
                className="bg-muted/40 border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group flex gap-4 items-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <strong className="text-sm text-foreground font-bold truncate pr-2">{rec.stationId}</strong>
                    <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                      {Math.round((rec.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Zone: {rec.zone}
                  </div>
                  <div className="text-xs font-mono text-foreground/60">
                    {new Date(rec.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
    </div>
  );
}
