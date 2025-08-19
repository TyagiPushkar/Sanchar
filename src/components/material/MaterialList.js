import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MaterialList.css";

function MaterialList() {
  const [transactions, setTransactions] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions data
        const transactionsResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=8"
        );
        
        // Fetch checkpoints data
        const checkpointsResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php"
        );

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

  // Get checkpoint description by ID
  const getCheckpointDescription = (checkpointId) => {
    const checkpoint = checkpoints.find(cp => cp.CheckpointId === parseInt(checkpointId));
    return checkpoint ? checkpoint.Description : `Field ${checkpointId}`;
  };

  // Extract all unique checkpoint IDs from all transactions
  const getAllCheckpointIds = () => {
    const allIds = new Set();
    transactions.forEach(transaction => {
      transaction.Details.forEach(detail => {
        allIds.add(detail.ChkId);
      });
    });
    return Array.from(allIds);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    
    const filtered = transactions.filter(transaction => {
      return transaction.Details.some(detail => {
        return detail.Value.toLowerCase().includes(value);
      });
    });
    
    setFilteredRecords(filtered);
    setPage(0);
  };

  const handleChangePage = (newPage) => setPage(newPage);

  const formatDate = (datetime) => {
    if (!datetime) return "-";
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTransactionValue = (transaction, checkpointId) => {
    const detail = transaction.Details.find(d => d.ChkId === checkpointId);
    
    if (!detail) return "-";
    
    // Special handling for checkpoint ID 580 (image/pdf link)
    if (checkpointId === "580") {
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

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);
  const allCheckpointIds = getAllCheckpointIds();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading materials...</p>
      </div>
    );
  }

  return (
    <div className="material-list-container">
      <div className="material-list-header">
        <h2 className="material-list-title">Material Supplied List</h2>

        <div className="material-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button
            className="action-button new-material-button"
            onClick={() => navigate("/add-material")}
          >
            Add Material
          </button>
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
  <button 
    className="edit-button"
    onClick={() => navigate("/edit-material", { 
      state: { 
        transaction: record, 
        checkpoints 
      } 
    })}
  >
    ✏️
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={allCheckpointIds.length + 2} className="no-records">
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
          onClick={() => handleChangePage(page - 1)}
        >
          Previous
        </button>
        <span className="page-info">
          Page {page + 1} of {totalPages || 1}
        </span>
        <button
          className="pagination-button"
          disabled={page >= totalPages - 1 || filteredRecords.length === 0}
          onClick={() => handleChangePage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default MaterialList;