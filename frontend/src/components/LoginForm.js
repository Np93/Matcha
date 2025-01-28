import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { login } from "../utils/api";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import backgroundImage from "../assets/images/background_login.jpg";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { updateAuthContext } = useAuth(); // Récupère la fonction de connexion depuis le contexte
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await apiCall("/auth/login", "POST", {
          email,
          password,
        });
      console.log(response)
      updateAuthContext(response); // Met à jour l'état global avec l'ID utilisateur
      navigate("/profile");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 sm:px-0"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-black bg-opacity-50 shadow-lg rounded-lg p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-200">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 text-yellow-400 border border-yellow-400 rounded-md hover:bg-yellow-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Login
          </button>
        </form>
        <p className="text-center text-gray-300 mt-4 sm:mt-6">
          Don't have an account?{" "}
          <button
            className="text-yellow-400 hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;