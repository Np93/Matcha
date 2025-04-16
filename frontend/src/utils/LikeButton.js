import React, { useState } from "react";
import { secureApiCall } from "./api";
import { HeartIcon } from "@heroicons/react/24/outline";

const LikeButton = ({ userId, targetId, isLiked, onLike }) => {
  const [liked, setLiked] = useState(isLiked);

  const handleLike = async () => {
    try {
      await secureApiCall("/match/like", "POST", { userId, targetId });
      setLiked(true);
      onLike(); // Permet de mettre à jour le state du composant parent
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  return (
    <button
      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
        liked
          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
          : "bg-red-500 text-white hover:bg-red-600"
      }`}
      onClick={handleLike}
      disabled={liked}
    >
      <HeartIcon className="w-4 h-4 inline-block mr-1" />
      Like
    </button>
  );
};

export default LikeButton;