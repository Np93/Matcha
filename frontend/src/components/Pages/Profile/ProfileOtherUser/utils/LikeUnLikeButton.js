import React, { useState } from "react";
import { secureApiCall } from "../../../../../utils/api";
import UnlikeConfirmationModal from "./UnlikeConfirmationModal";

const LikeButton = ({ userId, targetId, isLiked, isUnliked, onLike, onUnlike, disabled }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLike = async () => {
    try {
      await secureApiCall("/match/like", "POST", { userId, targetId });
      onLike();
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleConfirmUnlike = async () => {
    try {
      await secureApiCall("/match/unlike", "POST", { userId, targetId });
      onUnlike();
      setShowConfirm(false);
    } catch (error) {
      console.error("Unlike failed:", error);
    }
  };

  if (isUnliked) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-500 text-white cursor-not-allowed"
        title="You have already unliked this user"
      >
        ❌ Unliked
      </button>
    );
  }

  if (isLiked) {
    return (
      <>
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-400 text-white hover:bg-red-500"
          onClick={() => setShowConfirm(true)}
        >
          💔 Unlike
        </button>
        {showConfirm && (
          <UnlikeConfirmationModal
            onConfirm={handleConfirmUnlike}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
        disabled
          ? "bg-gray-500 text-gray-300 cursor-not-allowed"
          : "bg-green-500 text-white hover:bg-green-700"
      }`}
      title={
        disabled
          ? "You must upload a profile picture to like others"
          : "Click to like this user"
      }
    >
      ❤️ Like
    </button>
  );
};

export default LikeButton;