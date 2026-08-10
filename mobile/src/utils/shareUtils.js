import { Linking, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

// Share file (PDF/Image) using native mobile share sheet
export const shareFileNative = async (fileUri, dialogTitle = "Share Document") => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Sharing Unavailable", "Native sharing is not supported on this device.");
      return false;
    }
    await Sharing.shareAsync(fileUri, {
      dialogTitle,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
    return true;
  } catch (error) {
    console.error("Error sharing file native:", error);
    return false;
  }
};

// Share WhatsApp message or file
export const shareToWhatsApp = async (mobileNo, message = "", fileUri = null) => {
  try {
    if (fileUri) {
      // First try native sharing sheet which presents WhatsApp as a option
      const shared = await shareFileNative(fileUri, "Share LR PDF via WhatsApp");
      if (shared) return true;
    }

    // Fallback: Direct WhatsApp URL scheme
    let cleanMobile = String(mobileNo || "").replace(/[^0-9]/g, "");
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    }

    const encodedText = encodeURIComponent(message);
    const url = cleanMobile
      ? `whatsapp://send?phone=${cleanMobile}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert("WhatsApp Not Installed", "WhatsApp application is not installed on this mobile device.");
      return false;
    }
  } catch (err) {
    console.error("WhatsApp share error:", err);
    Alert.alert("Error", "Could not open WhatsApp.");
    return false;
  }
};
