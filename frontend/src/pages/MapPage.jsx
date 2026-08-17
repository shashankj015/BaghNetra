import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';
import { 
  Layers, MapPin, Sparkles, Filter, Crosshair, Network, 
  Camera, Radar, Download, FileSpreadsheet, Globe, ChevronDown 
} from 'lucide-react';

const MOCK_MAP_DATA = {
  stations: [
    { stationId: 'PTR-C-01', name: 'Karmajhiri Stream', zone: 'CORE', status: 'ACTIVE', latitude: 21.684, longitude: 79.325 },
    { stationId: 'PTR-C-02', name: 'Sita Ghat Trail', zone: 'CORE', status: 'ACTIVE', latitude: 21.691, longitude: 79.310 },
    { stationId: 'PTR-B-14', name: 'Turia Gate', zone: 'BUFFER', status: 'ACTIVE', latitude: 21.652, longitude: 79.341 }
  ],
  tigers: [
    { tigerId: 'BT001', name: 'Collarwali', status: 'RESIDENT', sex: 'FEMALE', occupiedArea: 28.4, activityCentroid: { latitude: 21.68, longitude: 79.32 }, stations: ['PTR-C-01'] },
    { tigerId: 'BT002', name: 'T-15', status: 'RESIDENT', sex: 'MALE', occupiedArea: 42.1, activityCentroid: { latitude: 21.65, longitude: 79.34 }, stations: ['PTR-B-14'] }
  ],
  overlaps: [
    { 
      tiger1: { tigerId: 'BT001', name: 'Collarwali', sex: 'FEMALE', occupiedArea: 28.4, overlapPercentage: 22.5 }, 
      tiger2: { tigerId: 'BT002', name: 'T-15', sex: 'MALE', occupiedArea: 42.1, overlapPercentage: 15.2 }, 
      interactionType: 'MATING_PAIR_OVERLAP', 
      managementSignal: 'BREEDING_MONITORING',
      overlapAreaKm2: 6.4,
      centroidDistanceKm: 4.2, 
      sharedStations: ['PTR-C-01'] 
    }
  ]
};

