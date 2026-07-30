// Centralized API Configuration for Development and Production

const getRawUrl = () => {
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== "") {
    return process.env.REACT_APP_API_URL.trim();
  }
  return process.env.NODE_ENV === "production" ? "" : "http://localhost:8002";
};

const cleanUrl = getRawUrl().replace(/\/+$/, "");

export const API_URL = cleanUrl;
export const API_BASE_URL = cleanUrl ? `${cleanUrl}/api` : "/api";
