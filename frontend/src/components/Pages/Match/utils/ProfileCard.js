import React from "react";
import { HeartIcon, UserCircleIcon } from "@heroicons/react/24/solid";

const ProfileCard = ({ profile, navigate, extraButtons }) => {
  return (
    <div className="bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-700">
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-red-500 mx-auto">
        {profile.profile_picture ? (
          <img src={profile.profile_picture} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <UserCircleIcon className="w-full h-full text-gray-400" />
        )}
      </div>
      <h3 className="text-base font-semibold mt-2 text-center">{profile.username}</h3>
      <p className="text-xs text-gray-400 text-center">Age: {profile.age}</p>
      <p className="text-xs text-gray-400 text-center">Distance: {profile.distance_km} km</p>
      <p className="text-xs text-gray-400 text-center">Fame: {profile.fame_rating}</p>
      <p className="text-xs text-gray-400 text-center">Common Tags: {profile.common_tags}</p>

      <div className="flex justify-center gap-2 mt-3">
        {extraButtons}

        <button
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-700 text-white hover:bg-gray-600"
          onClick={() => navigate(`/profile/${profile.username}`, { state: { userId: profile.id } })}
        >
          Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;