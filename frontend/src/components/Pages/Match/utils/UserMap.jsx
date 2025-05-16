import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const redIcon = new L.Icon({
    iconUrl: "/icons/me-marker.png", // <- Chemin depuis /public
    iconSize: [45, 55],              // largeur, hauteur (ajustée à la forme)
    iconAnchor: [20, 55],            // centre horizontal + base en bas
    popupAnchor: [0, -50],
  });
  
  // Icône bleue pour les autres utilisateurs
  const blueIcon = new L.Icon({
    // iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    // iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    // shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    // iconSize: [25, 41],
    // iconAnchor: [12, 41],
    // popupAnchor: [1, -34],
    // shadowSize: [41, 41],
    iconUrl: "/icons/bleu-marker.png",
    iconSize: [45, 55],
    iconAnchor: [20, 55],
    popupAnchor: [0, -50],
  });
  
  const UserMap = ({ currentUserPosition, users }) => {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden my-4">
        <MapContainer center={currentUserPosition} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
  
          {/* Marqueur du user actuel avec icône rouge et sans photo */}
          <Marker position={currentUserPosition} icon={redIcon}>
            <Popup>
              <div className="text-center">
                <strong>Me</strong><br />
                You are here
              </div>
            </Popup>
          </Marker>
  
          {/* Marqueurs pour les autres utilisateurs */}
          {users.map(
            (u) =>
              u.latitude &&
              u.longitude && (
                <Marker key={u.id} position={[u.latitude, u.longitude]} icon={blueIcon}>
                  <Popup>
                    <div className="text-center">
                      <img
                        src={
                          u.main_picture?.startsWith("/9j")
                            ? `data:image/jpeg;base64,${u.main_picture}`
                            : u.main_picture || "/default-profile.png"
                        }
                        alt={u.username}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-blue-500"
                      />
                      <strong>{u.username}</strong>
                      <br />
                      {u.age} y.o – {u.distance_km} km
                    </div>
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>
    );
  };
  
  export default UserMap;