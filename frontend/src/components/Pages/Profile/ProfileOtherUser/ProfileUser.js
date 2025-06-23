import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { secureApiCall } from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import ProfilePictureDisplay from "../../../../utils/ProfilePictureDisplay";
import {
  IdentificationIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  UserCircleIcon,
  HeartIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import LikeButton from "./utils/LikeUnLikeButton";
import { showErrorToast } from "../../../../utils/showErrorToast";

const ProfileUser = () => {
  const { username } = useParams();
  const location = useLocation();
  const profileId = location.state?.userId;
  const { userId } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [canLike, setCanLike] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      try {
        const response = await secureApiCall(`/profile/user/${profileId}`);
        setProfileData(response);
        setCanLike(response.can_like);
      } catch (error) {
        showErrorToast("Failed to fetch user profile:");
      }
    };

    fetchProfile();
  }, [profileId]);

  const formatLastConnexion = (dateString) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // <- fuseau du navigateur

    const optionsTime = { hour: "2-digit", minute: "2-digit", timeZone };
    const optionsDate = { day: "2-digit", month: "long", year: "numeric", timeZone };
    const optionsDay = { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone };

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString("fr-FR", optionsTime)}`;
    } else if (diffInDays < 7) {
      return `${date.toLocaleDateString("fr-FR", optionsDay)}`;
    } else {
      return date.toLocaleDateString("fr-FR", optionsDate);
    }
  };

  const handleReportFake = async () => {
    try {
      await secureApiCall("/profile/report", "POST", { userId, targetId: profileId });
      showErrorToast("User has been reported for fake account.");
    } catch (error) {
      showErrorToast("Report failed:");
    }
  };

  const handleBlockUser = async () => {
    try {
      await secureApiCall("/profile/block", "POST", { userId, targetId: profileId });
      showErrorToast("User has been blocked.");
    } catch (error) {
      showErrorToast("Block failed:");
      showErrorToast("Block failed:")
    }
  };

  if (!profileData) {
    return <div className="text-white text-center mt-10">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      {/* Photo de profil principale */}
      <ProfilePictureDisplay
        pictures={profileData.profile_pictures}
        fameRating={profileData.fame_rating}
      />

      {/* Miniatures secondaires (optionnel)
      {profilePictureUrls.length > 1 && (
        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {profilePictureUrls.slice(1).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`thumb-${idx}`}
              onClick={() => openModal(idx + 1)}
              className="w-16 h-16 object-cover rounded cursor-pointer hover:ring-2 ring-red-500"
            />
          ))}
        </div>
      )} */}

      {/* Statut et dernière connexion */}
      <p className="text-gray-300 text-sm mt-2">
        {profileData.status
          ? "🟢 Online"
          : `🔴 Last seen ${formatLastConnexion(profileData.laste_connexion)}`}
      </p>

      {/* Match status */}
      {profileData.unlike ? (
        <p className="text-red-400 font-semibold text-sm mt-1">
          💔 You have unliked this user
        </p>
      ) : profileData.is_match ? (
        <p className="text-green-400 font-semibold text-sm mt-1">
          ✅ It's a Match!
        </p>
      ) : profileData.liked ? (
        <p className="text-pink-400 text-sm mt-1">
          ❤️ You liked this user
        </p>
      ) : (
        <p className="text-gray-400 text-sm mt-1">
          🤍 You haven't liked this user yet
        </p>
      )}

      {/* Boutons d'action */}
      <div className="flex space-x-4 mt-4">
        <LikeButton
          userId={userId}
          targetId={profileId}
          isLiked={profileData.liked}
          isUnliked={profileData.unlike}
          disabled={!canLike}
          onLike={() => setProfileData({ ...profileData, liked: true })}
          onUnlike={() => setProfileData({ ...profileData, liked: false, unlike: true })}
        />
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
          onClick={handleReportFake}
        >
          <ExclamationTriangleIcon className="w-5 h-5" />
          Report Fake
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gray-700 text-white hover:bg-gray-600"
          onClick={handleBlockUser}
        >
          <XCircleIcon className="w-5 h-5" />
          Block User
        </button>
      </div>

      {/* Infos utilisateur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <IdentificationIcon className="w-6 h-6 text-red-500" />
          <p><strong>Username:</strong> {profileData.username || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <IdentificationIcon className="w-6 h-6 text-red-500" />
          <p><strong>First Name:</strong> {profileData.first_name || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <IdentificationIcon className="w-6 h-6 text-red-500" />
          <p><strong>Last Name:</strong> {profileData.last_name || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <GlobeAltIcon className="w-6 h-6 text-red-500" />
          <p><strong>Gender:</strong> {profileData.gender || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <CalendarDaysIcon className="w-6 h-6 text-red-500" />
          <p><strong>Birthday:</strong> {profileData.birthday || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <HeartIcon className="w-6 h-6 text-red-500" />
          <p><strong>Sexual Preferences:</strong> {profileData.sexual_preferences || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 bg-transparent border border-black shadow-lg rounded-md p-4">
          <UserCircleIcon className="w-6 h-6 text-red-500" />
          <p><strong>Biography:</strong> {profileData.biography || "N/A"}</p>
        </div>

        {/* Interests */}
        <div className="bg-transparent border border-gray-700 shadow-lg rounded-md p-4 col-span-1 sm:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <SparklesIcon className="w-6 h-6 text-red-500" />
            <strong>Interests:</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.interests ? (
              JSON.parse(profileData.interests).map((interest, index) => (
                <span key={index} className="bg-gray-700 text-white px-3 py-1 text-sm rounded-md">
                  #{interest}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No interests added</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;