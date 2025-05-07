import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

// List of predefined interests (same as CompleteProfile)
const predefinedInterests = [
  "Vegan", "Geek", "Music", "Travel", "Sport", "Photography",
  "Art", "Gaming", "Coding", "Anime", "Piercing", "Cooking",
];

const SettingProfil = () => {
  const { userId } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [customInterest, setCustomInterest] = useState("");
  const [profileData, setProfileData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    gender: "",
    birthday: "",
    sexual_preferences: "",
    biography: "",
    interests: [],
    fame_rating: 0
  });

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const response = await secureApiCall("/setting/blocked", "GET");
        setBlockedUsers(response.blocked_users || []);
      } catch (error) {
        console.error("Failed to fetch blocked users:", error);
      }
    };

    const fetchProfile = async () => {
      try {
        // First fetch the general profile data
        const response = await secureApiCall("/profile", "GET");
        
        setProfileData({
          ...response,
          interests: Array.isArray(response.interests) ? response.interests : []
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    };

    fetchBlockedUsers();
    fetchProfile();
  }, [userId]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleUnblock = async () => {
    try {
      await secureApiCall("/setting/unblock", "POST", { userId, targetIds: selectedIds });
      setBlockedUsers((prev) => prev.filter((user) => !selectedIds.includes(user.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Unblock failed:", error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle an interest (add or remove)
  const toggleInterest = (interest) => {
    setProfileData((prev) => {
      const currentInterests = [...prev.interests];
      return {
        ...prev,
        interests: currentInterests.includes(interest)
          ? currentInterests.filter(item => item !== interest)
          : [...currentInterests, interest]
      };
    });
  };

  // Add custom interest
  const addCustomInterest = () => {
    if (customInterest.trim() && !profileData.interests.includes(customInterest.trim())) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, customInterest.trim()]
      }));
      setCustomInterest(""); // Reset input field
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only send the fields that can be modified
      const dataToSubmit = {
        gender: profileData.gender,
        sexual_preferences: profileData.sexual_preferences,
        biography: profileData.biography,
        interests: profileData.interests
      };
      
      await secureApiCall(`/profile/${userId}`, "PUT", dataToSubmit);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 ${activeTab === "profile" ? "border-b-2 border-red-500 text-red-500" : "text-gray-400"}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Settings
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "blocked" ? "border-b-2 border-red-500 text-red-500" : "text-gray-400"}`}
          onClick={() => setActiveTab("blocked")}
        >
          Blocked Users
        </button>
      </div>

      {activeTab === "profile" ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
          <div className="bg-red-900 p-3 rounded-md mb-4">
            <p className="text-white font-bold">You can only modify the following fields:</p>
            <ul className="list-disc pl-5 text-white">
              <li>Gender</li>
              <li>Sexual preferences</li>
              <li>Biography</li>
              <li>List of interests (tags)</li>
            </ul>
            <p className="text-white mt-2">Other information cannot be updated.</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Username (Read-only)</label>
              <input
                type="text"
                name="username"
                value={profileData.username || ""}
                className="w-full p-2 bg-gray-800 text-white rounded opacity-70 cursor-not-allowed"
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">First Name (Read-only)</label>
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name || ""}
                  className="w-full p-2 bg-gray-800 text-white rounded opacity-70 cursor-not-allowed"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name (Read-only)</label>
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name || ""}
                  className="w-full p-2 bg-gray-800 text-white rounded opacity-70 cursor-not-allowed"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Gender (Editable)</label>
              <select
                name="gender"
                value={profileData.gender || ""}
                onChange={handleProfileChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Birthday (Read-only)</label>
              <input
                type="date"
                name="birthday"
                value={profileData.birthday || ""}
                className="w-full p-2 bg-gray-800 text-white rounded opacity-70 cursor-not-allowed"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Sexual Preferences (Editable)</label>
              <select
                name="sexual_preferences"
                value={profileData.sexual_preferences || ""}
                onChange={handleProfileChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
              >
                <option value="">Select Preference</option>
                <option value="heterosexual">Heterosexual</option>
                <option value="homosexual">Homosexual</option>
                <option value="bisexual">Bisexual</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Biography (Editable)</label>
              <textarea
                name="biography"
                value={profileData.biography || ""}
                onChange={handleProfileChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
                rows="4"
              />
            </div>
            
            {/* Interests Section - Updated to match CompleteProfile */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Interests (Editable)</label>
              
              {/* Predefined Interests */}
              <div className="flex flex-wrap gap-2">
                {predefinedInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 text-sm rounded-md border transition ${
                      profileData.interests.includes(interest)
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-transparent text-gray-300 border-gray-500 hover:border-red-400 hover:text-red-400"
                    }`}
                  >
                    #{interest}
                  </button>
                ))}
              </div>

              {/* Custom Interest Input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="flex-1 bg-transparent text-white border border-gray-600 rounded-md px-3 py-1"
                  placeholder="Add a custom interest..."
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="bg-red-500 px-3 py-1 rounded-md text-white hover:bg-red-600"
                >
                  Add
                </button>
              </div>

              {/* Selected Interests Display */}
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-white px-3 py-1 text-sm rounded-md flex items-center"
                  >
                    #{interest}
                    <button
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {profileData.fame_rating !== undefined && (
              <div>
                <label className="block text-sm font-medium">Fame Rating (Read-only)</label>
                <div className="p-2 bg-gray-800 rounded">
                  <div className="flex items-center">
                    <div className="h-2 bg-red-500 rounded" style={{ width: `${(profileData.fame_rating / 50) * 100}%` }}></div>
                    <span className="ml-2">{profileData.fame_rating}/50</span>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
            >
              Save Changes
            </button>
          </form>
        </div>
      ) : (
        // Blocked Users tab content
        <div>
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
      )}
    </div>
  );
};

export default SettingProfil;