import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "20%" }}>
      <h1>Welcome to Matcha</h1>
      <p>Find your perfect match, connect, and grow together.</p>
      <Link to="/signup">
        <button style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}>
          Signup
        </button>
      </Link>
    </div>
  );
};

export default Home;