import React, { useState, useEffect } from "react";

const Settings = () => {
  const [location, setLocation] = useState({
    city: "Localisation en cours...",
    country: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Vérifie si la géolocalisation est supportée
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Fonction pour récupérer la localisation
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Coordonnées GPS :", latitude, longitude);

        try {
          // Requête à OpenStreetMap Nominatim pour récupérer la ville
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          console.log("📍 Données Nominatim :", data);

          if (data.address) {
            setLocation({
              city: data.address.city || data.address.town || data.address.village || "Localisation inconnue",
              country: data.address.country || "Pays inconnu",
            });
          } else {
            setError("Impossible de récupérer votre ville.");
          }
        } catch (err) {
          setError("Erreur lors de la récupération des données.");
        }
      },
      (error) => {
        setError("Accès à la localisation refusé. Vérifiez vos paramètres.");
      }
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Votre Localisation</h2>
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <p className="text-lg">
          📍 {location.city}, {location.country}
        </p>
      )}
    </div>
  );
};

export default Settings;