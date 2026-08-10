import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SESSION_KEY = 'wolego_mobile_user';
const DIGITAL_SIGNATURE_KEY = 'wolego_digital_signature';

export const saveUserSession = async (user) => {
  try {
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Error saving user session:", e);
  }
};

export const getUserSession = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error reading user session:", e);
    return null;
  }
};

export const removeUserSession = async () => {
  try {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
  } catch (e) {
    console.error("Error clearing user session:", e);
  }
};

export const saveDigitalSignature = async (base64) => {
  try {
    await AsyncStorage.setItem(DIGITAL_SIGNATURE_KEY, base64);
  } catch (e) {
    console.error("Error saving signature:", e);
  }
};

export const getDigitalSignature = async () => {
  try {
    return await AsyncStorage.getItem(DIGITAL_SIGNATURE_KEY);
  } catch (e) {
    console.error("Error reading signature:", e);
    return null;
  }
};

export const removeDigitalSignature = async () => {
  try {
    await AsyncStorage.removeItem(DIGITAL_SIGNATURE_KEY);
  } catch (e) {
    console.error("Error removing signature:", e);
  }
};
