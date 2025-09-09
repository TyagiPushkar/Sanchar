import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import the xlsx library
import "./AMCWorkList.css";

function AMCWorkList() {
  const [transactions, setTransactions] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading]= useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const displayCheckpointIds = ["589", "590", "591", "592", "593", "594"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const [transactionsResponse, checkpointsResponse] = await Promise.all([
          axios.get("https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=10"),
          axios.get("https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php")
        ]);

        if (transactionsResponse.data.success && checkpointsResponse.data.success) {
          setTransactions(transactionsResponse.data.data);
          setFilteredRecords(transactionsResponse.data.data);
          setCheckpoints(checkpointsResponse.data.data);
        } else {
          setError("Failed to fetch data from one or more sources.");
        }
      } catch (err) {
        setError("Failed to connect to the server.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCheckpointDescription = (checkpointId) => {
    // Convert both to strings for consistent comparison
    const checkpoint = checkpoints.find(cp => 
      cp.CheckpointId.toString() === checkpointId.toString()
    );
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  const getAllCheckpointIds = () => {
    return displayCheckpointIds;
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    
    const filtered = transactions.filter(transaction => {
      return transaction.Details.some(detail => {
        // Check if detail.Value exists before calling toLowerCase()
        return detail.Value && detail.Value.toString().toLowerCase().includes(value);
      });
    });
    
    setFilteredRecords(filtered);
    setPage(0);
  };

  // Function to export data to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const dataToExport = filteredRecords.map(record => {
      const exportData = {};
      
      displayCheckpointIds.forEach(checkpointId => {
        const detail = record.Details.find(d => d.ChkId === checkpointId);
        const fieldName = getCheckpointDescription(checkpointId);
        exportData[fieldName] = detail ? detail.Value : "-";
      });
      
      return exportData;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AMC Work");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "amc-work.xlsx");
  };

  const handleViewDetails = (transaction) => {
    navigate("/details", { state: { transaction, checkpoints } });
  };

  const handleEdit = (transaction) => {
    navigate("/edit-amc-work", { state: { transaction, checkpoints } });
  };

  const getTransactionValue = (transaction, checkpointId) => {
    const detail = transaction.Details.find(d => d.ChkId === checkpointId);
    return detail ? detail.Value : "-";
  };

  
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);
  const allCheckpointIds = getAllCheckpointIds();
  const isAdmin = user?.role === "Admin";

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading AMC work...</p>
      </div>
    );
  }

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">AMC WORK List</h2>
        <div className="material-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search ..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
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
              className="action-button new-material-button"
              onClick={() => navigate("/add-amc-work")}
            >
              Add Work
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="material-table">
          <thead>
            <tr>
              {allCheckpointIds.map(checkpointId => (
                <th key={checkpointId}>{getCheckpointDescription(checkpointId)}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => (
                <tr key={record.ActivityId}>
                  {allCheckpointIds.map(checkpointId => (
                    <td key={`${record.ActivityId}-${checkpointId}`}>
                      {getTransactionValue(record, checkpointId)}
                    </td>
                  ))}
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="view-button"
                        onClick={() => handleViewDetails(record)}
                      >
                        👁️
                      </button>
                      {isAdmin && (
                        <button 
                          className="edit-button"
                          onClick={() => handleEdit(record)}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={allCheckpointIds.length + 1} className="no-records">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="pagination-button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span className="page-info">
          Page {page + 1} of {totalPages || 1}
        </span>
        <button
          className="pagination-button"
          disabled={page >= totalPages - 1 || filteredRecords.length === 0}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AMCWorkList;