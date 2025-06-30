import axios from "axios";
import { showErrorToast } from "../utils/showErrorToast";

const API_URL = "/api";

export const apiCall = async (url, method, body) => {
  try {
    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data?.success === false) {
      showErrorToast(response.data.detail || "Unknown error");
      throw new Error(response.data.detail || "Unknown error");
    }

    return response.data;
  } catch (error) {
    // console.error(error)
    // Cas où ce n’est pas un succès contrôlé mais une vraie erreur réseau
    showErrorToast(error);
    throw new Error(error.response?.data?.detail|| "API call failed");
  }
};

axios.defaults.withCredentials = true;

export const secureApiCall = async (url, method = "GET", body = null, userId = null) => {
  const headers = {};
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (userId) {
    headers["X-User-ID"] = userId;
  }

  try {
    const response = await axios({
      url: `${API_URL}${url}`,
      method,
      data: body,
      headers,
      withCredentials: true,
    });

    if (response.data?.success === false) {
      showErrorToast(response.data.detail || "Unknown error");
      throw new Error(response.data.detail || "Unknown error");
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        await axios.post(`${API_URL}/log/refresh`, null, { withCredentials: true });
        const retryResponse = await axios({
          url: `${API_URL}${url}`,
          method,
          data: body,
          headers,
          withCredentials: true,
        });

        if (retryResponse.data?.success === false) {
          showErrorToast(retryResponse.data.detail || "Unknown error");
          throw new Error(retryResponse.data.detail || "Unknown error");
        }

        return retryResponse.data;
      } catch (refreshError) {
        showErrorToast("Session expired. Please log in again.");
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      showErrorToast(error);
      throw new Error(error.response?.data?.detail || "Request failed");
    }
  }
};