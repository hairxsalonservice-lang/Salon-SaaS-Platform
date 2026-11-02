import { Share, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const isExpoGo =
  Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient ||
  Constants?.appOwnership === "expo";

let RNShare = null;
if (!isExpoGo) {
  try {
    RNShare = require("react-native-share").default || require("react-native-share");
  } catch (e) {
    RNShare = null;
  }
}

const MIME_BY_EXTENSION = {
  gif: "image/gif",
  heic: "image/heic",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function getImageFormat(url) {
  const path = String(url || "").split("?")[0].split("#")[0];
  const extension = path.split(".").pop()?.toLowerCase();

  if (extension && MIME_BY_EXTENSION[extension]) {
    return { extension, mimeType: MIME_BY_EXTENSION[extension] };
  }

  return { extension: "jpg", mimeType: "image/jpeg" };
}

async function downloadImage(imageUrl) {
  const { extension, mimeType } = getImageFormat(imageUrl);
  const fileUri = `${FileSystem.cacheDirectory}salon-share-cover.${extension}`;
  const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
  return { uri, mimeType };
}

export async function shareSalon({ title, message, imageUrl }) {
  // Try RNShare (image + text together)
  if (imageUrl && RNShare) {
    try {
      const { uri, mimeType } = await downloadImage(imageUrl);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await RNShare.open({
        title,
        message,
        url: `data:${mimeType};base64,${base64}`,
        type: mimeType,
        failOnCancel: false,
      });
      return;
    } catch (error) {
      if (error?.message === "User did not share") return;
      console.log("RNShare failed:", error?.message);
    }
  }

  // Fallback: expo-sharing (image only, no text)
  if (imageUrl) {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        const { uri, mimeType } = await downloadImage(imageUrl);
        await Sharing.shareAsync(uri, {
          dialogTitle: title,
          mimeType,
        });
        return;
      }
    } catch (error) {
      console.log("expo-sharing failed:", error?.message);
    }
  }

  // Final fallback: text only
  try {
    await Share.share({ title, message });
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.log("Could not share salon:", error?.message);
    }
  }
}
