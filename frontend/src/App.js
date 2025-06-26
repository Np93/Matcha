import React from "react";
// import AuthGate from "./context/AuthGate";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./components/Pages/Home/Home";
import Navbar from "./components/Navbar";
import Signup from "./components/Pages/Auth/Signup/SignupForm";
import Login from "./components/Pages/Auth/Login/LoginForm";
import EmailPendingPage from "./components/Pages/Auth/Email/EmailPendingPage";
import EmailConfirmLink from "./components/Pages/Auth/Email/EmailConfirmLink";
import Profile from "./components/Pages/Profile/ProfilePersonal/Profile";
import Chat from "./components/Pages/Chat/Chat";
import Match from "./components/Pages/Match/Match";
// import Settings from "./components/Pages/Setting/Settings";
import SettingLocation from "./components/Pages/Setting/SettingLocation";
import SettingProfil from "./components/Pages/Setting/SettingProfil";
import SettingPicture from "./components/Pages/Setting/SettingPicture";
import Notif from "./components/Pages/Notification/NotificationsPage";
import ProfileUser from "./components/Pages/Profile/ProfileOtherUser/ProfileUser";
import CompleteProfile from "./components/Pages/CompleteProfile/CompleteProfile";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import OAuthSuccess from "./context/OAuthSuccess";

const ProtectedRoute = ({ element: Component }) => {
    const { isLoggedIn, hasProfile, emailVerified } = useAuth();
    const location = useLocation();
    const currentPath = location.pathname;
  
    if (isLoggedIn === null) {
      return <div>Loading...</div>; // Montre un écran de chargement pendant la vérification
    }
    
    if (!isLoggedIn) {
      return <Navigate to="/login" state={{ from: location }} />;
    }
    
    // If profile is not complete and user is trying to access a page other than complete-profile
    if (hasProfile === false && emailVerified === true && currentPath !== "/complete-profile") {
      return <Navigate to="/complete-profile" />;
    }

    if (emailVerified === false && currentPath !== "/email-pending") {
      return <Navigate to="/email-pending" />;
    }
    
    return <Component />;
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
            <Route path="/email-confirm-link" element={<EmailConfirmLink />} />
            <Route path="/profile" element={<ProtectedRoute element={Profile} />} />
            <Route path="/chat" element={<ProtectedRoute element={Chat} />} />
            <Route path="/match" element={<ProtectedRoute element={Match} />} />
            <Route path="/notification" element={<ProtectedRoute element={Notif} />} />
            <Route path="/settings/location" element={<ProtectedRoute element={SettingLocation} />} />
            <Route path="/settings/profile" element={<ProtectedRoute element={SettingProfil} />} />
            <Route path="/settings/pictures" element={<ProtectedRoute element={SettingPicture} />} />
            <Route path="/profile/:username" element={<ProfileUser />} />
            <Route path="/complete-profile" element={<ProtectedRoute element={CompleteProfile} />} />
            <Route path="/email-pending" element={<ProtectedRoute element={EmailPendingPage} />} />
            {/* Ajoutez d'autres routes protégées ici */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;