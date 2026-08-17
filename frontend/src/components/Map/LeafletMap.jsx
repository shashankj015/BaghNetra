import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';

const LeafletMap = () => {
  // Center on a generic coordinate (e.g., Pench Tiger Reserve center)
  const position = [21.65, 79.35];

  return (
    <div className="leaflet-map-wrapper">
      <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>Pench Tiger Reserve</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
