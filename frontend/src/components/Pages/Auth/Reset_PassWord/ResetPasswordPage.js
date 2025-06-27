import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiCall } from "../../../../utils/api";
import { showErrorToast } from "../../../../utils/showErrorToast";

export default function ResetPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || "";
  const code = state?.code || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return showErrorToast("Passwords do not match.");
    if (!email || !code) return showErrorToast("Missing info.");

    setLoading(true);
    try {
      const res = await apiCall("/auth/reset_password", "POST", {
        email,
        code,
        new_password: password,
      });
      if (res.success) {
        navigate("/login");
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
        <h2 className="text-2xl font-bold mb-4 text-center">🔑 New password</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="New password"
            className="w-full border px-3 py-2 rounded-md focus:ring focus:ring-yellow-400"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Confirm password"
            className="w-full border px-3 py-2 rounded-md focus:ring focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-md"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}