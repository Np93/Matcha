import React, { useState } from "react";
import { secureApiCall } from "../../../../utils/api";

const timeSlots = ["Semaine", "Week-end", "Matin", "Après-midi", "Soirée"];
const activities = [
  "Aller danser", "Boire un verre", "Faire une balade", "Balade en montagne",
  "Balade à vélo", "Faire du sport", "Balade en rollers", "Aller à la patinoire",
  "Aller au resto", "Un truc chic", "Fais-moi la surprise"
];

const DatePlanner = ({ chatId, onClose }) => {
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const toggleItem = (item, setter, state) => {
    setter(state.includes(item) ? state.filter(i => i !== item) : [...state, item]);
  };

  const submitPreferences = async () => {
    await secureApiCall("/chat/date_invite/preferences", "POST", {
      chat_id: chatId,
      moments: selectedTimes,
      activities: selectedActivities,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-xl max-w-md w-full shadow-xl space-y-4">
        <h2 className="text-xl font-bold">Planifiez votre rendez-vous</h2>

        <div>
          <h3 className="font-semibold mb-1">Moments :</h3>
          {timeSlots.map((slot) => (
            <label key={slot} className="block">
              <input
                type="checkbox"
                checked={selectedTimes.includes(slot)}
                onChange={() => toggleItem(slot, setSelectedTimes, selectedTimes)}
              />{" "}
              {slot}
            </label>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-1">Activités :</h3>
          {activities.map((act) => (
            <label key={act} className="block">
              <input
                type="checkbox"
                checked={selectedActivities.includes(act)}
                onChange={() => toggleItem(act, setSelectedActivities, selectedActivities)}
              />{" "}
              {act}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-500 text-white px-3 py-1 rounded">
            Annuler
          </button>
          <button onClick={submitPreferences} className="bg-blue-600 text-white px-3 py-1 rounded">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePlanner;