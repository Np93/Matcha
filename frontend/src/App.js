import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Signup from "./components/SignupForm";
import Login from "./components/LoginForm";
import Profile from "./components/Profile";
import Chat from "./components/Chat";
import Match from "./components/Match";
import Settings from "./components/Settings";
import Notif from "./components/NotificationsPage";
import ProfileUser from "./components/ProfileUser";
import CompleteProfile from "./components/CompleteProfile";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ element: Component }) => {
    const { isLoggedIn } = useAuth();
    const location = useLocation();
  
    if (isLoggedIn === null) {
      return <div>Loading...</div>; // Montre un écran de chargement pendant la vérification
    }
  
    return isLoggedIn ? (
      <Component />
    ) : (
      <Navigate to="/login" state={{ from: location }} />
    );
  };

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={<ProtectedRoute element={Profile} />}
            />
            <Route
              path="/chat"
              element={<ProtectedRoute element={Chat} />}
            />
            <Route
              path="/match"
              element={<ProtectedRoute element={Match} />}
            />
            <Route
              path="/notification"
              element={<ProtectedRoute element={Notif} />}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute element={Settings} />}
            />
            <Route path="/profile/:username" element={<ProfileUser />} />
            <Route path="/complete-profile" element={<ProtectedRoute element={CompleteProfile} />} />
            {/* Ajoutez d'autres routes protégées ici */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;