import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import AdminPage from "./components/AdminPage";
import Auth1Page from "./components/Auth1Page";
import Auth2Page from "./components/Auth2Page";
 
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogin = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  return (
    <Router>
        

          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  username === "admin" ? (
                    <Navigate to="/admin" />
                  ) : username === "auth1" ? (
                    <Navigate to="/auth1" />
                  ) : (
                    <Navigate to="/auth2" />
                  )
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />

            <Route path="/admin" element={<ProtectedRoute username={username} expected="admin" Component={AdminPage} />} />
            <Route path="/auth1" element={<ProtectedRoute username={username} expected="auth1" Component={Auth1Page} />} />
            <Route path="/auth2" element={<ProtectedRoute username={username} expected="auth2" Component={Auth2Page} />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
       
    </Router>
  );
}

function ProtectedRoute({ username, expected, Component }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
    window.location.reload(); // Force refresh to clear state
  };

  return username === expected ? <Component username={username} onLogout={handleLogout} /> : <Navigate to="/" />;
}

export default App;
