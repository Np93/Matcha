import React from "react";
import DualSlider from "./DualSlider";

const Filters = ({ filters, handleRangeChange, toggleTags, fetchProfilesWithFilters }) => {
  return (
    <aside className="w-1/4 bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-red-500 
    space-y-4 max-h-fit">
      <h2 className="text-lg md:text-2xl font-bold text-red-500 text-center">Filters</h2>

      {/* Age Slider */}
      <div>
        <label className="block text-base font-semibold text-white mb-1">Age Range:</label>
        <p className="text-sm text-gray-400 mb-2">
          {filters.minAge} - {filters.maxAge} years
        </p>
        <DualSlider
          min={18}
          max={99}
          minValue={filters.minAge}
          maxValue={filters.maxAge}
          onChangeMin={(value) => handleRangeChange("minAge", value)}
          onChangeMax={(value) => handleRangeChange("maxAge", value)}
        />
      </div>

      {/* Fame Slider */}
      <div>
        <label className="block text-base font-semibold text-white mb-1">Fame Rating:</label>
        <p className="text-sm text-gray-400 mb-2">
          {filters.minFame} - {filters.maxFame} / 5
        </p>
        <DualSlider
          min={1}
          max={5}
          minValue={filters.minFame}
          maxValue={filters.maxFame}
          onChangeMin={(value) => handleRangeChange("minFame", value)}
          onChangeMax={(value) => handleRangeChange("maxFame", value)}
        />
      </div>

      {/* Distance Slider */}
      <div>
        <label className="block text-base font-semibold text-white mb-1">Distance (km):</label>
        <p className="text-sm text-gray-400 mb-2">
          {filters.maxDistance > 500 ? "World" : `${filters.minDistance} - ${filters.maxDistance} km`}
        </p>
        <DualSlider
          min={0}
          max={501}
          minValue={filters.minDistance}
          maxValue={filters.maxDistance}
          onChangeMin={(value) => handleRangeChange("minDistance", value)}
          onChangeMax={(value) => handleRangeChange("maxDistance", value)}
        />
      </div>

      {/* Tags Filter */}
      <label className="flex items-center space-x-3 cursor-pointer">
        <div
          className={`w-5 h-5 rounded border-2 ${
            filters.filterByTags ? "bg-red-500 border-red-600" : "bg-gray-500 border-gray-500"
          }`}
          onClick={toggleTags}
        >
          {filters.filterByTags && (
            <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-base font-semibold text-white">Tags</span>
      </label>

      {/* Search Button */}
      <button
        className="w-full px-5 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all"
        onClick={fetchProfilesWithFilters}
      >
        Search Profiles
      </button>
    </aside>
  );
};

export default Filters;