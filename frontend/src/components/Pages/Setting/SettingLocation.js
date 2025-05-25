import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import { getUserLocation } from "../../../utils/getLocation";

const LocationSettings = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: "",
    country: "",
    locationMethod: "IP",
  });

  const [mapEnabled, setMapEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]); // Suggestions de villes
  const [countrySuggestions, setCountrySuggestions] = useState([]); // Suggestions de pays

  // 🟡 Charger la localisation actuelle depuis le backend
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await secureApiCall("/setting/location", "GET");
        setLocation(response);
        setMapEnabled(response.locationMethod === "GPS");
        setLoading(false);
      } catch (err) {
        setError("Impossible de récupérer votre localisation.");
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  // 🟠 Récupérer les suggestions de pays
  const fetchCountrySuggestions = async (input) => {
    if (input.length < 2) {
      setCountrySuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${input}?fields=name`
      );
      const data = await response.json();

      if (data.length > 0) {
        setCountrySuggestions(data.map((country) => country.name.common));
      } else {
        setCountrySuggestions([]);
      }
    } catch {
      setCountrySuggestions([]);
    }
  };

  // 🟠 Récupérer les suggestions de villes
  const fetchCitySuggestions = async (input, country) => {
    if (input.length < 3 || !country) {
      setCitySuggestions([]);
      return;
    }
  
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=${encodeURIComponent(country)}&q=${encodeURIComponent(input)}&limit=5`
      );
  
      if (!response.ok) {
        throw new Error("Erreur API OpenStreetMap");
      }
  
      const data = await response.json();
  
      if (data.length > 0) {
        setCitySuggestions(data.map((place) => place.display_name.split(",")[0])); // Garder seulement le nom de la ville
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.log("Erreur lors de la récupération des suggestions de ville:", error);
      setCitySuggestions([]);
    }
  };

  // 📍 Récupérer latitude et longitude pour une ville donnée
  const fetchCoordinatesForCity = async (city, country) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)},${encodeURIComponent(country)}&limit=1`
      );

      if (!response.ok) throw new Error("Erreur API OpenStreetMap");

      const data = await response.json();

      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.log("Erreur lors de la récupération des coordonnées :", error);
    }

    return { latitude: null, longitude: null };
  };

  const handleSelectCity = async (city) => {
    try {
      // Récupérer les coordonnées de la ville sélectionnée
      const coordinates = await fetchCoordinatesForCity(city, location.country);
  
      // Mettre à jour la localisation avec la ville et les nouvelles coordonnées
      setLocation({
        ...location,
        city,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationMethod: "IP",
      });
  
      // Fermer la liste des suggestions
      setCitySuggestions([]);
      setMapEnabled(false);
    } catch (error) {
      console.log("Erreur lors de la sélection de la ville :", error);
    }
  };

  // 🟢 Sélectionner une suggestion de ville
//   const handleSelectCity = (city) => {
//     setLocation({ ...location, city, locationMethod: "IP" });
//     setCitySuggestions([]);
//     setMapEnabled(false);
//   };

  // 🟢 Sélectionner une suggestion de pays
  const handleSelectCountry = (country) => {
    setLocation({ ...location, country, locationMethod: "IP", city: "" });
    setCountrySuggestions([]);
    setCitySuggestions([]);
    setMapEnabled(false);
  };

  // 🟢 Récupérer la localisation GPS
  const handleGetPreciseLocation = async () => {
    setLoading(true);
    try {
      const newLocation = await getUserLocation();
      setLocation({ ...newLocation, locationMethod: "GPS" });
      setMapEnabled(true);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  // 🟢 Envoyer la localisation mise à jour au backend
  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("📤 Données envoyées au backend :", {
      ...location,
      mapEnabled,
    });

    try {
      await secureApiCall("/setting/location/update", "POST", {
        ...location,
        mapEnabled,
      });

      setLoading(false);
    } catch (err) {
      setError("Erreur lors de la mise à jour.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white max-w-xl mx-auto rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-red-500 text-center mb-4">Location Settings</h2>

      {loading && <p className="text-gray-400">Chargement...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {/* 🟢 Formulaire pour modifier la ville et le pays */}
      <form onSubmit={handleUpdateLocation} className="space-y-4">
        {/* Pays */}
        <div>
          <label className="block text-white">Country:</label>
          <input
            type="text"
            value={location.country}
            onChange={(e) => {
              setLocation({ ...location, country: e.target.value, locationMethod: "IP", city: "" });
              fetchCountrySuggestions(e.target.value);
              setMapEnabled(false);
            }}
            className="w-full p-2 text-black rounded-md"
            required
          />
          {/* 🔽 Suggestions de pays */}
          {countrySuggestions.length > 0 && (
            <ul className="bg-white text-black rounded-md mt-1 shadow-lg">
              {countrySuggestions.map((c, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleSelectCountry(c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ville */}
        <div>
          <label className="block text-white">City:</label>
          <input
            type="text"
            value={location.city}
            onChange={(e) => {
                const newCity = e.target.value;
                setLocation({ ...location, city: newCity, locationMethod: "IP" });
                fetchCitySuggestions(newCity, location.country);
                setMapEnabled(false);
              }}
            className="w-full p-2 text-black rounded-md"
            required
          />
          {/* 🔽 Suggestions de villes */}
          {citySuggestions.length > 0 && (
            <ul className="bg-white text-black rounded-md mt-1 shadow-lg">
              {citySuggestions.map((city, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleSelectCity(city)}
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bouton Update */}
        <button
          type="submit"
          className="w-full py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Update Location
        </button>
      </form>

      {/* 🟢 Bouton pour récupérer la localisation GPS */}
      <button
        onClick={handleGetPreciseLocation}
        className="w-full mt-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
        disabled={location.locationMethod === "GPS"}
      >
        {location.locationMethod === "GPS" ? "Precise Location Active" : "Use Precise GPS Location"}
      </button>

      {/* 🟠 Activer/Désactiver la Map (Seulement si mode GPS) */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-white">Enable Map:</span>
        <input
          type="checkbox"
          checked={mapEnabled}
          onChange={() => setMapEnabled(!mapEnabled)}
          disabled={location.locationMethod !== "GPS"}
          className="w-5 h-5"
        />
      </div>
    </div>
  );
};

export default LocationSettings;