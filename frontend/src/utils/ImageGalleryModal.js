import React from "react";

const ImageGalleryModal = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl">&times;</button>

      <button onClick={onPrev} className="absolute left-4 text-white text-3xl">&lsaquo;</button>

      <img
        src={images[currentIndex]}
        alt="Profile"
        className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
      />

      <button onClick={onNext} className="absolute right-4 text-white text-3xl">&rsaquo;</button>
    </div>
  );
};

export default ImageGalleryModal;