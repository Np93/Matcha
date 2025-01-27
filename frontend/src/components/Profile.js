import React, { useEffect, useState } from "react";
import { secureApiCall } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const { isLoggedIn, updateAuthContext, logout } = useAuth(); // Accès au contexte pour mise à jour
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await secureApiCall("/auth/profile");
        setProfileData(response); // Met à jour les données locales de la page
        updateAuthContext(response); // Met à jour le AuthContext
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        logout();
        navigate("/");
      }
    };

    fetchProfile();
  }, [updateAuthContext, logout, navigate, isLoggedIn]);

  if (!profileData) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      <div className="space-y-2">
        <p>
          <strong>ID:</strong> {profileData.id || "N/A"}
        </p>
        <p>
          <strong>Username:</strong> {profileData.username || "N/A"}
        </p>
        <p>
          <strong>First Name:</strong> {profileData.first_name || "N/A"}
        </p>
        <p>
          <strong>Last Name:</strong> {profileData.last_name || "N/A"}
        </p>
        <p>
          <strong>Gender:</strong> {profileData.gender || "N/A"}
        </p>
        <p>
          <strong>Sexual Preferences:</strong>{" "}
          {profileData.sexual_preferences || "N/A"}
        </p>
        <p>
          <strong>Biography:</strong> {profileData.biography || "N/A"}
        </p>
        <p>
          <strong>Interests:</strong>{" "}
          {profileData.interests
            ? JSON.parse(profileData.interests).join(", ")
            : "N/A"}
        </p>
        <div>
          <strong>Profile Pictures:</strong>
          {profileData.profile_pictures ? (
            JSON.parse(profileData.profile_pictures).map((picture, index) => (
              <div key={index} className="mt-2">
                <img
                  src={picture}
                  alt={`Profile Picture ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-md shadow-md"
                />
              </div>
            ))
          ) : (
            <p>N/A</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;