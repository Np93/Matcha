import React from "react";
import { useNavigate } from "react-router-dom";

const NotificationModal = ({ notification, onClose }) => {
  const navigate = useNavigate();

  const extractedName = notification.context?.split(" ")[0] || "unknown";

  const goToProfile = () => {
    navigate(`/profile/${notification.sender_name}`, {
      state: { userId: notification.sender_id },
    });
    onClose(); // Ferme la modale après redirection
  };

  const formatDate = (utcString) => {
    const date = new Date(utcString); // UTC automatiquement reconnu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");     // Local time
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full relative shadow-lg border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-300 hover:text-white text-lg"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-red-400 mb-4 capitalize">
          {notification.type} Notification
        </h3>

        <p className="mb-4">
          <span className="font-semibold text-gray-300">Message:</span> {notification.context}
        </p>

        <p className="mb-4 text-sm text-gray-300">
          <span className="font-semibold">From:</span>{" "}
          <button
            onClick={goToProfile}
            className="text-red-500 hover:underline focus:outline-none"
          >
            profil de {extractedName}
          </button>
        </p>

        <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
      </div>
    </div>
  );
};

export default NotificationModal;