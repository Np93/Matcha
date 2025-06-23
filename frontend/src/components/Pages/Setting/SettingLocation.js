import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import { getUserLocation } from "../../../utils/getLocation";
import { showErrorToast } from "../../../utils/showErrorToast";

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

  // Charger la localisation actuelle depuis le backend
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

  // Récupérer les suggestions de pays
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

  // Récupérer les suggestions de villes
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
      showErrorToast("Erreur lors de la récupération des suggestions de ville");
      setCitySuggestions([]);
    }
  };

  // Récupérer latitude et longitude pour une ville donnée
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
      showErrorToast("Erreur lors de la récupération des coordonnées");
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
      showErrorToast("Erreur lors de la sélection de la ville");
    }
  };

  // Sélectionner une suggestion de pays
  const handleSelectCountry = (country) => {
    setLocation({ ...location, country, locationMethod: "IP", city: "" });
    setCountrySuggestions([]);
    setCitySuggestions([]);
    setMapEnabled(false);
  };

  // Récupérer la localisation GPS
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

  // Envoyer la localisation mise à jour au backend
  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    // console.log("📤 Données envoyées au backend :", {
    //   ...location,
    //   mapEnabled,
    // });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white bg-opacity-10 backdrop-blur-md text-white rounded-2xl shadow-2xl p-6 sm:p-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-red-400 mb-6 drop-shadow-lg">
          Location Settings
        </h2>

        {loading && <p className="text-gray-300 text-center">Chargement...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}

        <form onSubmit={handleUpdateLocation} className="space-y-6">
          {/* Country */}
          <div>
            <label className="block mb-2 text-sm font-semibold">Country</label>
            <input
              type="text"
              value={location.country}
              onChange={(e) => {
                setLocation({
                  ...location,
                  country: e.target.value,
                  locationMethod: "IP",
                  city: "",
                });
                fetchCountrySuggestions(e.target.value);
                setMapEnabled(false);
              }}
              className="w-full p-3 text-black rounded-lg shadow-inner focus:ring-2 focus:ring-red-400"
              placeholder="Enter country"
              required
            />
            {countrySuggestions.length > 0 && (
              <ul className="bg-white text-black rounded-lg mt-2 shadow-lg max-h-48 overflow-y-auto border border-gray-300">
                {countrySuggestions.map((c, i) => (
                  <li
                    key={i}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleSelectCountry(c)}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block mb-2 text-sm font-semibold">City</label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => {
                const newCity = e.target.value;
                setLocation({ ...location, city: newCity, locationMethod: "IP" });
                fetchCitySuggestions(newCity, location.country);
                setMapEnabled(false);
              }}
              className="w-full p-3 text-black rounded-lg shadow-inner focus:ring-2 focus:ring-red-400"
              placeholder="Enter city"
              required
            />
            {citySuggestions.length > 0 && (
              <ul className="bg-white text-black rounded-lg mt-2 shadow-lg max-h-48 overflow-y-auto border border-gray-300">
                {citySuggestions.map((city, i) => (
                  <li
                    key={i}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleSelectCity(city)}
                  >
                    {city}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Update Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 rounded-full text-white font-bold text-lg shadow-lg transition duration-200"
          >
            Update Location
          </button>
        </form>

        {/* GPS Button */}
        <button
          onClick={handleGetPreciseLocation}
          className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-green-500 hover:bg-green-600 rounded-full text-white font-bold text-lg shadow-lg transition duration-200"
          disabled={location.locationMethod === "GPS"}
        >
          {location.locationMethod === "GPS" ? "Active Precise Location" : "Use GPS Location"}
        </button>

        {/* Enable Map Switch */}
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm font-medium">Enable Map View</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mapEnabled}
              onChange={() => setMapEnabled(!mapEnabled)}
              disabled={location.locationMethod !== "GPS"}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:bg-green-500 transition-all relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LocationSettings;