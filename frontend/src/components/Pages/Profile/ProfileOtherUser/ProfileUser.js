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
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import LikeButton from "../../../../utils/LikeButton";

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
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchProfile();
  }, [profileId]);

  const formatLastConnexion = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    const optionsTime = { hour: "2-digit", minute: "2-digit" };
    const optionsDate = { day: "2-digit", month: "long", year: "numeric" };
    const optionsDay = { weekday: "long", hour: "2-digit", minute: "2-digit" };

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], optionsTime)}`;
    } else if (diffInDays < 7) {
      return `${date.toLocaleDateString([], optionsDay)}`;
    } else {
      return date.toLocaleDateString([], optionsDate);
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

      {/* Boutons d'action */}
      <div className="flex space-x-4 mt-4">
        <LikeButton
          userId={userId}
          targetId={profileId}
          isLiked={profileData.liked}
          disabled={!canLike}
          onLike={() => setProfileData({ ...profileData, liked: true })}
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
          <GlobeAltIcon className="w-6 h-6 text-red-500" />
          <p><strong>Gender:</strong> {profileData.gender || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4 border border-black shadow-lg rounded-md p-4">
          <CalendarDaysIcon className="w-6 h-6 text-red-500" />
          <p><strong>Birthday:</strong> {profileData.birthday || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;