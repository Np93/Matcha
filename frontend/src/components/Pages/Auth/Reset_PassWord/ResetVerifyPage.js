import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiCall } from "../../../../utils/api";
import { showErrorToast } from "../../../../utils/showErrorToast";

export default function ResetVerifyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return showErrorToast("Missing email.");

    setLoading(true);
    try {
      const res = await apiCall("/auth/verify_reset_code", "POST", { email, code });
      if (res.success) {
        navigate("/reset-password", { state: { email, code } });
      } else {
        showErrorToast(res.detail);
      }
    } catch {
      showErrorToast("Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-md rounded-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">📨 Enter your code</h2>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="6-digit code"
            className="w-full border px-3 py-2 rounded-md focus:ring focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-md"
          >
            {loading ? "Verifying..." : "Verify code"}
          </button>
        </form>
      </div>
    </div>
  );
}