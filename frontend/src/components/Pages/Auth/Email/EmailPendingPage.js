import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import { showErrorToast } from "../../../../utils/showErrorToast";

export default function EmailPendingPage() {
  const navigate = useNavigate();
  const { updateAuthContext } = useAuth();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await secureApiCall("/auth/email_status");
        if (res.success && res.email_verified === true) {
        //   console.log("val de res.success: ", res.success)
        //   console.log("val dans res.email_verified: ", res.email_verified)
          updateAuthContext({ id: res.id, has_profile: false, email_verified: res.email_verified });
          navigate("/complete-profile");
        //   console.log("true true de mon cul ouaiche")
        }
      } catch (err) {
        // console.error("Erreur pendant la vérification email:", err);
        showErrorToast("Erreur pendant la vérification email")
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center mt-20">
      <h1 className="text-2xl">📧 Vérifie ton adresse email</h1>
      <p className="mt-2 text-gray-600">
        Clique sur le lien dans l’email pour confirmer ton compte et ne pas fermer cette page stp.
      </p>
    </div>
  );
}