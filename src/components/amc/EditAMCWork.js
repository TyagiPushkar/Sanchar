import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AMCWorkList.css";

function EditAMCWork() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { transaction, checkpoints } = state || {};
  const [editedData, setEditedData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!transaction) {
      navigate("/amc-work-list");
      return;
    }

    const initialData = {};
    transaction.Details.forEach(detail => {
      initialData[detail.ChkId] = detail.Value;
    });
    setEditedData(initialData);
  }, [transaction, navigate]);

  const getCheckpointDescription = (checkpointId) => {
    // Convert both to strings for consistent comparison
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

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post(
        "https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php",
        {
          ActivityId: transaction.ActivityId,
          data: editedData,
          LatLong: null
        }
      );

      if (response.data.success) {
        setSuccess("Changes saved successfully!");
        setTimeout(() => navigate("/amc-work"), 1500);
      } else {
        throw new Error(response.data.message || "Failed to save changes");
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isDocumentField = (checkpointId) => {
    return ["599", "603", "609", "613", "619", "623", "629", "633"].includes(checkpointId);
  };

  if (!transaction) {
    return <div>Loading...</div>;
  }

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">Edit AMC Work</h2>
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
                        type="text"
                        value={editedData[checkpointId] || ""}
                        onChange={(e) => handleInputChange(checkpointId, e.target.value)}
                        className="edit-input"
                        placeholder="Document URL"
                      />
                      {editedData[checkpointId] && (
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

export default EditAMCWork;