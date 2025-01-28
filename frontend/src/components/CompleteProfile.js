import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CompleteProfile = () => {
  const [gender, setGender] = useState("");
  const [sexualPreferences, setSexualPreferences] = useState("");
  const [biography, setBiography] = useState("");
  const [interests, setInterests] = useState("");
  const [birthday, setBirthday] = useState(null); // Stocke la date d'anniversaire
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que les champs obligatoires sont remplis
    if (!gender || !sexualPreferences || !birthday) {
      alert("Please fill in all required fields (Gender, Sexual Preferences, and Birthday).");
      return;
    }

    // Formater la date au format YYYY-MM-DD
    const formattedBirthday = birthday.toISOString().split("T")[0];
    console.log(formattedBirthday);
    try {
      const response = await secureApiCall("/profiles_complete/", "POST", {
        gender,
        sexual_preferences: sexualPreferences,
        biography,
        interests: interests.split(",").map((tag) => tag.trim()), // Transforme en tableau
        birthday: formattedBirthday, // Ajoute la date de naissance formatée
      });

      alert(response.message);
      navigate("/profile"); // Redirige vers la page profil
    } catch (error) {
      console.error("Failed to complete profile:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-transparent shadow-lg rounded-lg p-6 w-full max-w-2xl border border-gray-600">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">
          Complete Your Profile
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Gender */}
          <div className="space-y-2 col-span-1">
            <label className="block text-white">Gender (Required):</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="w-full bg-transparent text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="" className="text-gray-400">
                Select Gender
              </option>
              <option value="male" className="text-black">
                Male
              </option>
              <option value="female" className="text-black">
                Female
              </option>
              <option value="non-binary" className="text-black">
                Non-binary
              </option>
              <option value="other" className="text-black">
                Other
              </option>
            </select>
          </div>

          {/* Sexual Preferences */}
          <div className="space-y-2 col-span-1">
            <label className="block text-white">
              Sexual Preferences (Required):
            </label>
            <select
              value={sexualPreferences}
              onChange={(e) => setSexualPreferences(e.target.value)}
              required
              className="w-full bg-transparent text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="" className="text-gray-400">
                Select Preferences
              </option>
              <option value="heterosexual" className="text-black">
                Heterosexual
              </option>
              <option value="homosexual" className="text-black">
                Homosexual
              </option>
              <option value="bisexual" className="text-black">
                Bisexual
              </option>
              <option value="other" className="text-black">
                Other
              </option>
            </select>
          </div>

          {/* Birthday */}
          <div className="space-y-2 col-span-1 sm:col-span-2">
            <label className="block text-white">Birthday (Required):</label>
            <DatePicker
              selected={birthday}
              onChange={(date) => setBirthday(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full bg-transparent text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholderText="Select your birthday"
              showYearDropdown // Permet de sélectionner rapidement l'année
              scrollableYearDropdown // Active le défilement dans le menu déroulant des années
              yearDropdownItemNumber={100} // Affiche 100 ans dans le sélecteur déroulant
              showMonthDropdown // Permet de sélectionner rapidement le mois
              preventOpenOnFocus // Empêche le champ de s'ouvrir en cas de clic
              onKeyDown={(e) => e.preventDefault()} // Désactive la saisie manuelle
              maxDate={new Date()} // pas de date future
            />
          </div>

          {/* Biography */}
          <div className="space-y-2 col-span-1 sm:col-span-2">
            <label className="block text-white">Biography:</label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full bg-transparent text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows="3"
            ></textarea>
          </div>

          {/* Interests */}
          <div className="space-y-2 col-span-1 sm:col-span-2">
            <label className="block text-white">
              Interests (comma-separated tags):
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full bg-transparent text-white border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {/* Submit Button */}
          <div className="col-span-1 sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Complete Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;