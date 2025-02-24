export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(" GPS Location:", latitude, longitude);
  
            // Appel à OpenStreetMap Nominatim pour récupérer la ville et le pays
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
  
              resolve({
                latitude,
                longitude,
                city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
                country: data.address?.country || "Unknown",
                locationMethod: "GPS",
              });
            } catch (err) {
              reject("Erreur lors de la récupération de la ville.");
            }
          },
          async (error) => {
            console.warn(" GPS refusé, tentative via IP...");
            try {
              // Si l'utilisateur refuse la géolocalisation, on utilise l'IP
              const response = await fetch("http://ip-api.com/json/");
              const data = await response.json();
  
              resolve({
                latitude: data.lat,
                longitude: data.lon,
                city: data.city,
                country: data.country,
                locationMethod: "IP",
              });
            } catch (err) {
              reject("Impossible d'obtenir la localisation.");
            }
          }
        );
      } else {
        reject("La géolocalisation n'est pas supportée.");
      }
    });
  };