export default function MapPage() {
  const [stations, setStations] = useState(MOCK_MAP_DATA.stations);
  const [tigers, setTigers] = useState(MOCK_MAP_DATA.tigers);
  const [overlaps, setOverlaps] = useState(MOCK_MAP_DATA.overlaps);
  const [sightings, setSightings] = useState([]);
  const [selectedTiger, setSelectedTiger] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [stRes, tgRes, ovRes, imgRes] = await Promise.all([
        api.get('/cameras'),
        api.get('/tigers'),
        api.get('/tigers/overlaps'),
        api.get('/images?tigerDetected=true&limit=50')
      ]);
      if (stRes.data.stations?.length > 0) setStations(stRes.data.stations);
      if (tgRes.data.tigers?.length > 0) setTigers(tgRes.data.tigers);
      if (ovRes.data.overlaps?.length > 0) setOverlaps(ovRes.data.overlaps);
      if (imgRes.data.images?.length > 0) {
        const mappedSightings = imgRes.data.images
          .filter(img => img.latitude && img.longitude)
          .map(img => ({
            latitude: img.latitude,
            longitude: img.longitude,
            tigerId: img.tigerId,
            stationId: img.cameraStation,
            timestamp: img.timestamp
          }));
        setSightings(mappedSightings);
      }
    } catch (err) {
      console.warn('Map API unavailable, using local classified mock data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const handleExport = (type) => {
    const backendBase = 'http://localhost:5000/api/export/spatial';
    if (type === 'geojson') {
      window.open(`${backendBase}/geojson`, '_blank');
    } else if (type === 'csv') {
      window.open(`${backendBase}/csv`, '_blank');
    }
    setExportOpen(false);
  };

  return (
    <div className="absolute inset-0 z-0 bg-background overflow-hidden flex">
      {/* Full Screen Map Layer */}
      <div className="flex-1 h-full w-full relative z-0">
        <LeafletTigerMap
          stations={stations}
          tigers={tigers}
          overlaps={overlaps}
          sightings={sightings}
          height="100%"
          selectedTigerId={selectedTiger || null}
        />

        
        {/* Map UI Overlay Header & Quick Status */}
        <div className="absolute top-4 left-36 z-[400] pointer-events-none hidden md:flex items-center gap-2">
          <div className="bg-background/90 backdrop-blur-md border border-primary/30 px-3 py-1.5 rounded-lg text-[10px] font-mono text-primary font-bold tracking-widest uppercase shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GIS_SYS: PENCH_TIGER_RESERVE // MCP & OVERLAP ENGINE ACTIVE
          </div>
        </div>
      </div>

      {/* Floating Map Intelligence Panel */}
      <div className="absolute top-4 right-4 bottom-4 w-96 z-[500] pointer-events-none flex flex-col gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-border pointer-events-auto flex flex-col gap-4 backdrop-blur-xl bg-black/75 shadow-2xl">
          
          <div className="flex justify-between items-start border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-heading font-bold text-foreground tracking-wider uppercase flex items-center gap-2">
                <Radar className="w-4 h-4 text-primary animate-pulse" /> Reserve GIS Intelligence
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                MCP Home Ranges, Centroids & Overlaps
              </p>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {exportOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-black/95 border border-border rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => handleExport('geojson')}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-foreground hover:bg-primary/20 hover:text-primary rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>GeoJSON (QGIS / GIS)</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-foreground hover:bg-primary/20 hover:text-primary rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NTCA Territory CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/30 border border-border rounded-lg p-2.5 text-center">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5">Tigers</div>
              <div className="text-lg font-bold font-heading text-primary">{tigers.length}</div>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg p-2.5 text-center">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5">Overlaps</div>
              <div className="text-lg font-bold font-heading text-rose-400">{overlaps.length}</div>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg p-2.5 text-center">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5">Stations</div>
              <div className="text-lg font-bold font-heading text-foreground">{stations.length}</div>
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 block">
              Isolate Individual Territory
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Crosshair className="w-3 h-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={selectedTiger}
                onChange={(e) => setSelectedTiger(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-4 py-2 text-xs text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="" className="bg-background">Show All Resident Territories ({tigers.length})</option>
                {tigers.map(t => (
                  <option key={t.tigerId} value={t.tigerId} className="bg-background">
                    {t.name} ({t.tigerId}) — {t.occupiedArea || 0} km²
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Overlaps Inspector */}
        <div className="glass-panel p-5 rounded-2xl border border-border pointer-events-auto flex-1 flex flex-col overflow-hidden backdrop-blur-xl bg-black/75 shadow-2xl">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
            <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Network className="w-4 h-4 text-accent" /> Territorial Overlap Zones
            </h3>
            <span className="text-[9px] font-mono bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded">
              {overlaps.length} Active
            </span>
          </div>
          
          <p className="text-[10px] text-muted-foreground mb-3 font-mono leading-relaxed">
            Geometric intersections between MCP polygons indicating territorial conflicts or mating pairs.
          </p>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2.5">
            {overlaps.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center p-4 border border-border border-dashed rounded-lg">
                No significant overlap detected between resident ranges.
              </div>
            ) : (
              overlaps.map((ov, idx) => {
                const isConflict = ov.interactionType === 'HIGH_CONFLICT_RISK' || ov.interactionType === 'RESOURCE_COMPETITION';
                const isSelected = selectedTiger && (ov.tiger1.tigerId === selectedTiger || ov.tiger2.tigerId === selectedTiger);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTiger(ov.tiger1.tigerId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary/10 shadow-lg' 
                        : (isConflict 
                            ? 'border-l-4 border-l-rose-500 bg-rose-950/20 border-border hover:bg-rose-950/30' 
                            : 'border-l-4 border-l-pink-500 bg-pink-950/20 border-border hover:bg-pink-950/30')
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {ov.tiger1.name || ov.tiger1.tigerId} <span className="text-muted-foreground">⇄</span> {ov.tiger2.name || ov.tiger2.tigerId}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isConflict ? 'bg-rose-500/20 text-rose-400' : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {ov.managementSignal || (isConflict ? 'Conflict' : 'Breeding')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground mt-2">
                      <div>Overlap: <strong className="text-foreground">{ov.overlapAreaKm2 || 0} km²</strong></div>
                      <div>Centroid Dist: <strong className="text-foreground">{ov.centroidDistanceKm || 0} km</strong></div>
                    </div>

                    {ov.sharedStations?.length > 0 && (
                      <div className="text-[9px] font-mono text-amber-400 mt-1.5 truncate">
                        Shared Stations: {ov.sharedStations.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
