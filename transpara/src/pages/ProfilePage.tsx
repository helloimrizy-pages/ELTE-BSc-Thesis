import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
} from "@mui/material";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { TransparaAppBar } from "../components/AppBar/TransparaAppBar";
import Sidebar from "../components/AppBar/Sidebar";

const ProfilePage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [company, setCompany] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const docRef = doc(db, "users", uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || auth.currentUser.email || "");
        setUsername(data.username || "");
        setCompany(data.company || "");
        setPhotoURL(auth.currentUser.photoURL);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      firstName,
      lastName,
    });
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !auth.currentUser) return;
    const file = e.target.files[0];
    const storageRef = ref(
      storage,
      `profilePhotos/${auth.currentUser.uid}/${file.name}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {},
      console.error,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await updateProfile(auth.currentUser!, { photoURL: url });
        setPhotoURL(url);
      }
    );
  };

  return (
    <Box>
      <TransparaAppBar
        onLogout={async () => auth.signOut()}
        onSearch={() => {}}
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Sidebar />
          </Grid>

          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Profile Settings
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar
                  src={photoURL || undefined}
                  sx={{ width: 72, height: 72, mr: 2 }}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Profile Picture
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  hidden
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" value={email} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company"
                    value={company}
                    disabled
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ backgroundColor: "black" }}
                >
                  Save Changes
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;
