import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import backgroundImage from "../../../../assets/images/background_login.jpg";

const API_URL = process.env.REACT_APP_API_URL;

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { updateAuthContext } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const validateUsername = (value) => /^[a-zA-Z0-9_.-]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateUsername(username)) {
      alert("Invalid username. Only letters, numbers, _, ., and - are allowed.");
      return;
    }
    try {
        const response = await apiCall("/auth/login", "POST", {
          username,
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
          console.log("OAuth error:", error);
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
            <label className="block text-gray-300 mb-1 sm:mb-2">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your username"
            />
          </div>
          {/* <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your password"
            />
          </div> */}
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your Password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-sm text-gray-400"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
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
          <span className="font-medium">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm;