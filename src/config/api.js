// Centralized API Configuration for Development and Production (Hostinger VPS)

export const API_URL =
  process.env.REACT_APP_API_URL !== undefined
    ? process.env.REACT_APP_API_URL
    : process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:8002";

export const API_BASE_URL = `${API_URL}/api`;
