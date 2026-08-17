import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTheme } from '../../context/ThemeContext';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';

const LeafletMap = () => {
  const { theme } = useTheme();
  // Center on a generic coordinate (e.g., Pench Tiger Reserve center)
  const position = [21.65, 79.35];
  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className={`leaflet-map-wrapper ${theme}`}>
      <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="leaflet-map">
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url={tileUrl}
        />
        <Marker position={position}>
          <Popup>Pench Tiger Reserve</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
