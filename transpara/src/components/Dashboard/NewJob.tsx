import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { db, auth } from "../../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

interface NewJobDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NewJobDialog: React.FC<NewJobDialogProps> = ({
  open,
  onClose,
}) => {
  const [jobTitle, setJobTitle] = useState("");
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobCategory, setJobCategory] = useState("");
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

      // Convert the editor's content to HTML.
      const rawContentState = convertToRaw(editorState.getCurrentContent());
      const descriptionHTML = draftToHtml(rawContentState);

      const docRef = await addDoc(collection(db, "jobs"), {
        title: jobTitle,
        description: descriptionHTML,
        location: jobLocation || "",
        type: jobType || "",
        category: jobCategory || "",
        ownerUid: user.uid,
        createdAt: Timestamp.now(),
      });

      if (docRef.id.includes("/")) {
        throw new Error("Invalid document ID generated");
      }

      const link = `${window.location.origin}/job/${docRef.id}`;

      setGeneratedLink(link);
    } catch (error) {
      console.error("Error creating job:", error);
      alert(`Failed to publish job: ${(error as Error).message}`);
    }
  };

  const handleCloseDialog = () => {
    setGeneratedLink(null);
    setJobTitle("");
    setEditorState(EditorState.createEmpty());
    setJobLocation("");
    setJobType("");
    setJobCategory("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      sx={{
        "& .MuiDialog-container": {
          "& .MuiPaper-root": {
            width: "95vw",
            height: "95vh",
            maxWidth: "none",
          },
        },
      }}
    >
      <DialogTitle>Create a New Job</DialogTitle>
      <DialogContent>
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
              label="Location(s)"
              variant="outlined"
              multiline
              rows={2}
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Job Type"
              variant="outlined"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Job Category"
              variant="outlined"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" sx={{ mb: 1 }}>
              Job Description
            </Typography>
            <Box
              sx={{
                resize: "both",
                overflow: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                minWidth: 300,
                minHeight: 150,
                p: 1,
                mb: 2,
              }}
            >
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                toolbar={{
                  options: [
                    "inline",
                    "blockType",
                    "fontSize",
                    "list",
                    "textAlign",
                    "colorPicker",
                    "link",
                    "emoji",
                    "embedded",
                    "remove",
                    "history",
                  ],
                  inline: {
                    inDropdown: false,
                    options: [
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "monospace",
                    ],
                  },
                  blockType: {
                    inDropdown: true,
                    options: ["Normal", "H1", "H2", "H3", "Blockquote", "Code"],
                  },
                  fontSize: {
                    options: [
                      8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96,
                    ],
                  },
                  textAlign: {
                    inDropdown: true,
                    options: ["left", "center", "right", "justify"],
                  },
                  colorPicker: {
                    colors: [
                      "rgb(97,189,109)",
                      "rgb(26,188,156)",
                      "rgb(84,172,210)",
                      "rgb(44,130,201)",
                      "rgb(147,101,184)",
                      "rgb(71,85,119)",
                      "rgb(204,204,204)",
                    ],
                  },
                  link: {
                    inDropdown: false,
                    showOpenOptionOnHover: true,
                    defaultTargetOption: "_self",
                  },
                  emoji: {
                    emojis: [
                      "😀",
                      "😁",
                      "😂",
                      "🤣",
                      "😃",
                      "😄",
                      "😅",
                      "😆",
                      "😉",
                      "😊",
                    ],
                  },
                }}
                editorStyle={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>
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
