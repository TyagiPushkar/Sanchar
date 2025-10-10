import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
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
    
    // Prepare data for export in the specified sequence
    const dataToExport = fieldSequence.map(fieldName => {
      const checkpointId = getCheckpointIdByDescription(fieldName);
      const detail = checkpointId ? findTransactionDetail(checkpointId) : null;
      
      return {
        "Field": fieldName,
        "Value": detail ? detail.Value : "-"
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

  // Define the field sequence
  const fieldSequence = [
    "LOA Number",
    "PDF LOA Copy",
    "Date Of Work Start",
    "e-MB Date",
    "e-MB Attachment",
    "Warranty Start Date",
    "Warranty End date",
    "AMC Start Date",
    "Billing Cycle of AMC",
    "Number of Cycle",
    "1st Year AMC Bill Start Date:-",
    "1st Year AMC Bill Amount With GST:-",
    "1st Year AMC Bill Status",
    "1st Year AMC Final MB Done Date:-",
    "1st Year AMC Invoice Amount with GST:-",
    "1st Year AMC Deduction",
    "1st Year AMC Invoice No:-",
    "1st Year AMC Invoice Date:-",
    "1st Year AMC Payment Amount Received",
    "1st Year AMC Payment Received Date",
    "1st Year AMC Remarks",
    "2nd Year AMC Bill Start Date:-",
    "2nd Year AMC Bill Amount with GST:-",
    "2nd Year AMC Bill Status",
    "2nd Year AMC Final MB Done Date:-",
    "2nd Year AMC Invoice Amount with GST:-",
    "2nd Year AMC Deduction",
    "2nd Year AMC Invoice No:-",
    "2nd Year AMC Invoice Date:-",
    "2nd Year AMC Payment Amount Received",
    "2nd Year AMC Payment Received Date",
    "2nd Year AMC Remarks",
    "3rd Year AMC Bill Start Date:-",
    "3rd Year AMC Bill Amount with GST:-",
    "3rd Year AMC Bill Status",
    "3rd Year AMC Final MB Done Date:-",
    "3rd Year AMC Invoice Amount with GST:-",
    "3rd Year AMC Deduction",
    "3rd Year AMC Invoice No:-",
    "3rd Year AMC Invoice Date:-",
    "3rd Year AMC Payment Amount Received",
    "3rd Year AMC Payment Received Date",
    "3rd Year AMC Remarks",
    "4th Year AMC Bill Start Date:-",
    "4th Year AMC Bill Amount with GST:-",
    "4th Year AMC Bill Status",
    "4th Year AMC Final MB Done Date:-",
    "4th Year AMC Invoice Amount with GST:-",
    "4th Year AMC Deduction",
    "4th Year AMC Invoice No:-",
    "4th Year AMC Invoice Date:-",
    "4th Year AMC Payment Amount Received",
    "4th Year AMC Payment Received Date",
    "4th Year AMC Remarks",
    "First Supply Good Bill Raised Date",
    "First Supply Goods Bill Invoice No.",
    "First Supply Goods Bill Invoice Amount",
    "First Supply Goods Bill Received Amount",
    "First Supply Good Paymemt Date",
    "1st Year AMC Final MB Copy Photo/PDF",
    "1st Year AMC Invoice Copy Photo/PDF",
    "2nd Year AMC Final MB Copy Photo/PDF",
    "2nd Year AMC Invoice Copy Photo/PDF",
    "3rd Year AMC Final MB Copy Photo/PDF",
    "3rd Year AMC Invoice Copy Photo/PDF",
    "4th Year AMC Final MB Copy Photo/PDF",
    "4th Year AMC Invoice Copy Photo/PDF",
    "First Supply Goods Bill Invoice Attachment"
  ];

  // Create a mapping of checkpoint descriptions to IDs for easier lookup
  const createCheckpointMap = () => {
    const map = {};
    if (checkpoints) {
      checkpoints.forEach(cp => {
        // Normalize the description by trimming and handling case sensitivity
        const normalizedDesc = cp.Description.trim();
        map[normalizedDesc] = cp.CheckpointId;
        
        // Also log for debugging
        console.log(`Checkpoint: "${cp.Description}" -> ID: ${cp.CheckpointId}`);
      });
    }
    return map;
  };

  const checkpointMap = createCheckpointMap();

  const getCheckpointIdByDescription = (description) => {
    // Normalize the search description too
    const normalizedSearch = description.trim();
    return checkpointMap[normalizedSearch];
  };

  const findTransactionDetail = (checkpointId) => {
    if (!checkpointId) return null;
    
    // Convert both to string for consistent comparison
    const checkpointIdStr = checkpointId.toString();
    
    const detail = transaction.Details.find(d => {
      const detailChkIdStr = d.ChkId ? d.ChkId.toString() : null;
      return detailChkIdStr === checkpointIdStr;
    });
    
    console.log(`Looking for checkpoint ${checkpointIdStr}:`, detail ? `Found value: "${detail.Value}"` : "Not found");
    return detail;
  };

  const getTransactionValue = (checkpointId) => {
    if (!checkpointId) return "-";
    
    const detail = findTransactionDetail(checkpointId);
    
    if (!detail || detail.Value === null || detail.Value === undefined || detail.Value === "") {
      return "-";
    }
    
    // Check if this is a document field that should show a view button
    const documentCheckpointIds = ["599", "603", "609", "613", "619", "623", "629", "633"];
    if (documentCheckpointIds.includes(checkpointId.toString()) && detail.Value) {
      return (
        <button 
          className="view-button"
          onClick={() => window.open(detail.Value, "_blank")}
          title="View Document"
        >
          <span className="view-icon">👁️</span> View Document
        </button>
      );
    }
    
    return detail.Value;
  };

  const handleEdit = () => {
    navigate("/edit-amc-work", { state: { transaction, checkpoints } });
  };

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
              <th>Field Name</th>
              <th>Value</th>
              {/* <th>Checkpoint ID</th> */}
              {/* <th>Status</th> */}
            </tr>
          </thead>
          <tbody>
            {fieldSequence.map(fieldName => {
              const checkpointId = getCheckpointIdByDescription(fieldName);
              const detail = checkpointId ? findTransactionDetail(checkpointId) : null;
              const value = getTransactionValue(checkpointId);
              const status = checkpointId ? (detail ? "Data Found" : "No Data") : "Checkpoint Not Found";
              
              return (
                <tr key={fieldName}>
                  <td>{fieldName}</td>
                  <td>{value}</td>
                  {/* <td>{checkpointId || "Not found"}</td> */}
                  {/* <td style={{ 
                    color: status === "Data Found" ? "green" : 
                           status === "No Data" ? "orange" : "red",
                    fontWeight: "bold"
                  }}>
                    {status}
                  </td> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      
    </div>
  );
}

export default AMCWorkDetails;