import React, { createContext, useContext, useState, useEffect } from "react";
import { secureApiCall } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null pendant la vérification
  const [userId, setUserId] = useState(null);

  // Vérifie l'authentification lors de l'initialisation
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await secureApiCall("/auth/status"); // Vérifie si le token est valide
        setIsLoggedIn(true);
        setUserId(response.id);
      } catch (error) {
        setIsLoggedIn(false);
        setUserId(null);
      }
    };

    checkAuthStatus();
  }, []);

  const updateAuthContext = (user) => {
    setIsLoggedIn(true);
    setUserId(user.id);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, updateAuthContext, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);