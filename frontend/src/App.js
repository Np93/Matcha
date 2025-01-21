import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Signup from "./components/SignupForm";
import Login from "./components/LoginForm";
import Profile from "./components/Profile";
import { secureApiCall } from "./utils/api";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
    useEffect(() => {
      const checkAuth = async () => {
        try {
          await secureApiCall("/profile");
          setIsLoggedIn(true);
        } catch {
          setIsLoggedIn(false);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      checkAuth();
    }, []);
  
    if (isCheckingAuth) {
      return <div>Loading...</div>; // Écran de chargement pendant la vérification
    }

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
          <Route
            path="/profile"
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;