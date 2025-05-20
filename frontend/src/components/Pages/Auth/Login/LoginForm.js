import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { login } from "../utils/api";
import { apiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import backgroundImage from "../../../../assets/images/background_login.jpg";

const API_URL = process.env.REACT_APP_API_URL;

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
      console.log(response);
      
      // Get user status to check if profile is complete
      const userStatus = await apiCall("/log/status", "GET");
      
      // Update auth context with response and profile status
      updateAuthContext({...response, has_profile: userStatus.has_profile});
      
      // Redirect to the appropriate page based on profile status
      if (userStatus.has_profile) {
        navigate("/profile");
      } else {
        navigate("/complete-profile");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const googleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      `${API_URL}/auth/google/login`,
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const messageListener = async (event) => {
      if (event.data?.type === "google-auth-success") {
        window.removeEventListener("message", messageListener);
        try {
          const response = await apiCall("/auth/me", "GET");
          // Get user status to check if profile is complete
          const userStatus = await apiCall("/log/status", "GET");
          
          // Update auth context with response and profile status
          updateAuthContext({...response, has_profile: userStatus.has_profile});
          
          // Redirect to the appropriate page based on profile status
          if (userStatus.has_profile) {
            navigate("/profile");
          } else {
            navigate("/complete-profile");
          }
        } catch (error) {
          console.error("OAuth error:", error);
          alert("Google login failed.");
        }
      }
    };

    window.addEventListener("message", messageListener);
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
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-600"></div>
          <span className="mx-4 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-600"></div>
        </div>

        <button
          onClick={googleLogin}
          className="w-full flex items-center justify-center gap-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition duration-200"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="font-medium">Sign up with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm;