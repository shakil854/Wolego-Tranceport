// Centralized API Configuration for Development and Production

const getRawUrl = () => {
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== "") {
    return process.env.REACT_APP_API_URL.trim();
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
