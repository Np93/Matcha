import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

const SettingProfil = () => {
  const { userId } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        // commence cibler modifer pour la suite actuelleemnt du debug
        const response = await secureApiCall("/setting/blocked", "GET");
        setBlockedUsers(response.blocked_users || []);
      } catch (error) {
        console.error("Failed to fetch blocked users:", error);
      }
    };

    fetchBlockedUsers();
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleUnblock = async () => {
    try {
    // commence cibler modifer pour la suite actuelleemnt du debug
      await secureApiCall("/setting/unblock", "POST", { userId, targetIds: selectedIds });
      setBlockedUsers((prev) => prev.filter((user) => !selectedIds.includes(user.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Unblock failed:", error);
    }
  };

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Blocked Users</h2>

      {blockedUsers.length === 0 ? (
        <p className="text-gray-400">You haven't blocked any users.</p>
      ) : (
        <>
          <ul className="space-y-3 mb-4">
            {blockedUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3 bg-gray-800 p-3 rounded-md">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleSelection(user.id)}
                  className="form-checkbox h-5 w-5 text-red-500"
                />
                <span>{user.username}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUnblock}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded disabled:opacity-50"
          >
            Unblock Selected
          </button>
        </>
      )}
    </div>
  );
};

export default SettingProfil;