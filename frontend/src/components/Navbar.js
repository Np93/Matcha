import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ isLoggedIn }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-black text-white fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 z-50">
      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-400">Match</h1>

      {/* User Menu */}
      <div className="relative">
        <button
          className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-md hover:bg-gray-800 focus:outline-none"
          onClick={toggleDropdown}
        >
          User
        </button>

        {isDropdownOpen && (
          <ul className="absolute right-0 mt-2 bg-black bg-opacity-80 rounded-md shadow-lg w-48 border border-gray-600">
            {!isLoggedIn ? (
              <>
                <li className="border-b border-gray-500 border-opacity-30">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Signup
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="border-b border-gray-500 border-opacity-30">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => alert("Logged out")}
                    className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;