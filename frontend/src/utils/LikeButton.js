import React, { useState, useEffect } from "react";
import { secureApiCall } from "./api";
import { HeartIcon } from "@heroicons/react/24/outline";

const LikeButton = ({ userId, targetId, isLiked, onLike, disabled }) => {
  const [liked, setLiked] = useState(isLiked);

  useEffect(() => {
    setLiked(isLiked); // met à jour si parent change
  }, [isLiked]);

  const handleLike = async () => {
    try {
      await secureApiCall("/match/like", "POST", { userId, targetId });
      setLiked(true);
      onLike(); // Permet de mettre à jour le parent
    } catch (error) {
      console.log("Like failed:", error);
    }
  };

  const getButtonClass = () => {
    if (liked) return "bg-gray-600 text-gray-400 cursor-not-allowed";
    if (disabled) return "bg-gray-500 text-gray-300 cursor-not-allowed";
    return "bg-red-500 text-white hover:bg-red-600";
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || disabled}
      className={`px-3 py-1 rounded-lg text-xs font-semibold ${getButtonClass()}`}
      title={
        disabled
          ? "You must upload a profile picture to like others"
          : liked
          ? "You already liked this user"
          : ""
      }
    >
      <HeartIcon className="w-4 h-4 inline-block mr-1" />
      {liked ? "Liked" : "Like"}
    </button>
  );
};

export default LikeButton;