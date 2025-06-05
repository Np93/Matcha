import React from "react";

const SortButtons = ({ toggleSort, sortCriteria }) => {
  const buttonStyle = (criteria) =>
    `px-4 py-2 font-semibold rounded-lg transition-all whitespace-nowrap ${
      sortCriteria.includes(criteria)
        ? "bg-red-600 text-white"
        : "bg-gray-700 text-white hover:bg-gray-600"
    }`;

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full sm:w-auto">
      <button className={buttonStyle("age")} onClick={() => toggleSort("age")}>
        Age
      </button>
      <button className={buttonStyle("distance")} onClick={() => toggleSort("distance")}>
        Distance
      </button>
      <button className={buttonStyle("tags")} onClick={() => toggleSort("tags")}>
        Tags
      </button>
      <button className={buttonStyle("fame")} onClick={() => toggleSort("fame")}>
        Fame
      </button>
    </div>
  );
};

export default SortButtons;