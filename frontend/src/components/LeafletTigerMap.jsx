import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Layers, ShieldAlert, Crosshair, MapPin, Camera } from 'lucide-react';

// Custom Marker Icons for Camera Zones
const createMarkerIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const iconCore = createMarkerIcon('#10b981', 'C');
const iconBuffer = createMarkerIcon('#f59e0b', 'B');
const iconVillage = createMarkerIcon('#ef4444', 'V');

const tigerPalette = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LeafletTigerMap({
  stations = [],
  tigers = [],
  overlaps = [],
  sightings = [],
  center = [21.6950, 79.3500],
  zoom = 11,
  height = '100%',
  selectedTigerId = null,
  className = ''
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tileUrl = isLight
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Layer Toggles
  const [showRanges, setShowRanges] = useState(true);
  const [showCentroids, setShowCentroids] = useState(true);
  const [showOverlaps, setShowOverlaps] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showSightings, setShowSightings] = useState(true);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ height }}>
      
      {/* Floating Layer Controls */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-black/80 hover:bg-black/90 text-primary border border-primary/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GIS LAYERS</span>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
            {[showRanges, showCentroids, showOverlaps, showStations, showSightings].filter(Boolean).length}/5
          </span>
        </button>

        {showControls && (
          <div className="bg-black/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-2xl flex flex-col gap-2 min-w-[190px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold border-b border-border/50 pb-1">
              Active Map Layers
            </div>

            <label className="flex items-center justify-between text-xs text-foreground cursor-pointer hover:text-primary py-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                Home Ranges (MCP)
              </span>
              <input
                type="checkbox"
                checked={showRanges}
                onChange={(e) => setShowRanges(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-foreground cursor-pointer hover:text-primary py-1">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                Centroids
              </span>
              <input
                type="checkbox"
                checked={showCentroids}
                onChange={(e) => setShowCentroids(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-foreground cursor-pointer hover:text-primary py-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block animate-pulse"></span>
                Territorial Overlap
              </span>
              <input
                type="checkbox"
                checked={showOverlaps}
                onChange={(e) => setShowOverlaps(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-foreground cursor-pointer hover:text-primary py-1">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-amber-400" />
                Camera Stations
              </span>
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-foreground cursor-pointer hover:text-primary py-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-amber-500" />
                Capture Sightings
              </span>
              <input
                type="checkbox"
                checked={showSightings}
                onChange={(e) => setShowSightings(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        
        {/* Dynamic CartoDB Basemap according to current theme */}
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | Pench Tiger Reserve GIS'
          url={tileUrl}
        />

        {/* 1. Render Tiger Home Range Polygons */}
        {showRanges && tigers.map((tiger, idx) => {
          const isSelected = selectedTigerId ? tiger.tigerId === selectedTigerId : true;
          const isOverlappingSelected = selectedTigerId && overlaps.some(ov => 
            (ov.tiger1.tigerId === selectedTigerId && ov.tiger2.tigerId === tiger.tigerId) ||
            (ov.tiger2.tigerId === selectedTigerId && ov.tiger1.tigerId === tiger.tigerId)
          );

          const color = tigerPalette[idx % tigerPalette.length];
          const coords = tiger.homeRange?.coordinates?.[0];

          if (!coords || coords.length < 3) return null;

          // Convert [lon, lat] GeoJSON to [lat, lon] Leaflet coordinates
          const leafletPositions = coords.map(pt => [pt[1], pt[0]]);
          const opacity = isSelected ? 0.35 : (isOverlappingSelected ? 0.20 : 0.08);

          return (
            <React.Fragment key={`hr-${tiger.tigerId}`}>
              <Polygon
                positions={leafletPositions}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: opacity,
                  weight: isSelected ? 3 : (isOverlappingSelected ? 2 : 1),
                  dashArray: isSelected ? null : '4, 4'
                }}
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: color, fontSize: '0.95rem' }}>{tiger.name}</strong>
                      <span style={{ fontSize: '0.75rem', background: '#374151', color: '#f3f4f6', padding: '1px 6px', borderRadius: '4px' }}>
                        {tiger.tigerId}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1f2937', marginBottom: '2px' }}>
                      Sex: <strong>{tiger.sex || 'UNKNOWN'}</strong> | Status: <strong>{tiger.status || 'RESIDENT'}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>
                      Home Range: {tiger.occupiedArea || 'N/A'} km²
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                      Total Captures: {tiger.totalCaptures || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                      Stations: {tiger.stations?.join(', ') || 'None'}
                    </div>
                  </div>
                </Popup>
              </Polygon>

              {/* 2. Activity Centroid */}
              {showCentroids && tiger.activityCentroid?.latitude && (
                <CircleMarker
                  center={[tiger.activityCentroid.latitude, tiger.activityCentroid.longitude]}
                  radius={isSelected ? 8 : 5}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 1,
                    weight: isSelected ? 2.5 : 1.5
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: '0.8rem', color: '#111827' }}>
                      <strong style={{ color: color }}>Centroid: {tiger.name} ({tiger.tigerId})</strong><br />
                      <div style={{ marginTop: '2px', color: '#4b5563' }}>
                        Lat: {tiger.activityCentroid.latitude.toFixed(5)}<br />
                        Lon: {tiger.activityCentroid.longitude.toFixed(5)}
                      </div>
                      <div style={{ marginTop: '3px', fontSize: '0.75rem', color: '#059669' }}>
                        Occupied Core: {tiger.occupiedArea} km²
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </React.Fragment>
          );
        })}

        {/* 3. Render Territorial Overlap Zones */}
        {showOverlaps && overlaps.map((ov, idx) => {
          const polyCoords = ov.intersectionPolygon?.coordinates?.[0];
          if (!polyCoords || polyCoords.length < 3) return null;

          const leafletPositions = polyCoords.map(pt => [pt[1], pt[0]]);
          const isConflict = ov.interactionType === 'HIGH_CONFLICT_RISK' || ov.interactionType === 'RESOURCE_COMPETITION';
          const overlapColor = isConflict ? '#ef4444' : '#ec4899';

          const isRelatedToSelected = selectedTigerId ? 
            (ov.tiger1.tigerId === selectedTigerId || ov.tiger2.tigerId === selectedTigerId) : true;

          return (
            <Polygon
              key={`ov-${idx}`}
              positions={leafletPositions}
              pathOptions={{
                color: overlapColor,
                fillColor: overlapColor,
                fillOpacity: isRelatedToSelected ? 0.55 : 0.15,
                weight: 2,
                dashArray: isConflict ? '6, 3' : '3, 3'
              }}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ 
                      background: isConflict ? '#fee2e2' : '#fce7f3', 
                      color: isConflict ? '#b91c1c' : '#be185d',
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {ov.managementSignal || 'TERRITORIAL OVERLAP'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: '#111827' }}>
                    {ov.tiger1.name} ({ov.tiger1.tigerId}) ⇄ {ov.tiger2.name} ({ov.tiger2.tigerId})
                  </strong>
                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#374151' }}>
                    Intersection Area: <strong style={{ color: overlapColor }}>{ov.overlapAreaKm2} km²</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                    {ov.tiger1.tigerId} territory overlap: <strong>{ov.tiger1.overlapPercentage || 0}%</strong><br />
                    {ov.tiger2.tigerId} territory overlap: <strong>{ov.tiger2.overlapPercentage || 0}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '3px' }}>
                    Centroid Distance: {ov.centroidDistanceKm} km
                  </div>
                  {ov.sharedStations?.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '3px', fontWeight: 'bold' }}>
                      Shared Stations: {ov.sharedStations.join(', ')}
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* 4. Render Camera Stations */}
        {showStations && stations.map((st) => {
          let icon = iconCore;
          if (st.zone === 'BUFFER') icon = iconBuffer;
          if (st.zone === 'VILLAGE_ADJACENT') icon = iconVillage;

          return (
            <Marker
              key={`st-${st.stationId}`}
              position={[st.latitude, st.longitude]}
              icon={icon}
            >
              <Popup>
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      padding: '1px 5px', 
                      borderRadius: '3px',
                      background: st.zone === 'CORE' ? '#d1fae5' : (st.zone === 'BUFFER' ? '#fef3c7' : '#fee2e2'),
                      color: st.zone === 'CORE' ? '#065f46' : (st.zone === 'BUFFER' ? '#92400e' : '#991b1b')
                    }}>
                      {st.zone}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{st.stationId}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: '600' }}>{st.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.2rem' }}>
                    GPS: {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem', fontWeight: '600' }}>
                    Total Captures: {st.totalCaptures || 0}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Render Recent Sighting Points */}
        {showSightings && sightings.map((sight, idx) => (
          <CircleMarker
            key={`sg-${idx}`}
            center={[sight.latitude, sight.longitude]}
            radius={5}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#f59e0b',
              fillOpacity: 0.9,
              weight: 1.5
            }}
          >
            <Popup>
              <div style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                <strong style={{ color: '#f59e0b' }}>Tiger Sighting: {sight.tigerId || 'Unknown'}</strong>
                <div style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '2px' }}>
                  Station: {sight.stationId}<br />
                  Time: {new Date(sight.timestamp).toLocaleString()}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
