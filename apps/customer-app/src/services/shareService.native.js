import { Share } from "react-native";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

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

async function downloadCoverImage(imageUrl) {
  const { extension, mimeType } = getImageFormat(imageUrl);
  const destination = new File(Paths.cache, `salon-share-cover.${extension}`);
  const file = await File.downloadFileAsync(imageUrl, destination, {
    idempotent: true,
  });

  return { uri: file.uri, mimeType };
}

/**
 * Shares the salon details using the platform share sheet.
 * Compatible with Expo Go, custom dev builds, and production binaries.
 */
export async function shareSalon({ title, message, imageUrl }) {
  if (imageUrl) {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        const cover = await downloadCoverImage(imageUrl);
        await Sharing.shareAsync(cover.uri, {
          dialogTitle: title,
          mimeType: cover.mimeType,
        });
        return;
      }
    } catch (error) {
      console.log("Could not share salon cover image:", error?.message);
    }
  }

  try {
    await Share.share({
      title,
      message,
    });
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.log("Could not share salon:", error?.message);
    }
  }
}
