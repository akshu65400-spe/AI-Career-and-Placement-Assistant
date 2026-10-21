import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logo-icon">AI</div>

        <div>
          <h2>CareerAI</h2>
          <span>Placement Assistant</span>
        </div>
      </div>

      <nav>

        <NavLink to="/dashboard">
          <span>📊</span>
          Dashboard
        </NavLink>

        <NavLink to="/profile">
          <span>👤</span>
          My Profile
        </NavLink>

        <NavLink to="/resume">
          <span>📄</span>
          Resume AI
        </NavLink>

        <NavLink to="/jobs">
          <span>💼</span>
          Jobs
        </NavLink>

        <NavLink to="/applications">
          <span>📋</span>
          Applications
        </NavLink>

        <NavLink to="/interview">
          <span>🤖</span>
          AI Interview
        </NavLink>

      </nav>

      <div className="sidebar-bottom">

        <button
          className="logout-btn"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;