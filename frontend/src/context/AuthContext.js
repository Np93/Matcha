import React, { createContext, useContext, useState, useEffect } from "react";
import { secureApiCall } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null pendant la vérification
  const [userId, setUserId] = useState(null);
  const [hasProfile, setHasProfile] = useState(null);
  const [emailVerified, setEmailVerified] = useState(null);

  // Vérifie l'authentification lors de l'initialisation
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (document.cookie !== "") {
          const response = await secureApiCall("/log/status"); // Vérifie si le token est valide
          setIsLoggedIn(true);
          setUserId(response.id);
          setHasProfile(response.has_profile);
          setEmailVerified(response.email_verified);
          // console.log("reponse dans AuthCon connaire val: ", response.email_verified)
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserId(null);
        setHasProfile(false);
        setEmailVerified(false);
      }
    };

    checkAuthStatus();
  }, []);

  const updateAuthContext = (user) => {
    setIsLoggedIn(true);
    setUserId(user.id);
    setHasProfile(user.has_profile !== undefined ? user.has_profile : null);
    setEmailVerified(user.email_verified !== undefined ? user.email_verified : null);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setHasProfile(false);
    setEmailVerified(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, hasProfile, emailVerified, updateAuthContext, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);