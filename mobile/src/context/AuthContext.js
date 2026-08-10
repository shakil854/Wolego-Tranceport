import React, { createContext, useContext, useState, useEffect } from "react";
import { loginApi } from "../api/endpoints";
import { saveUserSession, getUserSession, removeUserSession } from "../utils/storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await getUserSession();
        if (saved) {
          setUser(saved);
        }
      } catch (e) {
        console.error("Session load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (username, password) => {
    const res = await loginApi(username, password);
    if (res && res.success && res.user) {
      setUser(res.user);
      await saveUserSession(res.user);
      return res.user;
    }
    throw new Error(res?.error || "Login failed");
  };

  const logout = async () => {
    setUser(null);
    await removeUserSession();
  };

  const isOwner = user?.role === "OWNER";
  const isParty = user?.role === "PARTY";
  const isTruck = user?.role === "TRUCK";

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        logout,
        isOwner,
        isParty,
        isTruck,
      }}
    >
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
