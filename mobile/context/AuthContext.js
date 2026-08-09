import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app launch
    const loadStoredUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("wolego_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to restore user session:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem("wolego_user", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save user session:", e);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem("wolego_user");
      await AsyncStorage.removeItem("wolego_token");
    } catch (e) {
      console.error("Failed to clear session:", e);
    }
  };

  const isOwner = user?.role === "OWNER";
  const isParty = user?.role === "PARTY";
  const isTruck = user?.role === "TRUCK";

  return (
    <AuthContext.Provider value={{ user, login, logout, isOwner, isParty, isTruck, loading }}>
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
