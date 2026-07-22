import * as ImagePicker from "expo-image-picker";
import { ImageFile } from "@restaurant-app/shared";

export async function pickImage(): Promise<ImageFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const type = asset.mimeType ?? "image/jpeg";
  return { uri: asset.uri, name, type };
}
