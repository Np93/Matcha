import { useEffect, useState } from "react";
import { apiCall } from "../../../../utils/api";

export default function EmailConfirmLink() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("❌ Token manquant.");
      return;
    }

    const confirmEmail = async () => {
      try {
        const res = await apiCall(`/auth/confirm_email/${token}`, "GET");

        if (res.success) {
          localStorage.setItem("email_verified", "true");
          // ✅ Fermeture de la fenêtre si tout va bien
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          setError(res.detail || "Échec de la confirmation.");
        }
      } catch (e) {
        setError("🔥 Erreur de communication avec le serveur.");
      }
    };

    confirmEmail();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-xl text-red-500 mb-4">Erreur</h1>
            <p>{error}</p>
          </>
        ) : (
          <h1 className="text-xl">✅ Confirmation en cours...</h1>
        )}
      </div>
    </div>
  );
}