import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MaterialList.css";

function EditMaterial() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { transaction, checkpoints } = state || {};
  const [editedData, setEditedData] = useState({});
  const [files, setFiles] = useState({}); // Store file objects separately
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!transaction) {
      navigate("/material-supplied");
      return;
    }

    const initialData = {};
    transaction.Details.forEach(detail => {
      initialData[detail.ChkId] = detail.Value;
    });
    setEditedData(initialData);
  }, [transaction, navigate]);

  const getCheckpointDescription = (checkpointId) => {
    const checkpoint = checkpoints.find(cp => 
      cp.CheckpointId.toString() === checkpointId.toString()
    );
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  const handleInputChange = (checkpointId, value) => {
    setEditedData(prev => ({
      ...prev,
      [checkpointId]: value
    }));
  };

  const handleFileChange = (checkpointId, file) => {
    if (file) {
      setFiles(prev => ({
        ...prev,
        [checkpointId]: file
      }));
      // Update the displayed value to show the file name
      setEditedData(prev => ({
        ...prev,
        [checkpointId]: file.name
      }));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      // First, update text data
      const textResponse = await axios.post(
        "https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php",
        {
          ActivityId: transaction.ActivityId,
          data: editedData,
          LatLong: null
        }
      );

      if (!textResponse.data.success) {
        throw new Error(textResponse.data.message || "Failed to save text data");
      }

      // Then handle file uploads if there are any
      const fileEntries = Object.entries(files);
      if (fileEntries.length > 0) {
        const imageData = {};
        
        // Convert files to base64
        for (const [checkpointId, file] of fileEntries) {
          const base64 = await convertToBase64(file);
          imageData[checkpointId] = base64;
        }

        // Upload images
        const imageResponse = await axios.post(
          "https://namami-infotech.com/SANCHAR/src/menu/add_image.php",
          {
            menuId: 8, // menuId is 8 for Material Supplied
            ActivityId: transaction.ActivityId,
            LatLong: null,
            data: imageData
          }
        );

        if (!imageResponse.data.success) {
          throw new Error(imageResponse.data.message || "Failed to upload images");
        }
      }

      setSuccess("Changes saved successfully!");
      setTimeout(() => navigate("/material-supplied"), 1500);
    } catch (err) {
      setError(err.message || "An error occurred while saving");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isDocumentField = (checkpointId) => {
    return ["580"].includes(checkpointId.toString());
  };

  if (!transaction) {
    return <div>Loading...</div>;
  }

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">Edit Material Supplied</h2>
        <div className="action-buttons">
          <button
            className="action-button back-button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="action-button save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="table-container">
        <table className="material-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(editedData).map(checkpointId => (
              <tr key={checkpointId}>
                <td>{getCheckpointDescription(checkpointId)}</td>
                <td>
                  {isDocumentField(checkpointId) ? (
                    <div className="document-field">
                      <input
                        type="file"
                        id={`file-upload-${checkpointId}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(checkpointId, e.target.files[0])}
                        accept="image/*,application/pdf"
                      />
                      <label htmlFor={`file-upload-${checkpointId}`} className="file-upload-label">
                        Choose File
                      </label>
                      <span className="file-name">
                        {files[checkpointId] ? files[checkpointId].name : 
                         editedData[checkpointId] ? editedData[checkpointId] : "No file selected"}
                      </span>
                      {editedData[checkpointId] && !files[checkpointId] && (
                        <button
                          className="view-button"
                          onClick={() => window.open(editedData[checkpointId], "_blank")}
                        >
                          👁️ View
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editedData[checkpointId] || ""}
                      onChange={(e) => handleInputChange(checkpointId, e.target.value)}
                      className="edit-input"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EditMaterial;