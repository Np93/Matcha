import React, { useEffect, useState } from "react";
import { secureApiCall } from "../utils/api";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 1️ Récupération des notifications
        const response = await secureApiCall("/notifications/notifications");
        console.log("Notifications récupérées :", response);
        setNotifications(response);

        // 2️ Filtrer les notifications non lues et récupérer leurs IDs
        const unreadNotificationIds = response
          .filter((notif) => !notif.is_read)
          .map((notif) => notif.id);

        // 3️ Si des notifications sont non lues, les envoyer au backend pour les passer en "lues"
        if (unreadNotificationIds.length > 0) {
            console.log("notif pas lue")
          await secureApiCall("/notifications/mark-read", "POST", {
            notification_ids: unreadNotificationIds,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications :", error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 p-5 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Notifications</h2>
      <ul>
        {notifications.map((notif, index) => (
          <li
            key={index}
            className={`border-b border-gray-700 p-3 cursor-pointer 
              ${notif.is_read ? "bg-gray-800 text-gray-400" : "bg-gray-700 text-white font-bold"}`}
            onClick={() => navigate(`/profile/${notif.sender_name}`, { state: { userId: notif.sender_id } })}
          >
            <strong>{notif.sender_name}</strong>: {notif.context}
            <p className="text-xs text-gray-400">{notif.timestamp}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;