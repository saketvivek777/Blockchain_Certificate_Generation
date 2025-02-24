import React, { useState } from "react";

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate user authentication.
    if (username === "admin" && password === "admin123") {
      onLogin(username);
    } else if (username === "auth1" && password === "auth123") {
      onLogin(username);
    } else if (username === "auth2" && password === "auth123") {
      onLogin(username);
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-500 to-indigo-400 pt-16 pb-6">
      {/* Header with two images at top-left and top-right */}
      <header className="relative w-full flex flex-col items-center px-4 sm:px-8 md:px-16 mb-8">
        <img
          src="src/assets/logo5.png"
          alt="Left Icon"
          className="absolute top-0 left-4 h-24 px-2 py-2"
        />
        <img
          src="src/assets/logo6.png"
          alt="Right Icon"
          className="absolute top-0 right-4 h-24 py-2"
        />
        <h1 className="text-4xl font-bold text-white">Centre for Development of Advanced Computing</h1>
        <h1 className="text-4xl font-bold text-white mt-8">Login</h1>
      </header>

      {/* Login Form */}
      <div className="flex justify-center  bg-sky-500/50 items-center flex-grow">
        <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-gray-700 font-semibold mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 font-semibold mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
