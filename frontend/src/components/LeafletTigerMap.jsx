import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

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

const tigerPalette = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];

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
  sightings = [],
  center = [21.6950, 79.3500],
  zoom = 11,
<<<<<<< HEAD
  height = '500px',
  selectedTigerId = null
}) {
  return (
    <div style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
=======
  height = '100%',
  selectedTigerId = null,
  className = ''
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tileUrl = isLight
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
>>>>>>> origin/Trivedi-branch
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        
        {/* Dynamic CartoDB Basemap according to current theme */}
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | Pench Tiger Reserve'
          url={tileUrl}
        />

        {/* Render Tiger Home Range Polygons */}
        {tigers.map((tiger, idx) => {
          const isSelected = selectedTigerId ? tiger.tigerId === selectedTigerId : true;
          const color = tigerPalette[idx % tigerPalette.length];
          const coords = tiger.homeRange?.coordinates?.[0];

          if (!coords || coords.length < 3) return null;

          // Convert [lon, lat] GeoJSON to [lat, lon] Leaflet coordinates
          const leafletPositions = coords.map(pt => [pt[1], pt[0]]);

          return (
            <React.Fragment key={tiger.tigerId}>
              <Polygon
                positions={leafletPositions}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.25 : 0.08,
                  weight: isSelected ? 2.5 : 1,
                  dashArray: isSelected ? null : '4, 4'
                }}
              >
                <Popup>
                  <div style={{ padding: '0.25rem' }}>
                    <h4 style={{ color: color, margin: 0, fontSize: '0.95rem' }}>{tiger.name} ({tiger.tigerId})</h4>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#4b5563' }}>
                      Home Range: <strong>{tiger.occupiedArea || 'N/A'} km²</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      Stations: {tiger.stations?.join(', ') || 'N/A'}
                    </p>
                  </div>
                </Popup>
              </Polygon>

              {/* Activity Centroid */}
              {tiger.activityCentroid?.latitude && (
                <CircleMarker
                  center={[tiger.activityCentroid.latitude, tiger.activityCentroid.longitude]}
                  radius={5}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 1,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: '0.8rem', color: '#111827' }}>
                      <strong>Centroid: {tiger.name}</strong><br />
                      Lat: {tiger.activityCentroid.latitude.toFixed(4)}, Lon: {tiger.activityCentroid.longitude.toFixed(4)}
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </React.Fragment>
          );
        })}

        {/* Render Camera Stations */}
        {stations.map((st) => {
          let icon = iconCore;
          if (st.zone === 'BUFFER') icon = iconBuffer;
          if (st.zone === 'VILLAGE_ADJACENT') icon = iconVillage;

          return (
            <Marker
              key={st.stationId}
              position={[st.latitude, st.longitude]}
              icon={icon}
            >
              <Popup>
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${st.zone === 'CORE' ? 'badge-core' : st.zone === 'BUFFER' ? 'badge-buffer' : 'badge-village'}`}>
                      {st.zone}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{st.stationId}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: '600' }}>{st.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.2rem' }}>
                    Coordinates: {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem', fontWeight: '600' }}>
                    Total Captures: {st.totalCaptures || 0}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Recent Sighting Points */}
        {sightings.map((sight, idx) => (
          <CircleMarker
            key={idx}
            center={[sight.latitude, sight.longitude]}
            radius={6}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#f59e0b',
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Popup>
              <div style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                <strong style={{ color: '#f59e0b' }}>Tiger Sighting: {sight.tigerId || 'Unknown'}</strong>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
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
