import axios from "axios";

const API_URL = "http://localhost:8000";

export const apiCall = async (url, method, body) => {
  try {
    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      withCredentials: true, // Inclut automatiquement les cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("API call failed:", error);
    throw new Error(error.response?.data?.detail || "API call failed");
  }
};

// Configurer Axios pour inclure les cookies dans toutes les requêtes
axios.defaults.withCredentials = true;

// Requête sécurisée pour les données protégées
export const secureApiCall = async (url, method = "GET", body = null, userId = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (userId) {
      headers["X-User-ID"] = userId; // Ajoute l'ID utilisateur dans le header
    }

    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      headers,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expiré, essayons de rafraîchir
      try {
        await axios.post(`${API_URL}/log/refresh`);
        // Relancer la requête après le rafraîchissement
        const retryResponse = await axios({
          url: `${API_URL}${url}`,
          method,
          data: body,
          headers: { "Content-Type": "application/json" },
        });
        return retryResponse.data;
      } catch (refreshError) {
        // Échec du rafraîchissement
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      throw new Error(error.response?.data?.detail || "Request failed");
    }
  }
};

// Exemple d'appel API sécurisé
export const getProfileData = () => secureApiCall("/auth/profile");