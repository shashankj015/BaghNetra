import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  UserCheck, 
  PlusCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  Clock, 
  Camera, 
  Focus, 
  ShieldAlert, 
  ShieldCheck, 
  Home, 
  Layers, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Crosshair,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('ALERTS'); // 'ALERTS' | 'IMAGES'
  const [reviewedAlerts, setReviewedAlerts] = useState([]);
  const [pendingImages, setPendingImages] = useState(MOCK_QUEUE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tigers, setTigers] = useState(MOCK_TIGERS);
  const [selectedTigerId, setSelectedTigerId] = useState('');
  const [newTigerName, setNewTigerName] = useState('');
  const [newTigerSex, setNewTigerSex] = useState('UNKNOWN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [resolvingAlertId, setResolvingAlertId] = useState(null);

  // Fetch pending review items from backend
  const fetchReviewData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [revRes, tigerRes, alertRes] = await Promise.all([
        api.get('/reviews/pending?limit=20'),
        api.get('/tigers'),
        api.get('/alerts?status=REVIEWED')
      ]);

      const alertsFromApi = alertRes.data?.alerts || revRes.data?.reviewedAlerts || [];
      setReviewedAlerts(alertsFromApi);

      if (revRes.data.pendingImages && revRes.data.pendingImages.length > 0) {
        setPendingImages(revRes.data.pendingImages);
      }
      if (tigerRes.data.tigers?.length > 0) {
        setTigers(tigerRes.data.tigers);
      }

      // If no images but reviewed alerts exist, automatically default to ALERTS tab
      if (alertsFromApi.length > 0 && (!revRes.data.pendingImages || revRes.data.pendingImages.length === 0)) {
        setActiveTab('ALERTS');
      } else if (alertsFromApi.length === 0 && revRes.data.pendingImages?.length > 0) {
        setActiveTab('IMAGES');
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock review queue.', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewData();
  }, []);

  // Action: Resolve Alert from Review Queue
  const handleResolveAlert = async (alertId) => {
    setResolvingAlertId(alertId);
    try {
      // Optimistic UI update
      setReviewedAlerts(prev => prev.filter(a => a.alertId !== alertId));
      setActionSuccess(`ALERT RESOLVED & MITIGATED: ${alertId}`);
      setTimeout(() => setActionSuccess(''), 3000);

      // Call backend resolution endpoint
      await api.put(`/alerts/${alertId}/resolve`);
      fetchReviewData(true);
    } catch (err) {
      console.error(`Error resolving alert ${alertId}:`, err);
      fetchReviewData(true);
    } finally {
      setResolvingAlertId(null);
    }
  };

  // Action: Return Alert to Active Status
  const handleReopenAlert = async (alertId) => {
    try {
      setReviewedAlerts(prev => prev.filter(a => a.alertId !== alertId));
      setActionSuccess(`ALERT REOPENED TO ACTIVE STATUS: ${alertId}`);
      setTimeout(() => setActionSuccess(''), 3000);

      await api.put(`/alerts/${alertId}/status`, { status: 'ACTIVE' });
      fetchReviewData(true);
    } catch (err) {
      console.error(`Error reopening alert ${alertId}:`, err);
      fetchReviewData(true);
    }
  };

  // Action: Image Candidate Review Action
  const handleImageAction = async (action) => {
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

      try {
        await api.post('/reviews/submit', payload);
      } catch (e) {
        console.warn('Review submission offline notice:', e.message);
      }

      setActionSuccess(`ACTION CONFIRMED: ${action}`);

      // Remove current image from queue locally
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

      setTimeout(() => setActionSuccess(''), 2500);
    } catch (err) {
      alert(`Error submitting review: ${err.message}`);
    }
  };

  const toggleAlertExpand = (alertId) => {
    setExpandedAlerts(prev => ({ ...prev, [alertId]: !prev[alertId] }));
  };

  const currentImage = pendingImages[currentIndex];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-primary gap-4">
        <Focus className="w-12 h-12 animate-spin-slow opacity-50" />
        <div className="text-[10px] uppercase tracking-widest font-mono">Initializing Human-in-the-Loop Terminal...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
            <Focus className="w-8 h-8 text-primary" /> Human-in-the-Loop Review Queue
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1 font-mono">
            Verification desk for reviewed kinetic wildlife alerts, ambiguous stripe matches, and novel asset discovery.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviewData(false)}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Queue</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckSquare className="w-4 h-4" /> {actionSuccess}
        </div>
      )}

      {/* Review Section Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/40 border border-border rounded-xl w-fit">
        
        {/* Tab 1: Reviewed Alerts */}
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'ALERTS'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Reviewed Kinetic Alerts</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'ALERTS' ? 'bg-black/30 text-white' : 'bg-primary/20 text-primary'
          }`}>
            {reviewedAlerts.length}
          </span>
        </button>

        {/* Tab 2: Candidate Stripe Matches */}
        <button
          onClick={() => setActiveTab('IMAGES')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'IMAGES'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Biometric Candidate Verification</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'IMAGES' ? 'bg-black/30 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {pendingImages.length}
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REVIEWED ALERTS QUEUE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'ALERTS' && (
        <div className="flex flex-col gap-4">
          
          <div className="flex justify-between items-center bg-muted/20 px-4 py-2.5 rounded-xl border border-border">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Alerts currently staged in Review Queue:</span>
              <strong className="text-primary">{reviewedAlerts.length} pending final action</strong>
            </div>
            <Link 
              to="/alerts" 
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <span>Go to Threat Matrix</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {reviewedAlerts.length === 0 ? (
            <div className="glass-panel p-16 text-center flex flex-col items-center gap-4 border border-emerald-500/20 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center cinematic-glow">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-widest">Alert Queue Clear</h3>
              <p className="text-muted-foreground text-sm font-mono max-w-md">
                No alerts are currently marked as under review. To add alerts to this queue, visit the Alerts page and click <strong className="text-primary">"Mark as Reviewed"</strong> on any active alert.
              </p>
              <Link
                to="/alerts"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all shadow-md mt-2"
              >
                Inspect Kinetic Alerts Desk
              </Link>
            </div>
          ) : (
            reviewedAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';
              const isConflictRisk = alert.type === 'VILLAGE_ADJACENT_RISK';
              const isOverlap = alert.type === 'TERRITORY_OVERLAP';
              const isAbsent = alert.type === 'PROLONGED_ABSENCE';
              const isExpanded = !!expandedAlerts[alert.alertId];
              const isBusy = resolvingAlertId === alert.alertId;

              return (
                <div
                  key={alert.alertId}
                  className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 relative overflow-hidden shadow-lg transition-all"
                >
                  
                  {/* Subtle Top Indicator Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-primary"></div>

                  <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                    
                    {/* Left Info Column */}
                    <div className="flex-1">
                      
                      {/* Badge Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        
                        <span className="text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" /> STAGED FOR VERIFICATION
                        </span>

                        <span className={`text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border uppercase ${
                          isCritical ? 'bg-destructive/15 text-destructive border-destructive/40' : 
                          isWarning ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 
                          'bg-primary/10 text-primary border-primary/30'
                        }`}>
                          {alert.severity}
                        </span>

                        <span className={`text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                          isConflictRisk ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          isOverlap ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          isAbsent ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' :
                          'bg-muted/40 text-foreground border-border'
                        }`}>
                          {isConflictRisk && <Home className="w-3 h-3 text-rose-400" />}
                          {isOverlap && <Layers className="w-3 h-3 text-purple-400" />}
                          {isAbsent && <Clock className="w-3 h-3 text-amber-300" />}
                          {alert.categoryLabel || alert.type?.replace(/_/g, ' ')}
                        </span>

                        {alert.tigerId && (
                          <span className="text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border border-border bg-muted/40 text-foreground">
                            TARGET: {alert.tigerId}
                          </span>
                        )}

                        <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                          ID: {alert.alertId}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg lg:text-xl font-heading font-black tracking-tight mb-2 text-foreground">
                        {alert.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs lg:text-sm text-foreground/80 leading-relaxed font-mono mb-4">
                        {alert.description}
                      </p>

                      {/* Review Details Ribbon */}
                      <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[11px] font-mono text-blue-300 flex items-center gap-2 mb-3">
                        <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>
                          Reviewed by <strong>{alert.reviewedBy || 'Field Officer'}</strong> on {new Date(alert.reviewedAt || alert.updatedAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Key Indicators */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        {alert.distanceKm != null && (
                          <div className="flex items-center gap-1 text-rose-400">
                            <Home className="w-3.5 h-3.5 shrink-0" />
                            <span>DIST: <strong>{alert.distanceKm} km</strong></span>
                          </div>
                        )}

                        {alert.overlapAreaKm2 != null && (
                          <div className="flex items-center gap-1 text-purple-400">
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>OVERLAP: <strong>{alert.overlapAreaKm2} km²</strong></span>
                          </div>
                        )}

                        {alert.daysAbsent != null && (
                          <div className="flex items-center gap-1 text-amber-300">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>ABSENT: <strong>{alert.daysAbsent} Days</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-foreground/80">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span className="truncate">NODE: <strong>{alert.stationId || 'SECTOR'}</strong></span>
                        </div>

                        {alert.latitude != null && alert.longitude != null && (
                          <div className="flex items-center gap-1 text-foreground/80">
                            <Crosshair className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                            <span>GPS: <strong>{alert.latitude.toFixed(4)}°, {alert.longitude.toFixed(4)}°</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Evidence Dropdown */}
                      {(alert.newEvidence || alert.previousEvidence) && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleAlertExpand(alert.alertId)}
                            className="text-[10px] font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{isExpanded ? 'Hide Spatial Telemetry Context' : 'Inspect Spatial Telemetry Context'}</span>
                          </button>

                          {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/40 animate-in fade-in duration-150">
                              {alert.previousEvidence && (
                                <div className="bg-background/80 border border-border p-2.5 rounded-lg text-[10px] font-mono">
                                  <span className="text-[9px] uppercase font-bold text-blue-400 block mb-1">Baseline History</span>
                                  <pre className="text-blue-300/90 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(alert.previousEvidence, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {alert.newEvidence && (
                                <div className="bg-background/80 border border-border p-2.5 rounded-lg text-[10px] font-mono">
                                  <span className="text-[9px] uppercase font-bold text-rose-400 block mb-1">Active Deviation Evidence</span>
                                  <pre className="text-rose-300/90 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(alert.newEvidence, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Right Decision Buttons Column */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2.5 w-full lg:w-56 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                      
                      {/* Button 1: Deploy Mitigation & Resolve Alert */}
                      <button
                        onClick={() => handleResolveAlert(alert.alertId)}
                        disabled={isBusy}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Resolve Alert</span>
                      </button>

                      {/* Button 2: Return to Active Alert */}
                      <button
                        onClick={() => handleReopenAlert(alert.alertId)}
                        disabled={isBusy}
                        className="w-full bg-muted/40 hover:bg-muted/60 text-foreground border border-border font-mono text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Return to Active</span>
                      </button>

                    </div>

                  </div>

                </div>
              );
            })
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BIOMETRIC STRIPE MATCHES (CAMERA TRAP QUEUE)                       */}
      {/* ========================================================================= */}
      {activeTab === 'IMAGES' && (
        <>
          {!currentImage ? (
            <div className="glass-panel p-16 text-center flex flex-col items-center gap-4 border border-emerald-500/20 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center cinematic-glow">
                <CheckSquare className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-wider">Candidate Queue Clear</h3>
              <p className="text-muted-foreground text-sm font-mono max-w-md">
                All ambiguous biometric captures have been verified and cataloged in the master database.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Asset Index Switcher */}
              <div className="flex justify-between items-center bg-muted/40 px-4 py-2 rounded-xl border border-border">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  ASSET <span className="text-primary font-bold">{currentIndex + 1}</span> // <span className="text-foreground">{pendingImages.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-background hover:bg-muted border border-border text-foreground p-1.5 rounded-lg transition-colors disabled:opacity-30"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="bg-background hover:bg-muted border border-border text-foreground p-1.5 rounded-lg transition-colors disabled:opacity-30"
                    disabled={currentIndex === pendingImages.length - 1}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Review Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
                
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

                  <div className="flex-1 bg-black/90 relative flex items-center justify-center overflow-hidden group min-h-[360px]">
                    <img
                      src={currentImage.originalPath ? `http://localhost:5000/${currentImage.originalPath}` : currentImage.filePath}
                      alt="Intelligence Asset"
                      className="max-w-full max-h-full object-contain z-0 transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* OSD (On Screen Display) */}
                    <div className="absolute top-4 left-4 z-20">
                       <div className="bg-black/60 backdrop-blur-md border border-border px-3 py-1 rounded text-[9px] font-mono text-primary font-bold tracking-widest uppercase mb-1.5 inline-block">
                         ASSET_ID: {currentImage._id}
                       </div>
                       <br/>
                       <div className="bg-black/60 backdrop-blur-md border border-border px-3 py-1 rounded text-[9px] font-mono text-muted-foreground font-bold tracking-widest uppercase inline-block">
                         MODEL: {currentImage.modelVersion || 'YOLOv8 + ResNet50'}
                       </div>
                    </div>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="bg-black/80 backdrop-blur-xl border-t border-border p-4 grid grid-cols-3 gap-4 text-xs font-mono relative z-20">
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Camera className="w-3 h-3"/> NODE</div>
                      <div className="font-bold text-foreground truncate">{currentImage.cameraStation}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> T-MINUS</div>
                      <div className="font-bold text-foreground truncate">{new Date(currentImage.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> COORDS</div>
                      <div className="font-bold text-primary truncate">{currentImage.latitude?.toFixed(4)}, {currentImage.longitude?.toFixed(4)}</div>
                    </div>
                  </div>
                </div>

                {/* Right: AI Match Candidates & Controls (Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  
                  <div className="glass-panel p-5 rounded-2xl border border-border flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" /> AI Trajectory
                      </h3>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        (currentImage.identificationConfidence || 0) > 0.6 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'
                      }`}>
                        CONF: {Math.round((currentImage.identificationConfidence || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3 font-mono pb-2 border-b border-border">
                      Computed biometric similarities against resident catalog.
                    </p>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 min-h-[120px]">
                      {(!currentImage.candidates || currentImage.candidates.length === 0) ? (
                        <div className="text-xs text-destructive text-center p-4 border border-destructive/20 bg-destructive/5 rounded-xl flex flex-col items-center gap-2">
                           <ShieldAlert className="w-6 h-6" />
                           <span>NO KNOWN MATCHES. PROBABLE UNREGISTERED TARGET.</span>
                        </div>
                      ) : (
                        currentImage.candidates.map((cand, idx) => (
                          <div key={idx} className="bg-muted/50 border border-border rounded-xl p-3">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
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
                  <div className="glass-panel p-5 rounded-2xl border border-border flex-1 flex flex-col justify-end gap-3.5">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                      Analyst Override & Action
                    </h4>

                    {/* Quick Confirm */}
                    {currentImage.candidates && currentImage.candidates.length > 0 && (
                      <button
                        onClick={() => handleImageAction('CONFIRM')}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                      >
                        <CheckSquare className="w-4 h-4" /> CONFIRM AI MATCH: {currentImage.candidates[0].tigerId}
                      </button>
                    )}

                    {/* Manual Reassign */}
                    <div className="bg-muted/40 border border-border p-3 rounded-xl">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 font-bold">MANUAL OVERRIDE (KNOWN ASSET)</div>
                      <div className="flex gap-2">
                        <select
                          value={selectedTigerId}
                          onChange={(e) => setSelectedTigerId(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-primary/50"
                        >
                          <option value="">-- SELECT TARGET --</option>
                          {tigers.map(t => (
                            <option key={t.tigerId} value={t.tigerId}>{t.tigerId} — {t.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleImageAction('ASSIGN_TIGER')}
                          disabled={!selectedTigerId}
                          className="bg-muted/40 hover:bg-white/20 disabled:opacity-30 border border-border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          ASSIGN
                        </button>
                      </div>
                    </div>

                    {/* Create New Tiger */}
                    <div className="bg-accent/5 border border-accent/20 p-3 rounded-xl">
                      <div className="text-[9px] text-accent uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> REGISTER NOVEL ASSET (NEW TIGER)
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="CLASSIFICATION NAME (E.G. UNKNOWN MALE 1)"
                          value={newTigerName}
                          onChange={(e) => setNewTigerName(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground/50"
                        />
                        <div className="flex gap-2">
                          <select
                            value={newTigerSex}
                            onChange={(e) => setNewTigerSex(e.target.value)}
                            className="w-1/2 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] uppercase font-mono text-foreground focus:outline-none focus:border-accent/50"
                          >
                            <option value="UNKNOWN">SEX: UNKNOWN</option>
                            <option value="MALE">SEX: MALE</option>
                            <option value="FEMALE">SEX: FEMALE</option>
                          </select>
                          <button
                            onClick={() => handleImageAction('CREATE_NEW')}
                            className="w-1/2 bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors"
                          >
                            INITIATE
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reject */}
                    <button
                      onClick={() => handleImageAction('REJECT')}
                      className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-2 transition-colors mt-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> DISCARD ASSET (FALSE POSITIVE / BLANK)
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
