import React from "react";

const FameRatingStars = ({ fame_rating, uniqueId = "" }) => {
    const totalStars = 5;
    const stars = [];
  
    for (let i = 0; i < totalStars; i++) {
      const starValue = fame_rating - i * 10;
      const fillPercent = Math.max(0, Math.min(100, (starValue / 10) * 100));
      const gradientId = `star-gradient-${uniqueId}-${i}`;
  
      stars.push(
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId}>
              <stop offset={`${fillPercent}%`} stopColor="#ef4444" />
              <stop offset={`${fillPercent}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
               9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            fill={`url(#${gradientId})`}
            stroke="black"
            strokeWidth="1.5"
          />
        </svg>
      );
    }
  
    return (
      <div className="flex gap-1 justify-center items-center">
        {stars}
      </div>
    );
  };

export default FameRatingStars;