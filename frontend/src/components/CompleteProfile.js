import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../utils/api";

const CompleteProfile = () => {
  const [gender, setGender] = useState("");
  const [sexualPreferences, setSexualPreferences] = useState("");
  const [biography, setBiography] = useState("");
  const [interests, setInterests] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que les champs obligatoires sont remplis
    if (!gender || !sexualPreferences) {
      alert("Please fill in all required fields (Gender and Sexual Preferences).");
      return;
    }

    try {
      const response = await secureApiCall("/auth/profiles_complete", "POST", {
        gender,
        sexual_preferences: sexualPreferences,
        biography,
        interests: interests.split(",").map((tag) => tag.trim()), // Transforme en tableau
      });

      alert(response.message);
      navigate("/profile"); // Redirige vers la page profil
    } catch (error) {
      console.error("Failed to complete profile:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Gender (Required):</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Sexual Preferences (Required):</label>
            <select
              value={sexualPreferences}
              onChange={(e) => setSexualPreferences(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Preferences</option>
              <option value="heterosexual">Heterosexual</option>
              <option value="homosexual">Homosexual</option>
              <option value="bisexual">Bisexual</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Biography:</label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Interests (comma-separated tags):</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;