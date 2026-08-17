import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { CheckSquare, UserCheck, PlusCircle, XCircle, ChevronLeft, ChevronRight, Sparkles, MapPin, Clock, Camera } from 'lucide-react';
import api from '../services/api';

export default function ReviewPage() {
  const [pendingImages, setPendingImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tigers, setTigers] = useState([]);
=======
import { CheckSquare, UserCheck, PlusCircle, XCircle, ChevronLeft, ChevronRight, Sparkles, MapPin, Clock, Camera, Focus, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const MOCK_QUEUE = [
  {
    _id: 'REV-001',
    filePath: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1200&auto=format&fit=crop',
    cameraStation: 'PTR-C-02 (Sita Ghat)',
    timestamp: '2023-11-20T04:32:00Z',
    latitude: 21.691,
    longitude: 79.310,
    identificationConfidence: 0.65,
    modelVersion: 'BaghNetra v2.4 (RetinaNet)',
    candidates: [
      { tigerId: 'BT002', name: 'T-15', similarity: 0.65 },
      { tigerId: 'BT005', name: 'T-65', similarity: 0.42 }
    ]
  },
  {
    _id: 'REV-002',
    filePath: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=1200&auto=format&fit=crop',
    cameraStation: 'PTR-B-14 (Turia)',
    timestamp: '2023-11-21T22:15:00Z',
    latitude: 21.652,
    longitude: 79.341,
    identificationConfidence: 0.12,
    modelVersion: 'BaghNetra v2.4 (RetinaNet)',
    candidates: []
  }
];

const MOCK_TIGERS = [
  { tigerId: 'BT001', name: 'Collarwali', sex: 'Female' },
  { tigerId: 'BT002', name: 'T-15', sex: 'Female' },
  { tigerId: 'BT003', name: 'Patdev Male', sex: 'Male' }
];

export default function ReviewPage() {
  const [pendingImages, setPendingImages] = useState(MOCK_QUEUE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tigers, setTigers] = useState(MOCK_TIGERS);
>>>>>>> origin/Trivedi-branch
  const [selectedTigerId, setSelectedTigerId] = useState('');
  const [newTigerName, setNewTigerName] = useState('');
  const [newTigerSex, setNewTigerSex] = useState('UNKNOWN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
<<<<<<< HEAD
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const [revRes, tigerRes] = await Promise.all([
        api.get('/reviews/pending?limit=100'),
        api.get('/tigers')
      ]);
      setPendingImages(revRes.data.pendingImages || []);
      setTigers(tigerRes.data.tigers || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching review images:', err);
    } finally {
      setLoading(false);
    }
  };

=======
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        const [revRes, tigerRes] = await Promise.all([
          api.get('/reviews/pending?limit=10'),
          api.get('/tigers')
        ]);
        if (revRes.data.pendingImages?.length > 0) {
          setPendingImages(revRes.data.pendingImages);
        }
        if (tigerRes.data.tigers?.length > 0) {
          setTigers(tigerRes.data.tigers);
        }
      } catch (err) {
        console.warn('Backend unavailable, using classified mock queue.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviewData();
  }, []);

>>>>>>> origin/Trivedi-branch
  const handleAction = async (action) => {
    const current = pendingImages[currentIndex];
    if (!current) return;

    try {
      const payload = {
        imageId: current._id,
        action,
        assignedTigerId: action === 'ASSIGN_TIGER' ? selectedTigerId : undefined,
        newTigerDetails: action === 'CREATE_NEW' ? {
          name: newTigerName || `New Pench Individual`,
          sex: newTigerSex
        } : undefined,
<<<<<<< HEAD
        notes: notes || `Reviewed by Field Biologist`
      };

      await api.post('/reviews/submit', payload);
      setActionSuccess(`Successfully processed action: ${action}`);

      // Remove current image from queue
      const remaining = pendingImages.filter((_, idx) => idx !== currentIndex);
      setPendingImages(remaining);
      if (currentIndex >= remaining.length && remaining.length > 0) {
        setCurrentIndex(remaining.length - 1);
      }
=======
        notes: notes || `Reviewed by Intelligence Analyst`
      };

      // Simulate API call
      // await api.post('/reviews/submit', payload);

      setActionSuccess(`ACTION CONFIRMED: ${action}`);

      // Remove current image from queue locally for demo
      const remaining = pendingImages.filter((_, idx) => idx !== currentIndex);
      setPendingImages(remaining);
      
      if (currentIndex >= remaining.length && remaining.length > 0) {
        setCurrentIndex(remaining.length - 1);
      } else if (remaining.length === 0) {
        setCurrentIndex(0);
      }
      
>>>>>>> origin/Trivedi-branch
      setNotes('');
      setSelectedTigerId('');
      setNewTigerName('');

<<<<<<< HEAD
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(`Error submitting review: ${err.response?.data?.error || err.message}`);
    }
  };

  const current = pendingImages[currentIndex];

  if (loading) {
    return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading Human Review Station...</div>;
  }

  if (!current) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <CheckSquare size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#f3f4f6', margin: '0 0 0.5rem' }}>Review Queue Clear!</h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          All ambiguous stripe matches and unknown candidate captures have been cataloged.
=======
      setTimeout(() => setActionSuccess(''), 2000);
    } catch (err) {
      alert(`Error submitting review: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-primary gap-4">
        <Focus className="w-12 h-12 animate-spin-slow opacity-50" />
        <div className="text-[10px] uppercase tracking-widest font-mono">Initializing Human-in-the-Loop Terminal...</div>
      </div>
    );
  }

  const current = pendingImages[currentIndex];

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] max-w-md mx-auto text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 cinematic-glow">
          <CheckSquare className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-heading font-black text-foreground uppercase tracking-wider">Queue Clear</h2>
        <p className="text-muted-foreground text-sm font-mono">
          All ambiguous biometric captures have been resolved and cataloged in the master database.
>>>>>>> origin/Trivedi-branch
        </p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Human Stripe Verification & Re-ID Station
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Auditable human-in-the-loop review station for ambiguous stripe patterns and unknown tiger discovery.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Item <strong>{currentIndex + 1}</strong> of <strong>{pendingImages.length}</strong>
          </span>
          <button
            className="btn-secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-secondary"
            disabled={currentIndex === pendingImages.length - 1}
            onClick={() => setCurrentIndex(currentIndex + 1)}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronRight size={16} />
          </button>
=======
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Focus className="w-8 h-8 text-primary" /> Verification Terminal
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Human-in-the-loop review station for low-confidence identification matches and novel target discovery.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest bg-muted/50 border border-border px-4 py-2 rounded-lg">
            ASSET <span className="text-primary font-bold">{currentIndex + 1}</span> // <span className="text-foreground">{pendingImages.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-muted/30 hover:bg-muted/40 border border-border text-foreground p-2 rounded-lg transition-colors disabled:opacity-30"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="bg-muted/30 hover:bg-muted/40 border border-border text-foreground p-2 rounded-lg transition-colors disabled:opacity-30"
              disabled={currentIndex === pendingImages.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
>>>>>>> origin/Trivedi-branch
        </div>
      </div>

      {actionSuccess && (
<<<<<<< HEAD
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem' }}>
          ✓ {actionSuccess}
=======
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckSquare className="w-4 h-4" /> {actionSuccess}
>>>>>>> origin/Trivedi-branch
        </div>
      )}

      {/* Main Review Workspace */}
<<<<<<< HEAD
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Left: Image & Flank Crop Display */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000000', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={`http://localhost:5000/${current.originalPath || current.filePath}`}
              alt="Camera Trap Frame"
              style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback demo render
                e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&auto=format&fit=crop&q=80';
              }}
            />
            {/* Model Watermark */}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff' }}>
              Model: {current.modelVersion || 'YOLOv8 + Metric CNN'}
            </div>
          </div>

          {/* Frame Telemetry Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
            <div>
              <span style={{ color: '#9ca3af' }}>Camera Station:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{current.cameraStation}</strong>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Capture Time:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{new Date(current.timestamp).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>GPS Coordinates:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{current.latitude?.toFixed(4)}, {current.longitude?.toFixed(4)}</strong>
=======
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        
        {/* Left: Image Viewer (Span 8) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl flex flex-col overflow-hidden border border-border relative">
          
          {/* Target Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-[60%] h-[60%] border border-primary/20 relative">
               <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
               <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
               <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/30" />
            </div>
          </div>

          <div className="flex-1 bg-black/90 relative flex items-center justify-center overflow-hidden group">
            <img
              src={current.originalPath ? `http://localhost:5000/${current.originalPath}` : current.filePath}
              alt="Intelligence Asset"
              className="max-w-full max-h-full object-contain z-0 transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* OSD (On Screen Display) */}
            <div className="absolute top-4 left-4 z-20">
               <div className="bg-black/60 backdrop-blur-md border border-border px-3 py-1.5 rounded text-[9px] font-mono text-primary font-bold tracking-widest uppercase mb-2 inline-block">
                 ASSET_ID: {current._id}
               </div>
               <br/>
               <div className="bg-black/60 backdrop-blur-md border border-border px-3 py-1.5 rounded text-[9px] font-mono text-muted-foreground font-bold tracking-widest uppercase inline-block">
                 MODEL: {current.modelVersion}
               </div>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="bg-black/80 backdrop-blur-xl border-t border-border p-4 grid grid-cols-3 gap-4 text-xs font-mono relative z-20">
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Camera className="w-3 h-3"/> NODE</div>
              <div className="font-bold text-foreground truncate">{current.cameraStation}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> T-MINUS</div>
              <div className="font-bold text-foreground truncate">{new Date(current.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> COORDS</div>
              <div className="font-bold text-primary truncate">{current.latitude?.toFixed(4)}, {current.longitude?.toFixed(4)}</div>
>>>>>>> origin/Trivedi-branch
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Right: AI Match Candidates & Decision Controls */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>AI Candidate Matches</h3>
              <span className="badge badge-buffer">
                Confidence: {Math.round((current.identificationConfidence || 0) * 100)}%
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Top visual stripe matches against Pench reference catalog.
            </p>
          </div>

          {/* Candidate Match List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(!current.candidates || current.candidates.length === 0) ? (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: '#9ca3af' }}>
                No close reference match found. Recommended action: <strong>Enroll New Individual</strong>.
              </div>
            ) : (
              current.candidates.slice(0, 3).map((cand, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <strong style={{ color: '#f3f4f6' }}>{cand.name || cand.tigerId} ({cand.tigerId})</strong>
                    <span style={{ color: cand.similarity > 0.75 ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                      {Math.round(cand.similarity * 100)}% Match
                    </span>
                  </div>
                  {/* Similarity Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(cand.similarity * 100)}%`,
                      height: '100%',
                      background: cand.similarity > 0.75 ? '#10b981' : '#f59e0b'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Review Decision Form */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Biologist Action Decision:
=======
        {/* Right: AI Match Candidates & Controls (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="glass-panel p-5 rounded-xl border border-border flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> AI Trajectory
              </h3>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                (current.identificationConfidence || 0) > 0.6 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'
              }`}>
                CONF: {Math.round((current.identificationConfidence || 0) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-4 font-mono pb-3 border-b border-border">
              Computed biometric similarities against resident catalog.
            </p>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[140px]">
              {(!current.candidates || current.candidates.length === 0) ? (
                <div className="text-xs text-destructive text-center p-4 border border-destructive/20 bg-destructive/5 rounded-lg flex flex-col items-center gap-2">
                   <ShieldAlert className="w-6 h-6" />
                   <span>NO KNOWN MATCHES. PROBABLE UNREGISTERED TARGET.</span>
                </div>
              ) : (
                current.candidates.map((cand, idx) => (
                  <div key={idx} className="bg-muted/50 border border-border rounded-lg p-3">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-foreground uppercase">{cand.name || cand.tigerId} <span className="text-muted-foreground ml-1">({cand.tigerId})</span></span>
                      <span className={cand.similarity > 0.6 ? 'text-primary' : 'text-accent'}>
                        {Math.round(cand.similarity * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cand.similarity > 0.6 ? 'bg-primary' : 'bg-accent'}`} 
                        style={{ width: `${cand.similarity * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Review Decision Controls */}
          <div className="glass-panel p-5 rounded-xl border border-border flex-1 flex flex-col justify-end gap-5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Analyst Override & Action
>>>>>>> origin/Trivedi-branch
            </h4>

            {/* Quick Confirm */}
            {current.candidates && current.candidates.length > 0 && (
              <button
                onClick={() => handleAction('CONFIRM')}
<<<<<<< HEAD
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <CheckSquare size={16} /> Confirm Best Match: {current.candidates[0].tigerId}
              </button>
            )}

            {/* Manual Reassign Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedTigerId}
                onChange={(e) => setSelectedTigerId(e.target.value)}
                style={{
                  flex: 1,
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.8rem'
                }}
              >
                <option value="">-- Assign to Existing Tiger --</option>
                {tigers.map(t => (
                  <option key={t.tigerId} value={t.tigerId}>
                    {t.tigerId} — {t.name} ({t.sex})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleAction('ASSIGN_TIGER')}
                className="btn-secondary"
                disabled={!selectedTigerId}
                style={{ fontSize: '0.8rem' }}
              >
                Assign
              </button>
            </div>

            {/* Create New Tiger (BT-XXX) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>Enroll as New Tiger (BT-XXX):</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Tiger Name (e.g. Raiyyakassa Sub-adult)"
                  value={newTigerName}
                  onChange={(e) => setNewTigerName(e.target.value)}
                  style={{ flex: 2, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem' }}
                />
                <select
                  value={newTigerSex}
                  onChange={(e) => setNewTigerSex(e.target.value)}
                  style={{ flex: 1, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem' }}
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <button
                onClick={() => handleAction('CREATE_NEW')}
                className="btn-secondary"
                style={{ justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
              >
                <PlusCircle size={14} /> Create & Catalog New Tiger
              </button>
            </div>

            {/* Reject False Trigger */}
            <button
              onClick={() => handleAction('REJECT')}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              <XCircle size={16} /> Reject False Detection
            </button>
=======
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <CheckSquare className="w-4 h-4" /> CONFIRM AI MATCH: {current.candidates[0].tigerId}
              </button>
            )}

            {/* Manual Reassign */}
            <div className="bg-muted/40 border border-border p-3 rounded-lg">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2 font-bold">MANUAL OVERRIDE (KNOWN ASSET)</div>
              <div className="flex gap-2">
                <select
                  value={selectedTigerId}
                  onChange={(e) => setSelectedTigerId(e.target.value)}
                  className="flex-1 bg-background border border-border rounded px-2 py-2 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="">-- SELECT TARGET --</option>
                  {tigers.map(t => (
                    <option key={t.tigerId} value={t.tigerId}>{t.tigerId} — {t.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAction('ASSIGN_TIGER')}
                  disabled={!selectedTigerId}
                  className="bg-muted/40 hover:bg-white/20 disabled:opacity-30 border border-border px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  ASSIGN
                </button>
              </div>
            </div>

            {/* Create New Tiger */}
            <div className="bg-accent/5 border border-accent/20 p-3 rounded-lg">
              <div className="text-[9px] text-accent uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                <PlusCircle className="w-3 h-3" /> REGISTER NOVEL ASSET (NEW TIGER)
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="CLASSIFICATION NAME (E.G. UNKNOWN MALE 1)"
                  value={newTigerName}
                  onChange={(e) => setNewTigerName(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground/50"
                />
                <div className="flex gap-2">
                   <select
                    value={newTigerSex}
                    onChange={(e) => setNewTigerSex(e.target.value)}
                    className="w-1/2 bg-background border border-border rounded px-2 py-2 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-accent/50"
                  >
                    <option value="UNKNOWN">SEX: UNKNOWN</option>
                    <option value="MALE">SEX: MALE</option>
                    <option value="FEMALE">SEX: FEMALE</option>
                  </select>
                  <button
                    onClick={() => handleAction('CREATE_NEW')}
                    className="w-1/2 bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-bold uppercase tracking-wider py-2 rounded transition-colors"
                  >
                    INITIATE
                  </button>
                </div>
              </div>
            </div>

            {/* Reject */}
            <button
              onClick={() => handleAction('REJECT')}
              className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <XCircle className="w-4 h-4" /> DISCARD ASSET (FALSE POSITIVE / BLANK)
            </button>

>>>>>>> origin/Trivedi-branch
          </div>
        </div>
      </div>
    </div>
  );
}
