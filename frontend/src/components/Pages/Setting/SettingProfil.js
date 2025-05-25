import React, { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

// List of predefined interests (same as CompleteProfile)
const predefinedInterests = [
  "Vegan", "Geek", "Music", "Travel", "Sport", "Photography",
  "Art", "Gaming", "Coding", "Anime", "Piercing", "Cooking",
];

const SettingProfil = () => {
  const { userId, userEmail } = useAuth(); // Get email from auth context
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [customInterest, setCustomInterest] = useState("");
  const [profileData, setProfileData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: userEmail || "", // Pre-fill email from auth context
    gender: "",
    birthday: "",
    sexual_preferences: "",
    biography: "",
    interests: [],
    fame_rating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all user data in parallel
        const [blockedResponse, profileResponse] = await Promise.all([
          secureApiCall("/setting/blocked", "GET"),
          secureApiCall("/profile", "GET")
        ]);
        
        setBlockedUsers(blockedResponse.blocked_users || []);
        
        console.log("Profile response:", profileResponse);
        
        // Handle the case where birthday might be null from the backend
        let formattedBirthday = "";
        if (profileResponse.birthday) {
          formattedBirthday = profileResponse.birthday;
          if (!formattedBirthday.includes("-")) {
            // Convert to YYYY-MM-DD format for date input if needed
            const date = new Date(formattedBirthday);
            formattedBirthday = date.toISOString().split('T')[0];
          }
        }
        
        setProfileData({
          ...profileResponse,
          email: profileResponse.email || userEmail || "", // Ensure email is set
          birthday: formattedBirthday,
          interests: Array.isArray(profileResponse.interests) ? profileResponse.interests : []
        });
      } catch (error) {
        console.log("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, userEmail]);

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
      console.log("Unblock failed:", error);
    }
  };

  const handleInputChange = (e) => {
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
      // Update user info (personal details)
      await secureApiCall(`/profile/user_info/${userId}`, "PUT", {
        username: profileData.username,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email
      });
      
      // Update profile data (preferences and details)
      await secureApiCall(`/profile/${userId}`, "PUT", {
        gender: profileData.gender,
        sexual_preferences: profileData.sexual_preferences,
        biography: profileData.biography,
        interests: profileData.interests
      });
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.log("Failed to update profile:", error);
      alert(error.message || "Failed to update profile.");
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading profile data...</div>;
  }

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
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold mt-6 border-b border-gray-700 pb-2">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                name="username"
                value={profileData.username || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
              />
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
            
            <h3 className="text-xl font-semibold mt-6 border-b border-gray-700 pb-2">Profile Details</h3>
            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={profileData.gender || ""}
                onChange={handleInputChange}
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
              <label className="block text-sm font-medium">Sexual Preferences</label>
              <select
                name="sexual_preferences"
                value={profileData.sexual_preferences || ""}
                onChange={handleInputChange}
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
              <label className="block text-sm font-medium">Biography</label>
              <textarea
                name="biography"
                value={profileData.biography || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-800 text-white rounded"
                rows="4"
              />
            </div>
            
            {/* Interests Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Interests</label>
              
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
              Save All Changes
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