import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AMCWorkList.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function EditAMCWork() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { transaction, checkpoints } = state || {};
  const [editedData, setEditedData] = useState({});
  const [files, setFiles] = useState({});
  const [dateValues, setDateValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!transaction) {
      navigate("/amc-work-list");
      return;
    }

    const initialData = {};
    const initialDates = {};

    transaction.Details.forEach((detail) => {
      initialData[detail.ChkId] = detail.Value;

      // Check if this is a date field and parse it
      if (isDateField(detail.ChkId) && detail.Value) {
        const parsedDate = parseDateString(detail.Value);
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          initialDates[detail.ChkId] = parsedDate;
        }
      }
    });

    setEditedData(initialData);
    setDateValues(initialDates);
  }, [transaction, navigate]);

  // Parse date string in different formats
  const parseDateString = (dateString) => {
    if (!dateString || dateString.trim() === "") {
      return null;
    }

    // Clean the date string
    const cleanDateString = dateString.toString().trim();

    // Try parsing yyyy-mm-dd format first
    const yyyyMmDdMatch = cleanDateString.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );
    if (yyyyMmDdMatch) {
      const [_, year, month, day] = yyyyMmDdMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date;
    }

    // Try parsing dd/mm/yyyy format
    const ddMmYyyyMatch = cleanDateString.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );
    if (ddMmYyyyMatch) {
      const [_, day, month, year] = ddMmYyyyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date;
    }

    // Try parsing dd-mm-yyyy format
    const ddMmYyyyDashMatch = cleanDateString.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );
    if (ddMmYyyyDashMatch) {
      const [_, day, month, year] = ddMmYyyyDashMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date;
    }

    // Try parsing with Date constructor
    try {
      const date = new Date(cleanDateString);
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        // If date parses but year is weird (like 1900 for 2-digit years), try alternative parsing
        if (date.getFullYear() < 100) {
          // Try parsing as dd/mm/yy or similar
          const parts = cleanDateString.split(/[-\/]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);

            // Handle 2-digit years
            if (year < 100) {
              year = year + 2000; // Adjust for 2000s
            }

            const altDate = new Date(year, month, day);
            if (!isNaN(altDate.getTime())) {
              return altDate;
            }
          }
        }
        return date;
      }
    } catch (error) {
      console.error("Error parsing date:", cleanDateString, error);
    }

    return null;
  };

  // Define date fields
  const isDateField = (checkpointId) => {
    return [
      "649",
      "590",
      "591",
      "592",
      "593",
      "652",
      "658",
      "595",
      "598",
      "602",
      "661",
      "605",
      "608",
      "662",
      "612",
      "615",
      "618",
      "622",
      "667",
      "625",
      "628",
      "632",
      "668",
    ].includes(checkpointId.toString());
  };

  const isDocumentField = (checkpointId) => {
    return [
      "599",
      "603",
      "609",
      "613",
      "619",
      "623",
      "629",
      "633",
      "671",
      "650",
      "654",
    ].includes(checkpointId.toString());
  };

  const getCheckpointDescription = (checkpointId) => {
    const checkpoint = checkpoints.find(
      (cp) => cp.CheckpointId.toString() === checkpointId.toString()
    );
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  const handleInputChange = (checkpointId, value) => {
    setEditedData((prev) => ({
      ...prev,
      [checkpointId]: value,
    }));
  };

  const handleDateChange = (checkpointId, date) => {
    // Store the Date object for the date picker
    setDateValues((prev) => ({
      ...prev,
      [checkpointId]: date,
    }));

    // Format date to yyyy-mm-dd for API submission
    const formattedDate = date ? formatDateForAPI(date) : "";
    setEditedData((prev) => ({
      ...prev,
      [checkpointId]: formattedDate,
    }));
  };

  // Format date to yyyy-mm-dd
  const formatDateForAPI = (date) => {
    if (!date || isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for display (dd/mm/yyyy)
  const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString.trim() === "") {
      return "";
    }

    // Try to parse the date string
    const date = parseDateString(dateString);
    if (!date || isNaN(date.getTime())) {
      // If we can't parse it, return the original string
      return dateString;
    }

    // Format as dd/mm/yyyy for display
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleFileChange = (checkpointId, file) => {
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [checkpointId]: file,
      }));
      setEditedData((prev) => ({
        ...prev,
        [checkpointId]: file.name,
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
      const textResponse = await axios.post(
        "https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php",
        {
          ActivityId: transaction.ActivityId,
          data: editedData,
          LatLong: null,
        }
      );

      if (!textResponse.data.success) {
        throw new Error(
          textResponse.data.message || "Failed to save text data"
        );
      }

      const fileEntries = Object.entries(files);
      if (fileEntries.length > 0) {
        const imageData = {};

        for (const [checkpointId, file] of fileEntries) {
          const base64 = await convertToBase64(file);
          imageData[checkpointId] = base64;
        }

        const imageResponse = await axios.post(
          "https://namami-infotech.com/SANCHAR/src/menu/add_image.php",
          {
            menuId: 10,
            ActivityId: transaction.ActivityId,
            LatLong: null,
            data: imageData,
          }
        );

        if (!imageResponse.data.success) {
          throw new Error(
            imageResponse.data.message || "Failed to upload images"
          );
        }
      }

      setSuccess("Changes saved successfully!");
      setTimeout(() => navigate("/amc-work"), 1500);
    } catch (err) {
      setError(err.message || "An error occurred while saving");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
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
            {Object.keys(editedData).map((checkpointId) => (
              <tr key={checkpointId}>
                <td>{getCheckpointDescription(checkpointId)}</td>
                <td>
                  {isDocumentField(checkpointId) ? (
                    <div className="document-field">
                      <input
                        type="file"
                        id={`file-upload-${checkpointId}`}
                        style={{ display: "none" }}
                        onChange={(e) =>
                          handleFileChange(checkpointId, e.target.files[0])
                        }
                        accept="image/*,application/pdf"
                      />
                      <label
                        htmlFor={`file-upload-${checkpointId}`}
                        className="file-upload-label"
                      >
                        Choose File
                      </label>
                      <span className="file-name">
                        {files[checkpointId]
                          ? files[checkpointId].name
                          : editedData[checkpointId]
                          ? editedData[checkpointId]
                          : "No file selected"}
                      </span>
                      {editedData[checkpointId] && !files[checkpointId] && (
                        <button
                          className="view-button"
                          onClick={() =>
                            window.open(editedData[checkpointId], "_blank")
                          }
                        >
                          👁️ View
                        </button>
                      )}
                    </div>
                  ) : isDateField(checkpointId) ? (
                    <div className="date-field">
                      <DatePicker
                        selected={dateValues[checkpointId] || null}
                        onChange={(date) =>
                          handleDateChange(checkpointId, date)
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                        className="date-picker-input"
                        isClearable
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={15}
                      />
                      {editedData[checkpointId] && (
                        <div className="date-info">
                          <span className="date-display">
                            Display:{" "}
                            {formatDateForDisplay(editedData[checkpointId])}
                          </span>
                          <span className="date-api-format">
                            Stored as: {editedData[checkpointId] || "Empty"}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editedData[checkpointId] || ""}
                      onChange={(e) =>
                        handleInputChange(checkpointId, e.target.value)
                      }
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
