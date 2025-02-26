<<<<<<< HEAD
// src/components/Dashboard/NewJobDialog.tsx
=======
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { db, auth } from "../../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

interface NewJobDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NewJobDialog: React.FC<NewJobDialogProps> = ({
  open,
  onClose,
}) => {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!jobTitle.trim()) {
      alert("Job title is required!");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to create a job.");
        return;
      }

<<<<<<< HEAD
      // Create a new document with a custom ID (optional)
=======
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9
      const docRef = await addDoc(collection(db, "jobs"), {
        title: jobTitle,
        description: jobDescription || "",
        ownerUid: user.uid,
        createdAt: Timestamp.now(),
      });

<<<<<<< HEAD
      // Sanity check the document ID
=======
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9
      if (docRef.id.includes("/")) {
        throw new Error("Invalid document ID generated");
      }

      const link = `${window.location.origin}/apply/${docRef.id}`;
      setGeneratedLink(link);
    } catch (error) {
      console.error("Error creating job:", error);
      alert(`Failed to publish job: ${(error as Error).message}`);
    }
  };

  const handleCloseDialog = () => {
<<<<<<< HEAD
    setGeneratedLink(null); // reset link
=======
    setGeneratedLink(null);
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9
    setJobTitle("");
    setJobDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="sm">
      <DialogTitle>Create a New Job</DialogTitle>

      <DialogContent>
        {/* If we haven't published yet, show the form. Otherwise, show the link */}
        {generatedLink ? (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Job Created! Share this link with applicants:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, wordBreak: "break-all" }}>
              {generatedLink}
            </Typography>
            <Button variant="contained" onClick={handleCloseDialog}>
              Done
            </Button>
          </>
        ) : (
          <>
            <TextField
              fullWidth
              label="Job Title"
              variant="outlined"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Job Description"
              variant="outlined"
              multiline
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
          </>
        )}
      </DialogContent>

      {/* Only show actions if we haven't published yet */}
      {!generatedLink && (
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handlePublish}>
            Publish
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
