import React, { useEffect, useState } from "react";
import { secureApiCall } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  UserCircleIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  IdentificationIcon,
  HeartIcon,
} from "@heroicons/react/24/outline"; // https://heroicons.com/

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const { isLoggedIn, updateAuthContext, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await secureApiCall("/profile/");
        setProfileData(response);
        updateAuthContext(response);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        logout();
        navigate("/");
      }
    };

    fetchProfile();
  }, [updateAuthContext, logout, navigate, isLoggedIn]);

  if (!profileData) {
    return <div className="text-white text-center mt-10">Loading profile...</div>;
  }

  const defaultIcon = (
    <div className="w-24 h-24 flex items-center justify-center bg-gray-700 text-white rounded-full">
      <UserCircleIcon className="w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Photo de profil */}
      <div className="flex justify-center mb-8">
        {profileData.profile_pictures ? (
          <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg">
            <img
              src={JSON.parse(profileData.profile_pictures)[0]}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          defaultIcon
        )}
      </div>

      {/* Informations du profil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Champs du profil */}
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <IdentificationIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Username:</strong> {profileData.username || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <GlobeAltIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Gender:</strong> {profileData.gender || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <CalendarDaysIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Birthday:</strong> {profileData.birthday || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <HeartIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Sexual Preferences:</strong>{" "}
            {profileData.sexual_preferences || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <UserCircleIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Biography:</strong> {profileData.biography || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <UserCircleIcon className="w-6 h-6 text-red-500" />
          <p>
            <strong>Interests:</strong>{" "}
            {profileData.interests
              ? JSON.parse(profileData.interests).join(", ")
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;