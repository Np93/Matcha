import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { secureApiCall } from "../utils/api";
import {
  BellIcon,
  UserCircleIcon,
  HeartIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid"; 

const Navbar = () => {
  const { isLoggedIn, userId, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("User ID during logout:", userId);
      await secureApiCall("/log/logout", "POST", null, userId); // Déconnexion côté backend
      logout(); // Met à jour le contexte pour indiquer la déconnexion
      navigate("/"); // Redirige vers la page d'accueil
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-black text-white fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 z-50">
      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-400">Match</h1>

      {/* Boutons dynamiques */}
      <div className="flex items-center space-x-4">
        {!isLoggedIn ? (
          <>
            {/* Dropdown pour état déconnecté */}
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
            {/* Boutons pour état connecté */}
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-white hover:text-gray-400"
            >
              <BellIcon className="w-5 h-5" />
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
            <Link
              to="/settings"
              className="flex items-center space-x-2 text-white hover:text-gray-400"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Setting</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-md hover:bg-gray-800 focus:outline-none"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;