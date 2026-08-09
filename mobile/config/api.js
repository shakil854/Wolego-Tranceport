import AsyncStorage from "@react-native-async-storage/async-storage";

// Default API Base URL (Live Production Server)
export const DEFAULT_API_URL = "https://wolegotransport.com/api";

let currentApiUrl = DEFAULT_API_URL;

export const getApiBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem("wolego_custom_api_url");
    if (saved && saved.trim()) {
      currentApiUrl = saved.trim().replace(/\/+$/, "");
    }
  } catch (e) {
    console.error("Error reading saved API URL:", e);
  }
  return currentApiUrl;
};

export const setApiBaseUrl = async (newUrl) => {
  if (!newUrl || !newUrl.trim()) return;
  const clean = newUrl.trim().replace(/\/+$/, "");
  currentApiUrl = clean;
  await AsyncStorage.setItem("wolego_custom_api_url", clean);
};

export const resetApiBaseUrl = async () => {
  currentApiUrl = DEFAULT_API_URL;
  await AsyncStorage.removeItem("wolego_custom_api_url");
};
