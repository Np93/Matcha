import axios from "axios";

const API_URL = "/api";

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

const buildHeaders = () => {
  const hdrs = {};
  if (!(body instanceof FormData)) {
    hdrs["Content-Type"] = "application/json";
  }
  if (userId) {
    hdrs["X-User-ID"] = userId;
  }
  return hdrs;
};

// Requête sécurisée pour les données protégées
export const secureApiCall = async (url, method = "GET", body = null, userId = null) => {
  try {
    const headers = {};
    // Si body n'est PAS un FormData, ajoute Content-Type JSON
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (userId) {
      headers["X-User-ID"] = userId;
    }

    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      headers,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        await axios.post(`${API_URL}/log/refresh`, null, { withCredentials: true });
        const retryResponse = await axios({
          url: `${API_URL}${url}`,
          method,
          data: body,
          headers: buildHeaders(),
          withCredentials: true,
        });
        return retryResponse.data;
      } catch (refreshError) {
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      throw new Error(error.response?.data?.detail || "Request failed");
    }
  }
};

// Exemple d'appel API sécurisé
export const getProfileData = () => secureApiCall("/auth/profile");