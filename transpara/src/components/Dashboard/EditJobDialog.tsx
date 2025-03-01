import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { EditorState, convertToRaw, ContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { Editor } from "react-draft-wysiwyg";
import htmlToDraft from "html-to-draftjs";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  category: string;
  description: string;
  ownerUid: string;
}

interface EditJobDialogProps {
  open: boolean;
  onClose: () => void;
  job: Job;
}

export const EditJobDialog: React.FC<EditJobDialogProps> = ({
  open,
  onClose,
  job,
}) => {
  const [jobTitle, setJobTitle] = useState(job.title);
  const [jobLocation, setJobLocation] = useState(job.location);
  const [jobType, setJobType] = useState(job.type);
  const [jobCategory, setJobCategory] = useState(job.category);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    const blocksFromHtml = htmlToDraft(job.description || "");
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(
      contentBlocks,
      entityMap
    );
    setEditorState(EditorState.createWithContent(contentState));
  }, [job.description]);

  const handleSave = async () => {
    const rawContentState = convertToRaw(editorState.getCurrentContent());
    const descriptionHTML = draftToHtml(rawContentState);

    try {
      const jobRef = doc(db, "jobs", job.id);
      await updateDoc(jobRef, {
        title: jobTitle,
        location: jobLocation,
        type: jobType,
        category: jobCategory,
        description: descriptionHTML,
      });
      onClose();
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Failed to update job.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Job Posting</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1, mb: 2 }}>
          <TextField
            label="Job Title"
            fullWidth
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Location"
            fullWidth
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Job Type"
            fullWidth
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Job Category"
            fullWidth
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
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
              }}
              editorStyle={{
                border: "1px solid #e0e0e0",
                minHeight: "200px",
                padding: "10px",
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditJobDialog;
