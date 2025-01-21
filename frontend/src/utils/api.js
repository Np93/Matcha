import axios from "axios";

// Fonction pour gérer la connexion de l'utilisateur
export const login = async (email, password) => {
    try {
      // Envoi des informations de connexion au backend
      const response = await axios.post(
        "http://localhost:8000/auth/login", // URL de l'API pour se connecter
        {
          email, // Corps de la requête : email
          password, // Corps de la requête : mot de passe
        },
        {
          withCredentials: true, // Autorise l'utilisation des cookies pour stocker le JWT
        }
      );
  
      return response.data.message; // Retourne le message de succès envoyé par le backend
    } catch (error) {
      console.error("Login failed:", error); // Affiche l'erreur dans la console
      throw new Error(error.response?.data?.detail || "Login failed"); // Lève une erreur pour le frontend
    }
  };


export const apiCall = async (url, method, body) => {
  try {
    const response = await axios({
      url,
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

const API_URL = "http://localhost:8000"; // Remplacez par l'URL de votre backend

// Requête sécurisée pour les données protégées
export const secureApiCall = async (url, method = "GET", body = null) => {
  try {
    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expiré, essayons de rafraîchir
      try {
        await axios.post(`${API_URL}/auth/refresh`);
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
export const getProfileData = () => secureApiCall("/profile");