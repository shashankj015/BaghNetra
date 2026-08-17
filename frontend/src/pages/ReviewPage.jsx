import React, { useState, useEffect } from 'react';
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
  const [selectedTigerId, setSelectedTigerId] = useState('');
  const [newTigerName, setNewTigerName] = useState('');
  const [newTigerSex, setNewTigerSex] = useState('UNKNOWN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
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
      
      setNotes('');
      setSelectedTigerId('');
      setNewTigerName('');

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
        </p>
      </div>
    );
  }

  return (
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
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckSquare className="w-4 h-4" /> {actionSuccess}
        </div>
      )}

      {/* Main Review Workspace */}
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
            </div>
          </div>
        </div>

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
            </h4>

            {/* Quick Confirm */}
            {current.candidates && current.candidates.length > 0 && (
              <button
                onClick={() => handleAction('CONFIRM')}
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

          </div>
        </div>
      </div>
    </div>
  );
}
