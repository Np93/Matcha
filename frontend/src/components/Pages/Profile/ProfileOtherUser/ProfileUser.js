import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { secureApiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import {
  IdentificationIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  HeartIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const ProfileUser = () => {
  const { username } = useParams(); //  Récupère username depuis l'URL
  const location = useLocation();
  const profileId = location.state?.userId; //  Récupère l'ID du user depuis le state
  const { userId } = useAuth(); // Récupère l'ID de l'utilisateur connecté
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      try {
        const response = await secureApiCall(`/profile/user/${profileId}`); // Utilise l'ID pour l'appel API
        setProfileData(response);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchProfile();
  }, [profileId]);

  const formatLastConnexion = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleLike = async () => {
    try {
      await secureApiCall("/match/like", "POST", { userId, targetId: profileId });
      setProfileData((prev) => ({ ...prev, liked: true }));
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleReportFake = async () => {
    try {
      await secureApiCall("/profile/report", "POST", { userId, targetId: profileId });
      alert("User has been reported for fake account.");
    } catch (error) {
      console.error("Report failed:", error);
    }
  };

  const handleBlockUser = async () => {
    try {
      await secureApiCall("/profile/block", "POST", { userId, targetId: profileId });
      alert("User has been blocked.");
    } catch (error) {
      console.error("Block failed:", error);
    }
  };

  if (!profileData) {
    return <div className="text-white text-center mt-10">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center">
      {/* Photo de profil */}
      <div className="mb-4">
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

      {/* Statut et dernière connexion */}
      <p className="text-gray-300 text-sm">
        {profileData.status
          ? "🟢 Online"
          : `🔴 Last seen at ${formatLastConnexion(profileData.laste_connexion)}`}
      </p>

      {/* Boutons d'action */}
      <div className="flex space-x-4 mt-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            profileData.liked
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
          onClick={handleLike}
          disabled={profileData.liked}
        >
          <HeartIcon className="w-5 h-5 inline-block mr-1" />
          Like
        </button>

        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600"
          onClick={handleReportFake}
        >
          <ExclamationTriangleIcon className="w-5 h-5 inline-block mr-1" />
          Report Fake
        </button>

        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600"
          onClick={handleBlockUser}
        >
          <XCircleIcon className="w-5 h-5 inline-block mr-1" />
          Block User
        </button>
      </div>

      {/* Informations du profil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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