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
    <div>
      <h2>Your Profile</h2>
      <p>ID: {profileData.id}</p>
      <p>Created At: {profileData.created_at}</p>
    </div>
  );
};

export default Profile;