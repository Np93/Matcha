import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import Filters from "./utils/Filters";
import SortButtons from "./utils/SortButtons";
import ProfileCard from "./utils/ProfileCard";
import LikeButton from "../../../utils/LikeButton";
import UserMap from "./utils/UserMap";

const Match = () => {
  const [profiles, setProfiles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const filterRef = useRef(null);
  const mapRef = useRef(null);
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 99,
    minFame: 0,
    maxFame: 5,
    minDistance: 0,
    maxDistance: 500,
    filterByTags: false,
  });

  const [sortCriteria, setSortCriteria] = useState([]);
  const [canLike, setCanLike] = useState(true);

  useEffect(() => {
    const fetchInitialProfiles = async () => {
      try {
        const response = await secureApiCall("/match/profiles", "GET");
        setProfiles(response.profiles);
        setCanLike(response.can_like);
        if (response.user_location) {
          setUserLocation([
            response.user_location.latitude,
            response.user_location.longitude,
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };
    fetchInitialProfiles();
  }, []);

  const fetchProfilesWithFilters = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await secureApiCall(`/match/filter_profiles?${queryParams}`, "GET");
      setProfiles(response.profiles);
      setCanLike(response.can_like);
      if (response.user_location) {
        setUserLocation([
          response.user_location.latitude,
          response.user_location.longitude,
        ]);
      }
      setShowFilters(false);
    } catch (error) {
      console.error("Failed to fetch filtered profiles:", error);
    }
  };

  const handleClickOutside = (ref, onClose) => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  };

  useEffect(() => {
    if (showFilters) return handleClickOutside(filterRef, () => setShowFilters(false));
  }, [showFilters]);

  useEffect(() => {
    if (showMap) return handleClickOutside(mapRef, () => setShowMap(false));
  }, [showMap]);

  const toggleSort = (criteria) => {
    setSortCriteria((prev) =>
      prev.includes(criteria) ? prev.filter((c) => c !== criteria) : [...prev, criteria]
    );
  };

  const handleLike = (targetId) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, liked: true } : p))
    );
  };

  const fieldMap = {
    age: "age",
    distance: "distance_km",
    tags: "common_tags",
    fame: "fame_rating",
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    for (const criteria of sortCriteria) {
      const field = fieldMap[criteria];
      if (a[field] !== b[field]) {
        const multiplier = ["tags", "fame"].includes(criteria) ? -1 : 1;
        return multiplier * (a[field] - b[field]);
      }
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 overflow-x-hidden">
      {/* Header boutons */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <SortButtons toggleSort={toggleSort} sortCriteria={sortCriteria} />
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setShowFilters(true)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold w-full sm:w-auto"
          >
            Filters
          </button>
          <button
            onClick={() => setShowMap(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold w-full sm:w-auto"
          >
            Show Map
          </button>
        </div>
      </div>

      {/* Profils */}
      <h2 className="text-xl md:text-2xl font-bold text-center mb-4">Discover Profiles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedProfiles.length > 0 ? (
          sortedProfiles.map((profile) => (
            <ProfileCard
              key={`${profile.id}-${profile.age}`}
              profile={profile}
              navigate={navigate}
              extraButtons={
                <LikeButton
                  userId={userId}
                  targetId={profile.id}
                  isLiked={profile.liked}
                  onLike={() => handleLike(profile.id)}
                  disabled={!canLike}
                />
              }
            />
          ))
        ) : (
          <p className="text-center text-gray-400 col-span-full">No profiles available.</p>
        )}
      </div>

      {/* Modale filtre */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div ref={filterRef} className="bg-gray-800 p-6 rounded-lg w-[90%] max-w-xl border-2 border-red-500 shadow-lg">
            <Filters
              filters={filters}
              handleRangeChange={(type, value) =>
                setFilters((prev) => ({ ...prev, [type]: value }))
              }
              toggleTags={() =>
                setFilters((prev) => ({ ...prev, filterByTags: !prev.filterByTags }))
              }
              fetchProfilesWithFilters={fetchProfilesWithFilters}
            />
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modale carte */}
      {showMap && userLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div ref={mapRef} className="bg-gray-900 p-2 rounded-lg w-[95%] max-w-4xl">
            <UserMap
              currentUserPosition={userLocation}
              users={sortedProfiles.filter((u) => u.latitude && u.longitude && u.main_picture)}
            />
            <button
              onClick={() => setShowMap(false)}
              className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Match;