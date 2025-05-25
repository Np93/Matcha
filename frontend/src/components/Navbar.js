import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { secureApiCall } from "../utils/api";
import {
  BellIcon,
  UserCircleIcon,
  HeartIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid"; 

const Navbar = () => {
  const { isLoggedIn, userId, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const socket = useRef(null);
  const connectedUserId = useRef(null);
  const navigate = useNavigate();

  //  Connexion WebSocket pour écouter les nouvelles notifications
  useEffect(() => {
    if (!isLoggedIn || !userId) return;
  
    const isSocketOpen = socket.current && socket.current.readyState === WebSocket.OPEN;
  
    // Si la socket est déjà connectée pour ce user et toujours ouverte, on ne fait rien
    if (isSocketOpen && connectedUserId.current === userId) {
      console.log("⚠️ WebSocket déjà connectée pour cet utilisateur");
      return;
    }
  
    console.log("🧠 Ouverture d'une nouvelle WebSocket pour user:", userId);
  
    // Si une ancienne socket existe, on la ferme proprement
    if (socket.current) {
      console.log("🔌 Fermeture de l'ancienne socket...");
      socket.current.close();
      socket.current = null;
      connectedUserId.current = null;
    }
  
    // Création d'une nouvelle socket
    const newSocket = new WebSocket(`ws://localhost:8000/notifications/ws/notifications`);
    socket.current = newSocket;
    connectedUserId.current = userId;
  
    newSocket.onopen = () => {
      console.log("✅ WebSocket connectée !");
    };
  
    newSocket.onmessage = (event) => {
      console.log("📩 Notification reçue :", event.data);
      setUnreadCount((prev) => prev + 1);
    };
  
    newSocket.onerror = (error) => {
      console.log("❌ Erreur WebSocket :", error);
    };
  
    newSocket.onclose = (event) => {
      console.warn("⚠️ WebSocket fermée :", event.reason);
      if (socket.current === newSocket) {
        connectedUserId.current = null;
        socket.current = null;
      }
    };
  
    return () => {
      console.log("🧹 Cleanup socket...");
      if (socket.current === newSocket) {
        newSocket.close();
        socket.current = null;
        connectedUserId.current = null;
      }
    };
  }, [isLoggedIn, userId]);

  //  Récupération des notifications non lues lors du chargement
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await secureApiCall("/notifications/notifications");
        setUnreadCount(response.filter((n) => !n.is_read).length);
      } catch (error) {
        console.log("Erreur lors de la récupération des notifications :", error);
      }
    };
    fetchUnreadCount();
  }, [isLoggedIn]);

  //  Fonction pour marquer les notifications comme lues lors du clic sur la cloche
  const handleBellClick = () => {
    navigate("/notification");
    setUnreadCount(0); // Remet à zéro après la consultation
  };

  //  Déconnexion
  const handleLogout = async () => {
    try {
      console.log("User ID during logout:", userId);
      await secureApiCall("/log/logout", "POST", null, userId);
      logout();
      navigate("/");
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSettingsDropdown = () => {
    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-black text-white fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 z-50">
      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-400">Match</h1>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button 
          onClick={toggleMobileMenu} 
          className="text-white focus:outline-none"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-4">
        {!isLoggedIn ? (
          <>
            {/* Dropdown for logged out state */}
            <div className="relative">
              <button
                className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-md hover:bg-gray-800 focus:outline-none"
                onClick={toggleDropdown}
              >
                User
              </button>
              {isDropdownOpen && (
                <ul className="absolute right-0 mt-2 bg-black bg-opacity-80 rounded-md shadow-lg w-48 border border-gray-600">
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                    >
                      Login
                    </Link>
                  </li>
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link
                      to="/signup"
                      className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                    >
                      Signup
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                    >
                      Home
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Buttons for logged in state */}
            <button onClick={handleBellClick} className="relative p-2">
              <BellIcon className="w-6 h-6 text-white hover:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-white hover:text-gray-400"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              to="/match"
              className="flex items-center space-x-2 text-white hover:text-gray-400"
            >
              <HeartIcon className="w-5 h-5" />
              <span>Match</span>
            </Link>
            <Link
              to="/chat"
              className="flex items-center space-x-2 text-white hover:text-gray-400"
            >
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
              <span>Chat</span>
            </Link>
            {/* ⚙️ Dropdown Settings */}
            <div className="relative">
              <button onClick={toggleSettingsDropdown} className="flex items-center space-x-2 text-white hover:text-gray-400">
                <Cog6ToothIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
              {isSettingsDropdownOpen && (
                <ul className="absolute right-0 mt-2 bg-black bg-opacity-80 rounded-md shadow-lg w-56 border border-gray-600">
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link to="/settings/profile" className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white">
                      Profile Settings
                    </Link>
                  </li>
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link to="/settings/pictures" className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white">
                      Profile Pictures
                    </Link>
                  </li>
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link to="/settings/location" className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white">
                      Location Settings
                    </Link>
                  </li>
                  <li className="border-b border-gray-500 border-opacity-30">
                    <Link to="/settings/account" className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white">
                      Account Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-red-400 hover:bg-gray-800 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Standalone Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-md hover:bg-gray-800 hover:text-red-400 focus:outline-none"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-black bg-opacity-95 z-40">
          <div className="flex flex-col p-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="block py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  Signup
                </Link>
                <Link
                  to="/"
                  className="block py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  Home
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-800 py-3">
                  <Link
                    to="/notification"
                    className="text-white flex items-center space-x-2"
                    onClick={() => {
                      handleBellClick();
                      toggleMobileMenu();
                    }}
                  >
                    <BellIcon className="w-5 h-5" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/match"
                  className="flex items-center space-x-2 py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  <HeartIcon className="w-5 h-5" />
                  <span>Match</span>
                </Link>
                <Link
                  to="/chat"
                  className="flex items-center space-x-2 py-3 text-white border-b border-gray-800"
                  onClick={toggleMobileMenu}
                >
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                  <span>Chat</span>
                </Link>
                <div className="py-3 border-b border-gray-800">
                  <div
                    className="flex items-center space-x-2 text-white"
                    onClick={() => {
                      setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                    }}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span>Settings</span>
                  </div>
                  {isSettingsDropdownOpen && (
                    <ul className="ml-6 mt-2">
                      <li className="py-2">
                        <Link
                          to="/settings/profile"
                          className="text-gray-300 hover:text-white"
                          onClick={toggleMobileMenu}
                        >
                          Profile Settings
                        </Link>
                      </li>
                      <li className="py-2">
                        <Link
                          to="/settings/pictures"
                          className="text-gray-300 hover:text-white"
                          onClick={toggleMobileMenu}
                        >
                          Profile Pictures
                        </Link>
                      </li>
                      <li className="py-2">
                        <Link
                          to="/settings/location"
                          className="text-gray-300 hover:text-white"
                          onClick={toggleMobileMenu}
                        >
                          Location Settings
                        </Link>
                      </li>
                      <li className="py-2">
                        <Link
                          to="/settings/account"
                          className="text-gray-300 hover:text-white"
                          onClick={toggleMobileMenu}
                        >
                          Account Settings
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
                <div className="py-4">
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="w-full py-3 border-2 border-red-500 text-red-500 rounded-md text-center hover:bg-gray-800 hover:text-red-400"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;