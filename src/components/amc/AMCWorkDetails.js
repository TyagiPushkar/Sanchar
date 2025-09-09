import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import the xlsx library
import "./AMCWorkList.css";

function AMCWorkDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { transaction, checkpoints } = state || {};
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  // Function to export data to Excel
  const exportToExcel = () => {
    if (!transaction) return;
    
    // Prepare data for export
    const dataToExport = transaction.Details.map(detail => {
      return {
        "Field": getCheckpointDescription(detail.ChkId),
        "Value": detail.Value
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AMC Work Details");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `amc-work-details-${transaction.ActivityId}.xlsx`);
  };

  if (!transaction) {
    return (
      <div className="material-list-container">
        <div className="error-message">No data available</div>
        <button
          className="action-button back-button"
          onClick={() => navigate(-1)}
        >
          Back to List
        </button>
      </div>
    );
  }

  const getCheckpointDescription = (checkpointId) => {
    // Convert both to strings for consistent comparison
    const checkpoint = checkpoints.find(cp => 
      cp.CheckpointId.toString() === checkpointId.toString()
    );
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  const getTransactionValue = (checkpointId) => {
    const detail = transaction.Details.find(d => d.ChkId === checkpointId);
    
    if (!detail) return "-";
    
    if (["599", "603", "609","613","619","623","629","633"].includes(checkpointId)) {
      return (
        <button 
          className="view-button"
          onClick={() => window.open(detail.Value, "_blank")}
          title="View Document"
        >
          <span className="view-icon">👁️</span> 
        </button>
      );
    }
    
    return detail.Value;
  };

  const handleEdit = () => {
    navigate("/edit-amc-work", { state: { transaction, checkpoints } });
  };

  const allCheckpointIds = [...new Set(transaction.Details.map(detail => detail.ChkId))];
  const isAdmin = user?.role === "Admin";

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">AMC Work Details</h2>
        <div className="action-buttons">
          <button
            className="action-button back-button"
            onClick={() => navigate(-1)}
          >
            Back to List
          </button>
          
          {/* Export to Excel Button */}
          <button
            onClick={exportToExcel}
            className="action-button"
            style={{ backgroundColor: "#F69320" }}
            title="Export to Excel"
          >
            📊 Export to Excel
          </button>
          
          {isAdmin && (
            <button
              className="action-button edit-button"
              onClick={handleEdit}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="material-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {allCheckpointIds.map(checkpointId => (
              <tr key={checkpointId}>
                <td>{getCheckpointDescription(checkpointId)}</td>
                <td>{getTransactionValue(checkpointId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AMCWorkDetails;