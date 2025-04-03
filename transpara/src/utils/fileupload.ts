import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);

    const uploadTask = await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(uploadTask.ref);

    return downloadURL;
  } catch (error: unknown) {
    console.error("Error uploading file:", error);

    // Handle the error appropriately based on its type
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to upload file: ${errorMessage}`);
  }
}

export async function uploadCV(
  file: File,
  jobId: string,
  applicantId: string
): Promise<string> {
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

  const path = `applications/${jobId}/${applicantId}_${safeFilename}`;

  return uploadFile(file, path);
}

export function validateFile(
  file: File,
  allowedTypes: string[] = ["application/pdf"],
  maxSizeMB: number = 10
): { valid: boolean; message?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `File is too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
