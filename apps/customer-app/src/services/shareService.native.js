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
  const cleanUrl = String(url || "").split("#")[0];
  const [pathname, queryString] = cleanUrl.split("?");

  // 1. Try extension from path
  const extension = pathname.split(".").pop()?.toLowerCase();
  if (extension && MIME_BY_EXTENSION[extension]) {
    return { extension, mimeType: MIME_BY_EXTENSION[extension] };
  }

  // 2. Try query parameter (e.g. format=webp, fm=jpg)
  const formatMatch = queryString?.match(/(?:format|fm)=([a-z0-9]+)/i);
  if (formatMatch && MIME_BY_EXTENSION[formatMatch[1].toLowerCase()]) {
    const ext = formatMatch[1].toLowerCase();
    return { extension: ext, mimeType: MIME_BY_EXTENSION[ext] };
  }

  return { extension: "jpg", mimeType: "image/jpeg" };
}

async function resolveImageFile(imageUrl) {
  if (!imageUrl) return null;

  // Already a local file
  if (imageUrl.startsWith("file://")) {
    const { mimeType } = getImageFormat(imageUrl);
    return { uri: imageUrl, mimeType };
  }

  // Remote URL: download to temporary cache
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const { extension, mimeType } = getImageFormat(imageUrl);
    const fileUri = `${FileSystem.cacheDirectory}salon-share-${Date.now()}.${extension}`;
    const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
    return { uri, mimeType };
  }

  return null;
}

export async function shareSalon({ title, message, imageUrl }) {
  let downloadedImage = null;

  // 1. Full rich share via RNShare (Image + Text together) in custom builds
  if (imageUrl && RNShare) {
    try {
      downloadedImage = await resolveImageFile(imageUrl);
      if (downloadedImage) {
        const base64 = await FileSystem.readAsStringAsync(downloadedImage.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await RNShare.open({
          title,
          message,
          url: `data:${downloadedImage.mimeType};base64,${base64}`,
          type: downloadedImage.mimeType,
          failOnCancel: false,
        });
        return;
      }
    } catch (error) {
      if (error?.message === "User did not share") return;
      console.log("RNShare failed, proceeding to fallback:", error?.message);
    }
  }

  // 2. Fallback: If we have a rich message with booking link, prioritize sharing text & link
  // so the recipient actually receives the salon details and booking link
  if (message) {
    try {
      await Share.share({ title, message });
      return;
    } catch (error) {
      if (error?.name === "AbortError" || error?.message === "User did not share") return;
      console.log("Text share failed:", error?.message);
    }
  }

  // 3. Fallback: If no message was provided or text share failed, share the image via expo-sharing
  if (imageUrl) {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        if (!downloadedImage) {
          downloadedImage = await resolveImageFile(imageUrl);
        }
        if (downloadedImage) {
          await Sharing.shareAsync(downloadedImage.uri, {
            dialogTitle: title,
            mimeType: downloadedImage.mimeType,
          });
          return;
        }
      }
    } catch (error) {
      console.log("expo-sharing failed:", error?.message);
    }
  }
}
