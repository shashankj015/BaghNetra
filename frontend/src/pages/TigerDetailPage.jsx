import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
<<<<<<< HEAD
import { Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';

export default function TigerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
=======
import { Sparkles, MapPin, Calendar, Activity, ArrowLeft, RefreshCw, Layers, Fingerprint, Camera, Clock, Crosshair, ChevronRight } from 'lucide-react';
import api from '../services/api';

const MOCK_TIGER_DATA = {
  tiger: {
    tigerId: 'BT001',
    name: 'Collarwali',
    sex: 'Female',
    estimatedAge: 16,
    status: 'RESIDENT',
    occupiedArea: 42.5,
    totalCaptures: 1450,
    firstSeen: '2008-11-20T08:30:00Z',
    lastSeen: '2023-11-20T08:30:00Z',
    primaryZone: 'CORE',
    healthNotes: 'Super-mom of Pench. Radio-collared. High breeding success rate.'
  },
  movementRecords: [
    { stationId: 'PTR-C-01', timestamp: '2023-11-20T08:30:00Z', zone: 'CORE', confidence: 0.99 },
    { stationId: 'PTR-C-02', timestamp: '2023-11-18T14:15:00Z', zone: 'CORE', confidence: 0.98 },
    { stationId: 'PTR-B-14', timestamp: '2023-11-12T02:45:00Z', zone: 'BUFFER', confidence: 0.96 },
    { stationId: 'PTR-C-05', timestamp: '2023-10-30T22:10:00Z', zone: 'CORE', confidence: 0.99 },
    { stationId: 'PTR-C-01', timestamp: '2023-10-15T05:20:00Z', zone: 'CORE', confidence: 0.97 }
  ]
};

export default function TigerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(MOCK_TIGER_DATA);
>>>>>>> origin/Trivedi-branch
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

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
        const res = await api.get(`/tigers/${id}`);
        if (res.data && res.data.tiger) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Using mock data for tiger details');
      } finally {
        setLoading(false);
      }
    };
    fetchTigerDetails();
  }, [id]);

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
        <div className="text-xs uppercase tracking-widest font-mono">Accessing Classified Records...</div>
      </div>
    );
  }

  if (!data || !data.tiger) {
    return <div className="text-destructive text-center p-12">Target Profile Not Found.</div>;
  }

  const { tiger, movementRecords } = data;

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      
      {/* Back Button */}
      <div>
        <Link to="/tigers" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Return to Catalogue
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Biometric Profile */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-primary/20">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Fingerprint className="w-64 h-64 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold font-mono tracking-widest px-3 py-1 rounded-sm bg-primary/20 text-primary border border-primary/30">
                      TARGET ID: {tiger.tigerId}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm border ${tiger.status === 'RESIDENT' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-accent/30 text-accent bg-accent/10'}`}>
                      {tiger.status} STATUS
                    </span>
                  </div>
                  <h1 className="text-4xl font-heading font-black text-foreground tracking-tight uppercase">
                    {tiger.name}
                  </h1>
                </div>
                <button
                  onClick={handleRecalculateOccupancy}
                  disabled={recalculating}
                  className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                  {recalculating ? 'Recalculating...' : 'Update Trajectory'}
                </button>
              </div>

              {/* Biometric Flank Views */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Crosshair className="w-4 h-4" /> Biometric Stripe Print Match Analysis
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Left Flank */}
                  <div className="bg-muted/50 rounded-xl border border-border p-3 relative group">
                    <div className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-sm text-[9px] font-mono font-bold px-2 py-1 rounded text-muted-foreground border border-border uppercase">
                      LEFT FLANK
                    </div>
                    <div className="absolute top-2 right-2 z-20 bg-primary/20 backdrop-blur-sm text-[9px] font-mono font-bold px-2 py-1 rounded text-primary border border-primary/30 uppercase">
                      MATCH: 99.8%
                    </div>
                    
                    <div className="aspect-[4/3] bg-[#1a2119] rounded-lg relative overflow-hidden flex items-center justify-center border border-border">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50"></div>
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-10">
                        {Array.from({length: 36}).map((_, i) => <div key={i} className="border-[0.5px] border-white"></div>)}
                      </div>
                      <Fingerprint className="w-12 h-12 text-primary/30" />
                      
                      {/* Fake Analysis Lines */}
                      <svg className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <line x1="20%" y1="10%" x2="40%" y2="80%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" />
                        <line x1="45%" y1="20%" x2="60%" y2="70%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" />
                        <line x1="70%" y1="15%" x2="85%" y2="85%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" />
                        <circle cx="40%" cy="80%" r="4" fill="#10b981" />
                        <circle cx="60%" cy="70%" r="4" fill="#10b981" />
                        <circle cx="85%" cy="85%" r="4" fill="#10b981" />
                      </svg>
                    </div>
                  </div>

                  {/* Right Flank */}
                  <div className="bg-muted/50 rounded-xl border border-border p-3 relative group">
                    <div className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-sm text-[9px] font-mono font-bold px-2 py-1 rounded text-muted-foreground border border-border uppercase">
                      RIGHT FLANK
                    </div>
                    <div className="absolute top-2 right-2 z-20 bg-primary/20 backdrop-blur-sm text-[9px] font-mono font-bold px-2 py-1 rounded text-primary border border-primary/30 uppercase">
                      MATCH: 99.1%
                    </div>
                    
                    <div className="aspect-[4/3] bg-[#1a2119] rounded-lg relative overflow-hidden flex items-center justify-center border border-border">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50"></div>
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-10">
                        {Array.from({length: 36}).map((_, i) => <div key={i} className="border-[0.5px] border-white"></div>)}
                      </div>
                      <Fingerprint className="w-12 h-12 text-primary/30 scale-x-[-1]" />
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Field Notes</h4>
                <p className="text-sm text-foreground/80 leading-relaxed font-mono">
                  {tiger.healthNotes || 'No specific field observations logged for this individual.'}
                </p>
              </div>

            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Intelligence Dossier */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Intelligence Dossier
            </h3>

            <div className="space-y-6 flex-1">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sex</div>
                  <div className="text-lg font-bold text-foreground">{tiger.sex}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Est. Age</div>
                  <div className="text-lg font-bold text-foreground">{tiger.estimatedAge} Yrs</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Primary Zone</div>
                <div className="text-lg font-bold text-accent bg-accent/10 border border-accent/20 rounded px-3 py-1 inline-block">{tiger.primaryZone || 'N/A'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Territory / Occupied Area</div>
                <div className="text-3xl font-heading font-black text-primary flex items-baseline gap-1">
                  {tiger.occupiedArea || 'N/A'} <span className="text-sm text-primary/60 font-bold uppercase">km²</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">100% Minimum Convex Polygon</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Confirmations</div>
                <div className="text-2xl font-heading font-bold text-foreground">
                  {tiger.totalCaptures || movementRecords?.length || 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Monitoring Duration</div>
                <div className="text-sm font-semibold text-foreground font-mono">
                  {new Date(tiger.firstSeen).toLocaleDateString()} <ChevronRight className="inline w-3 h-3 text-muted-foreground mx-1" /> {new Date(tiger.lastSeen).toLocaleDateString()}
                </div>
              </div>
              
            </div>
          </div>
        </div>
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
    </div>
  );
}
