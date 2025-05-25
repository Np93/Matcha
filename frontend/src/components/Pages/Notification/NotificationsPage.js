import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import NotificationItem from "./utils/NotificationItem";
import NotificationModal from "./utils/NotificationModal";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await secureApiCall("/notifications/notifications");
        setNotifications(response);

        const unreadIds = response.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length) {
          await secureApiCall("/notifications/mark-read", "POST", {
            notification_ids: unreadIds
          });
        }
      } catch (error) {
        console.log("Erreur lors de la récupération des notifications :", error);
      }
    };

    fetchNotifications();
  }, []);

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Notifications</h2>

      {/* Non lues */}
      <div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">New</h3>
        {unread.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No new notifications</p>
        ) : (
          <div className="space-y-2 mb-6">
            {unread.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} onClick={() => setSelectedNotification(notif)} isNew />
            ))}
          </div>
        )}
      </div>

      {/* Lues */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">History</h3>
        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
          {read.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onClick={() => setSelectedNotification(notif)} />
          ))}
        </div>
      </div>

      {/* Modale */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
};

export default NotificationsPage;