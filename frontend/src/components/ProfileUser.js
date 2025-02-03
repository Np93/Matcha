import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { secureApiCall } from "../utils/api";
import {
  IdentificationIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  HeartIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const ProfileUser = () => {
  const { username } = useParams(); // 🔥 Récupère username depuis l'URL
  const location = useLocation();
  const profileId = location.state?.userId; // 🔥 Récupère l'ID du user depuis le state
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      try {
        const response = await secureApiCall(`/profile/user/${profileId}`); // 🔥 Utilise l'ID pour l'appel API
        setProfileData(response);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchProfile();
  }, [profileId]);

  if (!profileData) {
    return <div className="text-white text-center mt-10">Loading profile...</div>;
  }

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
          <UserCircleIcon className="w-32 h-32 text-gray-400" />
        )}
      </div>

      {/* Informations du profil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <IdentificationIcon className="w-6 h-6 text-red-500" />
          <p><strong>Username:</strong> {profileData.username || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <GlobeAltIcon className="w-6 h-6 text-red-500" />
          <p><strong>Gender:</strong> {profileData.gender || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <CalendarDaysIcon className="w-6 h-6 text-red-500" />
          <p><strong>Birthday:</strong> {profileData.birthday || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <HeartIcon className="w-6 h-6 text-red-500" />
          <p><strong>Sexual Preferences:</strong> {profileData.sexual_preferences || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;