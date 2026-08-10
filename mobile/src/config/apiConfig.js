import AsyncStorage from '@react-native-async-storage/async-storage';

// Default Production & Development Backend URLs
const DEFAULT_PROD_URL = "https://wolegotransport.com/api";
const DEFAULT_LOCAL_URL = "http://192.168.1.100:8002/api"; // Default local server fallback IP

let customBaseUrl = null;

export const getApiBaseUrl = async () => {
  if (customBaseUrl) return customBaseUrl;
  try {
    const saved = await AsyncStorage.getItem("wolego_custom_api_url");
    if (saved && saved.trim() !== "") {
      customBaseUrl = saved.trim().replace(/\/+$/, "");
      return customBaseUrl;
    }
  } catch (e) {
    console.error("Error reading saved API URL:", e);
  }
  return DEFAULT_PROD_URL;
};

export const setCustomApiUrl = async (url) => {
  try {
    if (!url || url.trim() === "") {
      await AsyncStorage.removeItem("wolego_custom_api_url");
      customBaseUrl = DEFAULT_PROD_URL;
    } else {
      const clean = url.trim().replace(/\/+$/, "");
      await AsyncStorage.setItem("wolego_custom_api_url", clean);
      customBaseUrl = clean;
    }
  } catch (e) {
    console.error("Error saving custom API URL:", e);
  }
};

export { DEFAULT_PROD_URL, DEFAULT_LOCAL_URL };
