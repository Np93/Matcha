import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import Filters from "./utils/Filters";
import SortButtons from "./utils/SortButtons";
import ProfileCard from "./utils/ProfileCard";
import LikeButton from "../../../utils/LikeButton"; // Ajout du bouton Like

const Match = () => {
  const [profiles, setProfiles] = useState([]);
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 99,
    minFame: 1,
    maxFame: 5,
    minDistance: 0,
    maxDistance: 500,
    filterByTags: false,
  });
  const [sortCriteria, setSortCriteria] = useState([]);
  const navigate = useNavigate();
  const { userId } = useAuth();

  useEffect(() => {
    const fetchInitialProfiles = async () => {
      try {
        const response = await secureApiCall("/match/profiles", "GET");
        setProfiles(response);
      } catch (error) {
        console.error("Failed to fetch initial profiles:", error);
      }
    };
    fetchInitialProfiles();
  }, []);

  const fetchProfilesWithFilters = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await secureApiCall(`/match/filter_profiles?${queryParams}`, "GET");
      setProfiles(response);
    } catch (error) {
      console.error("Failed to fetch filtered profiles:", error);
    }
  };

  const handleLike = (targetId) => {
    setProfiles((prev) =>
      prev.map((profile) => (profile.id === targetId ? { ...profile, liked: true } : profile))
    );
  };

  const handleRangeChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: Number(value),
    }));
  };

  const toggleSort = (criteria) => {
    setSortCriteria((prev) =>
      prev.includes(criteria) ? prev.filter((c) => c !== criteria) : [...prev, criteria]
    );
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    for (const criteria of ["age", "distance", "tags", "fame"]) {
      if (sortCriteria.includes(criteria)) {
        if (a[criteria] !== b[criteria]) {
          return a[criteria] - b[criteria];
        }
      }
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex gap-6">
      <Filters
        filters={filters}
        handleRangeChange={handleRangeChange}
        toggleTags={() => setFilters({ ...filters, filterByTags: !filters.filterByTags })}
        fetchProfilesWithFilters={fetchProfilesWithFilters}
      />

      <div className="flex-1 space-y-4">
        <SortButtons toggleSort={toggleSort} sortCriteria={sortCriteria} />

        <main>
          <h2 className="text-lg md:text-2xl font-bold text-center mb-4">Discover Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProfiles.length > 0 ? (
              sortedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  navigate={navigate}
                  extraButtons={
                    <LikeButton userId={userId} targetId={profile.id} isLiked={profile.liked} onLike={() => handleLike(profile.id)} />
                  }
                />
              ))
            ) : (
              <p className="text-center text-gray-400">No profiles available.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Match;