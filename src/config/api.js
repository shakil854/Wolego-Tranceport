// Centralized API Configuration for Development and Production

const getRawUrl = () => {
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== "") {
    return process.env.REACT_APP_API_URL.trim();
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    // If accessed via localhost or local LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.match(/^192\.168\./) || hostname.match(/^10\./) || hostname.match(/^172\./)) {
      const port = process.env.REACT_APP_BACKEND_PORT || "8002";
      return `http://${hostname}:${port}/api`;
    }
  }
  return "https://wolegotransport.com/api";
};

const raw = getRawUrl().replace(/\/+$/, "");

// Smart parsing: handles if input is "https://domain.com/api" OR "https://domain.com"
let parsedApiBaseUrl = "";
let parsedApiUrl = "";

if (!raw) {
  parsedApiBaseUrl = "/api";
  parsedApiUrl = "";
} else if (raw.toLowerCase().endsWith("/api")) {
  parsedApiBaseUrl = raw;
  parsedApiUrl = raw.slice(0, -4);
} else {
  parsedApiBaseUrl = `${raw}/api`;
  parsedApiUrl = raw;
}

export const API_URL = parsedApiUrl;
export const API_BASE_URL = parsedApiBaseUrl;
