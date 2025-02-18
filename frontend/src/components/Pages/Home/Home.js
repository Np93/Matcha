import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from "../../../assets/images/background.jpg";

const Home = () => {
    return (
      <div
        className="h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="bg-black bg-opacity-50 text-white p-8 rounded-lg max-w-md text-center mx-4 sm:mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Welcome to Matcha
          </h1>
          <p className="text-base sm:text-lg mb-6">
            Find your perfect match, connect, and grow together. Join us and start
            your journey now!
          </p>
          <Link
            to="/signup"
            className="text-yellow-400 font-bold text-lg hover:underline"
          >
            Signup here
          </Link>
        </div>
      </div>
    );
  };
  
  export default Home;