export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    // Fallback si GPS refusé
    const fallbackToIP = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        if (!data || !data.latitude || !data.longitude) {
          return reject("❌ Échec IP: données incomplètes.");
        }

        resolve({
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || "Unknown",
          country: data.country_name || "Unknown",
          locationMethod: "IP",
        });
      } catch (err) {
        reject("❌ IP lookup a échoué.");
      }
    };

    // GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();

            resolve({
              latitude,
              longitude,
              city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
              country: data.address?.country || "Unknown",
              locationMethod: "GPS",
            });
          } catch (err) {
            // console.warn("⚠️ Reverse lookup a échoué, on garde juste coords GPS.");
            resolve({
              latitude,
              longitude,
              city: "Unknown",
              country: "Unknown",
              locationMethod: "GPS",
            });
          }
        },
        (error) => {
          // console.warn("📵 GPS refusé ou échoué :", error.message);
          fallbackToIP();
        },
        { timeout: 5000 } // max délai avant fallback
      );
    } else {
      fallbackToIP();
    }
  });
};