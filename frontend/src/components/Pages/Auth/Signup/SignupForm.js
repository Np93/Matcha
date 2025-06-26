import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import backgroundImage from "../../../../assets/images/background_signup.jpg";
import { showErrorToast } from "../../../../utils/showErrorToast";

const API_URL = "/api";

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { updateAuthContext } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showErrorToast("Passwords do not match");
      // alert("Passwords do not match");
      return;
    }

    try {
      const response = await apiCall("/auth/signup", "POST", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username,
      });
      updateAuthContext({...response, has_profile: false, email_verified: false});
      // navigate("/complete-profile");
      navigate("/email-pending");
    } catch (error) {
      showErrorToast(error);
      // alert(error.message);
    }
  };

  const googleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      `${API_URL}/auth/google/signup`,
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const messageListener = async (event) => {
      if (event.data?.type === "google-auth-success") {
        window.removeEventListener("message", messageListener);
        if (!event.data.success) {
          showErrorToast("Google login failed. Please try again.");
          return;
        }
        try {
          const response = await apiCall("/auth/me", "GET");
          // Always set has_profile to false for new sign ups
          updateAuthContext({...response, has_profile: false, email_verified: true});
          navigate("/complete-profile");
        } catch (error) {
          showErrorToast(error);
          // console.error("OAuth error:", error);
          // alert("Google login failed.");
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
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-200">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your Email"
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your Username"
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Enter your First Name"
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Enter your Last Name"
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
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

          {/* Confirm password */}
          <div>
            <label className="block text-gray-300 mb-1 sm:mb-2">Confirm Password:</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm Password your Password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-sm text-gray-400"
              >
                {showConfirmPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-yellow-400 border border-yellow-400 rounded-md hover:bg-yellow-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-300 mt-4 sm:mt-6">
          Already have an account?{" "}
          <button
            className="text-yellow-400 hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
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

export default SignupForm;