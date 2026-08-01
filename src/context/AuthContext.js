import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Clear legacy persistent localStorage entry
    localStorage.removeItem("wolego_user");

    const saved = sessionStorage.getItem("wolego_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem("wolego_user", JSON.stringify(userData));
    localStorage.removeItem("wolego_user");
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("wolego_user");
    localStorage.removeItem("wolego_user");
  };

  const isOwner = user?.role === "OWNER";
  const isParty = user?.role === "PARTY";

  return (
    <AuthContext.Provider value={{ user, login, logout, isOwner, isParty }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
