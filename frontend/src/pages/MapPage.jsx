import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';
import { Layers, MapPin, Sparkles, Filter, Crosshair, Network, Camera, Radar } from 'lucide-react';

const MOCK_MAP_DATA = {
  stations: [
    { stationId: 'PTR-C-01', name: 'Karmajhiri Stream', zone: 'CORE', status: 'ACTIVE', latitude: 21.684, longitude: 79.325 },
    { stationId: 'PTR-C-02', name: 'Sita Ghat Trail', zone: 'CORE', status: 'ACTIVE', latitude: 21.691, longitude: 79.310 },
    { stationId: 'PTR-B-14', name: 'Turia Gate', zone: 'BUFFER', status: 'ACTIVE', latitude: 21.652, longitude: 79.341 }
  ],
  tigers: [
    { tigerId: 'BT001', name: 'Collarwali', status: 'RESIDENT', activityCentroid: { latitude: 21.68, longitude: 79.32 }, stations: [{latitude: 21.684, longitude: 79.325}] },
    { tigerId: 'BT002', name: 'T-15', status: 'RESIDENT', activityCentroid: { latitude: 21.65, longitude: 79.34 }, stations: [{latitude: 21.652, longitude: 79.341}] }
  ],
  overlaps: [
    { tiger1: {tigerId: 'BT001'}, tiger2: {tigerId: 'BT002'}, interactionType: 'TERRITORIAL_STRESS', centroidDistanceKm: 4.2, sharedStations: [] }
  ]
};

export default function MapPage() {
  const [stations, setStations] = useState(MOCK_MAP_DATA.stations);
  const [tigers, setTigers] = useState(MOCK_MAP_DATA.tigers);
  const [overlaps, setOverlaps] = useState(MOCK_MAP_DATA.overlaps);
  const [selectedTiger, setSelectedTiger] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      try {
        const [stRes, tgRes, ovRes] = await Promise.all([
          api.get('/cameras'),
          api.get('/tigers'),
          api.get('/tigers/overlaps')
        ]);
        if (stRes.data.stations?.length > 0) setStations(stRes.data.stations);
        if (tgRes.data.tigers?.length > 0) setTigers(tgRes.data.tigers);
        if (ovRes.data.overlaps?.length > 0) setOverlaps(ovRes.data.overlaps);
      } catch (err) {
        console.warn('Map API unavailable, using local classified mock data.');
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-background overflow-hidden flex">
      {/* Full Screen Map Layer */}
      <div className="flex-1 h-full w-full relative z-0">
        <LeafletTigerMap
          stations={stations}
          tigers={tigers}
          height="100%"
          selectedTigerId={selectedTiger || null}
        />
        
        {/* Map UI Overlay Elements (Optional: crosshairs, scale, coordinates) */}
        <div className="absolute top-4 left-4 z-[400] pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md border border-primary/20 px-3 py-1.5 rounded text-[10px] font-mono text-primary font-bold tracking-widest uppercase">
            GIS_SYS: ONLINE // PENCH_TR // LAT:21.6 LON:79.3
          </div>
        </div>
      </div>

      {/* Floating Map Intelligence Panel */}
      <div className="absolute top-4 right-4 bottom-4 w-96 z-[500] pointer-events-none flex flex-col gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-border pointer-events-auto flex flex-col gap-5 backdrop-blur-xl bg-black/60 shadow-2xl">
          
          <div>
            <h2 className="text-sm font-heading font-bold text-foreground tracking-wider uppercase flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Radar className="w-4 h-4 text-primary animate-pulse" /> Map Intelligence
            </h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Live territorial polygon overlays, activity centroids, camera grid, and territorial interaction zones.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Active Stations</div>
              <div className="text-xl font-bold font-heading text-foreground">{stations.length}</div>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Resident Tigers</div>
              <div className="text-xl font-bold font-heading text-primary">{tigers.length}</div>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2 block">Isolate Target Signature</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Crosshair className="w-3 h-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={selectedTiger}
                onChange={(e) => setSelectedTiger(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-4 py-2 text-xs text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="" className="bg-background">Show All Resident Individuals</option>
                {tigers.map(t => (
                  <option key={t.tigerId} value={t.tigerId} className="bg-background">
                    Highlight: {t.name} ({t.tigerId})
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border pointer-events-auto flex-1 flex flex-col overflow-hidden backdrop-blur-xl bg-black/60 shadow-2xl">
          <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-widest border-b border-border pb-3 mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-accent" /> Territorial Overlaps
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Analysis of proximity between individual home ranges indicating potential mating pairs or territorial disputes.
          </p>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
            {overlaps.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center p-4 border border-border border-dashed rounded-lg">
                No significant overlap detected between resident ranges.
              </div>
            ) : (
              overlaps.map((ov, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-2 bg-muted/30 border-border ${ov.interactionType === 'MATING_PAIR_OVERLAP' ? 'border-l-pink-500' : 'border-l-accent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold font-mono text-foreground">{ov.tiger1.tigerId} <span className="text-muted-foreground">⇄</span> {ov.tiger2.tigerId}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${ov.interactionType === 'MATING_PAIR_OVERLAP' ? 'text-pink-500' : 'text-accent'}`}>
                      {ov.interactionType === 'MATING_PAIR_OVERLAP' ? 'Breeding' : 'Stress'}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                    <div>DIST: {ov.centroidDistanceKm} km</div>
                    <div className="mt-0.5 truncate">STATIONS: {ov.sharedStations?.join(', ') || 'Adjacent'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
