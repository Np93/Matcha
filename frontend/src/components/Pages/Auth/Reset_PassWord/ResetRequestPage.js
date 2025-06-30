import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../../../../utils/api";
import { showErrorToast } from "../../../../utils/showErrorToast";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiCall("/auth/request_reset", "POST", { email });
      if (res.success) {
        navigate("/reset-verify", { state: { email } });
      } else {
        showErrorToast(res.detail);
      }
    } catch (err) {
    //   showErrorToast(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-md rounded-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">🔐 Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Your email"
            className="w-full border px-3 py-2 rounded-md focus:ring focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-md"
          >
            {loading ? "Sending..." : "Send reset code"}
          </button>
        </form>
      </div>
    </div>
  );
}