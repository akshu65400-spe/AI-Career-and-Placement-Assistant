import React from "react";
function Navbar({ title }) {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (
    <header className="topbar">

      <div>
        <h1>{title}</h1>
        <p>Build your career with AI</p>
      </div>

      <div className="user-info">

        <div className="notification">
          🔔
        </div>

        <div className="avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div>
          <strong>{user?.name || "Student"}</strong>
          <small>Student</small>
        </div>

      </div>

    </header>
  );
}

export default Navbar;