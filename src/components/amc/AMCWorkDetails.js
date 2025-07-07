import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AMCWorkList.css"; // Reuse the same CSS

function AMCWorkDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { transaction, checkpoints } = state || {};

  if (!transaction) {
    return <div>No data available</div>;
  }

  const getCheckpointDescription = (checkpointId) => {
    const checkpoint = checkpoints.find(cp => cp.CheckpointId === parseInt(checkpointId));
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  const getTransactionValue = (checkpointId) => {
    const detail = transaction.Details.find(d => d.ChkId === checkpointId);
    
    if (!detail) return "-";
    
    // Special handling for document links
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

  // Get all unique checkpoint IDs from the transaction
  const allCheckpointIds = [...new Set(transaction.Details.map(detail => detail.ChkId))];

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">AMC Work Details</h2>
        <button
          className="action-button back-button"
          onClick={() => navigate(-1)}
        >
          Back to List
        </button>
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