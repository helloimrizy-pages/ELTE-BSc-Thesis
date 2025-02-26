import React, { useRef, ChangeEvent } from "react";
import { Menu, MenuItem } from "@mui/material";
import { auth } from "../../firebase";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { updateProfile } from "firebase/auth";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle the file selection
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    try {
      // 1) Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `profilePhotos/${auth.currentUser?.uid}/${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        () => {},
        (error) => {
          console.error("Upload error:", error);
        },
        async () => {
          // 2) Get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 3) Update the user’s photoURL in Firebase Auth
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              photoURL: downloadURL,
            });
          }
          onClose();
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Trigger the hidden file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        id="primary-search-account-menu"
        keepMounted
        open={isOpen}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={onClose}>Profile</MenuItem>
        <MenuItem onClick={onClose}>My account</MenuItem>

        {/* New Upload Photo item */}
        <MenuItem onClick={handleUploadClick}>Upload Photo</MenuItem>

        <MenuItem onClick={onLogout}>Logout</MenuItem>
      </Menu>

      {/* Hidden file input to pick a photo */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />
    </>
  );
};
