import React, { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { secureApiCall } from "../../../utils/api";
import { showErrorToast } from "../../../utils/showErrorToast";

const API_URL = process.env.REACT_APP_API_URL;

const ProfilePicture = () => {
  const [pictures, setPictures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    try {
      const response = await secureApiCall("/setting/get_pictures", "GET");
      setPictures(response); // response = [{id, image_data}]
    } catch (err) {
      showErrorToast("Erreur lors du chargement des photos");
      setError("Failed to load pictures.");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifie le type de fichier accepté
    const acceptedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!acceptedTypes.includes(file.type)) {
      setError("Only JPG, JPEG or PNG images are allowed.");
      return;
    }

    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 500,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("image", compressedFile);

      await secureApiCall("/setting/upload_picture", "POST", formData);
      setError(null);
      fetchPictures(); // refresh
    } catch (err) {
      showErrorToast("Erreur upload");
      setError("Upload failed or maximum number of pictures reached.");
    }
  };

  const toggleSelect = (pictureId) => {
    setSelected((prevSelected) =>
      prevSelected.includes(pictureId)
        ? prevSelected.filter((id) => id !== pictureId)
        : [...prevSelected, pictureId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      setError("Please select pictures to delete.");
      return;
    }
    try {
      await secureApiCall("/setting/delete_pictures", "POST", { ids: selected });
      setSelected([]);
      fetchPictures();
    } catch (err) {
      showErrorToast("Erreur suppression");
      setError("Failed to delete pictures.");
    }
  };

  const handleSetMain = async (pictureId) => {
    try {
      await secureApiCall("/setting/set_main_picture", "POST", { picture_id: pictureId });
      setError(null);
      fetchPictures(); // Refresh pour mettre à jour le drapeau
    } catch (err) {
      showErrorToast("Erreur set main");
      setError("Failed to set main picture.");
    }
  };

  const mainPicture = pictures.find((p) => p.is_profile_picture);
  const secondaryPictures = pictures.filter((p) => !p.is_profile_picture);

  return (
    <div className="text-white p-4 max-w-xl mx-auto">
      {/* Photo principale */}
      <div className="flex flex-col items-center mb-6">
        {mainPicture ? (
          <div
            className={`w-40 h-40 rounded-full overflow-hidden shadow-lg cursor-pointer transition ${
              selected.includes(mainPicture.id)
                ? "ring-4 ring-red-500 scale-105"
                : "ring-4 ring-green-500"
            }`}
            onClick={() => toggleSelect(mainPicture.id)}
          >
            <img
              src={`data:image/jpeg;base64,${mainPicture.image_data}`}
              alt="Main profile"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-40 h-40 rounded-full bg-gray-700 bg-opacity-30 flex items-center justify-center text-gray-400 shadow-inner">
            No main photo
          </div>
        )}
        <span className="text-sm text-gray-400 mt-2">Main Photo</span>
      </div>

      {/* Zone de drop + bouton upload */}
      {pictures.length < 5 && (
        <div
          className="mb-6 p-6 border-2 border-dashed border-blue-500 rounded-lg text-center text-blue-300 hover:bg-blue-900/10 cursor-pointer transition"
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            handleImageUpload({ target: { files: [file] } });
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("imageUploadInput").click()}
        >
          <p>Click or drag an image here to upload</p>
          <input
            id="imageUploadInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Photos secondaires */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => {
          const pic = secondaryPictures[index];
          return (
            <div key={index} className="relative group w-full aspect-square">
              {pic ? (
                <>
                  <img
                    src={`data:image/jpeg;base64,${pic.image_data}`}
                    alt="profile"
                    onClick={() => toggleSelect(pic.id)}
                    className={`w-full h-full object-cover rounded-lg cursor-pointer transition-transform ${
                      selected.includes(pic.id)
                        ? "ring-4 ring-red-500 scale-105"
                        : "hover:scale-105"
                    }`}
                  />
                  <button
                    onClick={() => handleSetMain(pic.id)}
                    className="absolute bottom-1 left-1 text-xs bg-green-600 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    Set as Main
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gray-600 bg-opacity-20 rounded-lg flex items-center justify-center text-gray-300">
                  Empty
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => {
            const width = 500;
            const height = 600;
            const left = window.innerWidth / 2 - width / 2;
            const top = window.innerHeight / 2 - height / 2;

            const popup = window.open(
            `${API_URL}/auth/google/picture`,
            "Google Picture Import",
            `width=${width},height=${height},top=${top},left=${left}`
            );

            const listener = async (event) => {
            if (event.data?.type === "google-picture-success") {
                window.removeEventListener("message", listener);
                await fetchPictures(); // recharge les photos automatiquement
            }
            };

            window.addEventListener("message", listener);
        }}
        className="mt-4 w-full flex items-center justify-center gap-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition duration-200"
        >
        <img
            src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
            alt="Google"
            className="w-5 h-5"
        />
        <span className="font-medium">Import from Google</span>
      </button>

      {/* Bouton suppression */}
      {selected.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleDeleteSelected}
            className="px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Message d'erreur */}
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default ProfilePicture;