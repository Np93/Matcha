import React, { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import ImageGalleryModal from "./ImageGalleryModal"; // adapte selon ton arborescence
import FameRatingStars from "./FameRatingStars"; // idem

const ProfilePictureDisplay = ({ pictures = [], fameRating = 0 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trie pour placer la photo principale d'abord
  const sortedPictures = [...pictures].sort((a, b) =>
    (b.is_profile_picture ? 1 : 0) - (a.is_profile_picture ? 1 : 0)
  );

  const urls = sortedPictures.map((pic) => `data:image/jpeg;base64,${pic.image_data}`);

  const openModal = (index) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % urls.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-32 h-32">
        {urls.length > 0 ? (
          <div
            className="w-32 h-32 rounded-full overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition"
            onClick={() => openModal(0)}
          >
            <img
              src={urls[0]}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        ) : (
          <UserCircleIcon className="w-32 h-32 text-gray-400" />
        )}

        {/* Badge photo count */}
        {urls.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-semibold px-2 py-0.5 rounded-full shadow-md">
            {urls.length} photo{urls.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Fame rating */}
      <div className="mt-4">
        <FameRatingStars fame_rating={fameRating} />
      </div>

      {/* Modale galerie */}
      {isModalOpen && (
        <ImageGalleryModal
          images={urls}
          currentIndex={currentIndex}
          onClose={closeModal}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
};

export default ProfilePictureDisplay;