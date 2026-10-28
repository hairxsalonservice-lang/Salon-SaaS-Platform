import { Alert, Share } from "react-native";

/**
 * Shares the salon details using the platform share sheet.
 *
 * The web build has no native share module, so this file sticks to React
 * Native's Share API and copies the message when the browser can't share.
 */
export async function shareSalon({ title, message }) {
  try {
    await Share.share({ title, message });
  } catch (shareError) {
    // Closing the share sheet isn't a failure; don't overwrite the clipboard.
    if (shareError?.name === "AbortError") return;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        Alert.alert("Salon link copied", "Paste it into a message to share this salon.");
        return;
      } catch (clipboardError) {
        console.log(clipboardError.message);
      }
    }
    console.log(shareError.message);
  }
}
