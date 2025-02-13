import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { HeartIcon, UserCircleIcon } from "@heroicons/react/24/solid"; // Heroicons pour les icônes

const Match = () => {
  const [profiles, setProfiles] = useState([]); // Stocke les profils récupérés
  const navigate = useNavigate();
  const { userId } = useAuth(); // Récupère l'ID de l'utilisateur connecté

  // 🔹 Récupère les profils depuis le backend
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await secureApiCall("/match/profiles"); // Endpoint pour récupérer tous les profils
        setProfiles(response);
        console.log(response)
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };
    fetchProfiles();
  }, []);

  // 🔹 Fonction pour liker un profil
  const handleLike = async (targetId) => {
    try {
      const response = await secureApiCall("/match/like", "POST", { userId, targetId });

      if (response.matched) {
        alert("It's a match! A new chat has been created.");
      } else {
        alert("You liked this profile!");
      }
    } catch (error) {
      console.error("Like failed:", error);
      alert("Error liking the profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Discover Profiles</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <div key={profile.id} className="bg-black bg-opacity-50 shadow-md rounded-lg p-4 flex flex-col items-center">
              {/* Photo de profil */}
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg mb-4">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-400" />
                )}
              </div>

              {/* Nom d'utilisateur */}
              <h3 className="text-lg font-semibold">{profile.username}</h3>
              <p className="text-sm text-gray-300">{profile.distance_km} km</p>

              {/* Boutons d'action */}
              <div className="flex gap-4 mt-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600"
                  onClick={() => handleLike(profile.id)}
                >
                  <HeartIcon className="w-5 h-5" />
                  Like
                </button>
                <button
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  // onClick={() => navigate(`/profile/${profile.id}`)}
                  onClick={() => navigate(`/profile/${profile.username}`, { state: { userId: profile.id } })}
                >
                  Profile
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No profiles available.</p>
        )}
      </div>
    </div>
  );
};

export default Match;