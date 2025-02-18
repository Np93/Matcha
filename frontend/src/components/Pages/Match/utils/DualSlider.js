import React, { useState, useRef } from "react";

const DualSlider = ({ 
  min, 
  max, 
  minValue, 
  maxValue, 
  onChangeMin, 
  onChangeMax, 
  thickness = 6 
}) => {
  const sliderRef = useRef(null);
  const [activeThumb, setActiveThumb] = useState(null);

  const handleMouseMove = (e) => {
    if (!activeThumb) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
    const newValue = Math.round(min + percentage * (max - min));

    if (activeThumb === "min") {
      onChangeMin(Math.min(newValue, maxValue - 1));
    } else if (activeThumb === "max") {
      onChangeMax(Math.max(newValue, minValue + 1));
    }
  };

  const handleMouseUp = () => setActiveThumb(null);

  const minPosition = ((minValue - min) / (max - min)) * 100;
  const maxPosition = ((maxValue - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className={`relative w-full bg-gray-400 rounded-full`}
      style={{ height: `${thickness}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Barre rouge sélectionnée */}
      <div
        className="absolute bg-red-500 rounded-full"
        style={{
          left: `${minPosition}%`,
          width: `${maxPosition - minPosition}%`,
          height: `${thickness}px`,
        }}
      />

      {/* Curseur Min */}
      <div
        className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-red-500 rounded-full shadow cursor-pointer"
        style={{
          left: `${minPosition}%`,
          transform: "translate(-50%, -50%)",
          top: "50%",
        }}
        onMouseDown={() => setActiveThumb("min")}
      />

      {/* Curseur Max */}
      <div
        className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-red-500 rounded-full shadow cursor-pointer"
        style={{
          left: `${maxPosition}%`,
          transform: "translate(-50%, -50%)",
          top: "50%",
        }}
        onMouseDown={() => setActiveThumb("max")}
      />
    </div>
  );
};

export default DualSlider;