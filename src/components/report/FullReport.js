import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Summary.css";

function FullReport() {
  const [transactions, setTransactions] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions data (menuId=8)
        const transactionsResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=8"
        );
        
        // Fetch status data (menuId=10)
        const statusResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=10"
        );

        if (transactionsResponse.data.success && statusResponse.data.success) {
          setTransactions(transactionsResponse.data.data);
          setFilteredRecords(transactionsResponse.data.data);
          setStatusData(statusResponse.data.data);
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

  // Filter records based on search term and status filter
  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      const loaNumber = getTransactionValue(transaction, "574");
      const matchesSearch = loaNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === "all") return matchesSearch;
      
      const status = getProjectStatus(loaNumber);
      return matchesSearch && status === statusFilter;
    });
    
    setFilteredRecords(filtered);
    setPage(0); // Reset to first page when filters change
  }, [transactions, searchTerm, statusFilter]);

  // Get value from transaction details by checkpoint ID
  const getTransactionValue = (transaction, checkpointId) => {
    if (!transaction || !transaction.Details) return "-";
    const detail = transaction.Details.find(d => d.ChkId === checkpointId);
    return detail ? detail.Value : "-";
  };

  // Get value from status data for a specific LOA and checkpoint
  const getStatusValue = (loaNumber, checkpointId) => {
    const statusRecord = statusData.find(record => 
      getTransactionValue(record, "589") === loaNumber
    );
    return getTransactionValue(statusRecord, checkpointId);
  };

  // Calculate pending invoice amount for a given LOA
  const calculatePendingAmount = (loaNumber) => {
    const statusRecord = statusData.find(record => 
      getTransactionValue(record, "589") === loaNumber
    );
    
    if (!statusRecord) return 0;
    
    // Invoice amount checkpoint IDs
    const amountCheckpoints = ["596", "606", "616", "626"];
    // Payment status checkpoint IDs
    const statusCheckpoints = ["597", "607", "617", "627"];
    
    let totalPending = 0;
    
    amountCheckpoints.forEach((amountCp, index) => {
      const amount = parseFloat(getTransactionValue(statusRecord, amountCp)) || 0;
      const status = getTransactionValue(statusRecord, statusCheckpoints[index]);
      
      if (status !== "Done") {
        totalPending += amount;
      }
    });
    
    return totalPending;
  };

  // Determine project status based on the conditions
  const getProjectStatus = (loaNumber) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the corresponding status record for this LOA
    const statusRecord = statusData.find(record => 
      getTransactionValue(record, "589") === loaNumber
    );
    
    if (!statusRecord) return "-";
    
    // Get all required dates
    const warrantyEndDate = getDateFromValue(getTransactionValue(statusRecord, "592"));
    const installationDate = getDateFromValue(getTransactionValue(statusRecord, "593"));
    const completionDate = getDateFromValue(getTransactionValue(statusRecord, "625"));
    
    // Check completion first
    if (completionDate && completionDate <= today) {
      return "Complete";
    }
    
    if (warrantyEndDate && warrantyEndDate > today) {
      return "Under Warranty";
    }
    
    // Check installation
    if (installationDate && installationDate > today) {
      return "Under Installation";
    }
    
    // If installation date passed and warranty expired
    if ((!installationDate || installationDate <= today) && 
        (!warrantyEndDate || warrantyEndDate <= today)) {
      return "AMC Work";
    }
    
    return "-";
  };

  // Helper function to convert value to Date object
  const getDateFromValue = (value) => {
    if (!value) return null;
    
    // Try different date formats
    const dateFormats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
    ];
    
    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        if (format === dateFormats[0]) { // DD/MM/YYYY
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          return new Date(year, month, day);
        } else { // YYYY-MM-DD
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          return new Date(year, month, day);
        }
      }
    }
    
    return null;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleChangePage = (newPage) => setPage(newPage);

  // Calculate totals for transmitter and receiver quantities
  const calculateTotals = () => {
    let transmitterTotal = 0;
    let receiverTotal = 0;
    
    filteredRecords.forEach(record => {
      const txQty = parseFloat(getTransactionValue(record, "575")) || 0;
      const rxQty = parseFloat(getTransactionValue(record, "576")) || 0;
      
      transmitterTotal += txQty;
      receiverTotal += rxQty;
    });
    
    return { transmitterTotal, receiverTotal };
  };

  const { transmitterTotal, receiverTotal } = calculateTotals();
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

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
        <h2 className="material-list-title">Full Report</h2>

        <div className="material-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search LOA..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="status-filter-container">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="Under Warranty">Under Warranty</option>
              <option value="AMC Work">AMC Work</option>
              <option value="Under Installation">Under Installation</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="material-table">
          <thead>
             <tr>
              <th>LOA Number</th>
              <th>Value Of Order</th>
              <th>WPC Work</th>
              <th>Transmitter QTY</th>
              <th>RX Receiver QTY</th>
              <th>Date Of WOrk Start</th>
              <th>Project Status</th>
              <th>Figures</th>
              <th>Handover Date of System</th>
              <th>Warranty Period</th>
              <th>Bill Raised Equipment</th>
              <th>Bill No.</th>
              <th>Date</th>
              <th> Amount</th>
              <th>Payment Status</th>
              <th>AMC Period</th>
              <th>Billing Cycle</th>
              <th>Amount Per Cycle</th>
              <th>Pending Invoice Amount</th>
              <th>First ARC Start Date</th>
              <th>Bill No.</th>
              <th>Bill Date</th>
              <th>Amount</th>
              <th>Payment Status Remarks</th>
              <th>Second ARC Start Date</th>
              <th>Bill No.</th>
              <th>Bill Date</th>
              <th>Amount</th>
              <th>Payment Status Remarks</th>
              <th>Third ARC Start Date</th>
              <th>Bill No.</th>
              <th>Bill Date</th>
              <th>Amount</th>
              <th>Payment Status Remarks</th>
              <th>Fourth ARC Start Date</th>
              <th>Bill No.</th>
              <th>Bill Date</th>
              <th>Amount</th>
              <th>Payment Status Remarks</th>
            </tr>
</thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => {
                const loaNumber = getTransactionValue(record, "574");
                const statusRecord = statusData.find(record => 
                  getTransactionValue(record, "589") === loaNumber
                );
                
                return (
                  <tr key={record.ActivityId}>
                    <td>{loaNumber}</td>
                    <td></td>
                    <td></td>
                    <td>{getTransactionValue(record, "575")}</td>
                    <td>{getTransactionValue(record, "576")}</td>
                    <td></td>
                    <td>{getProjectStatus(loaNumber)}</td>
                    <td></td>
                     <td>{getStatusValue(loaNumber, "590")}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>{Number(getStatusValue(loaNumber, "596")) + Number(getStatusValue(loaNumber, "606")) +Number(getStatusValue(loaNumber, "616"))+Number(getStatusValue(loaNumber, "626"))}</td>
                    <td>{getStatusValue(loaNumber, "627")}</td>
                    <td></td>
                    <td>{getStatusValue(loaNumber, "594")}</td>
                    <td>{getStatusValue(loaNumber, "596")}</td>
                    <td>{calculatePendingAmount(loaNumber).toLocaleString('en-IN')}</td>
                    <td>{getStatusValue(loaNumber, "595")}</td>
                    <td>{getStatusValue(loaNumber, "601")}</td>
                    <td>{getStatusValue(loaNumber, "602")}</td>
                    <td>{getStatusValue(loaNumber, "600")}</td>
                    <td>{getStatusValue(loaNumber, "604")}</td>
                    <td>{getStatusValue(loaNumber, "605")}</td>
                    <td>{getStatusValue(loaNumber, "611")}</td>
                    <td>{getStatusValue(loaNumber, "612")}</td>
                    <td>{getStatusValue(loaNumber, "610")}</td>
                    <td>{getStatusValue(loaNumber, "614")}</td>
                     <td>{getStatusValue(loaNumber, "615")}</td>
                    <td>{getStatusValue(loaNumber, "621")}</td>
                    <td>{getStatusValue(loaNumber, "622")}</td>
                    <td>{getStatusValue(loaNumber, "620")}</td>
                    <td>{getStatusValue(loaNumber, "624")}</td>
                     <td>{getStatusValue(loaNumber, "625")}</td>
                    <td>{getStatusValue(loaNumber, "631")}</td>
                    <td>{getStatusValue(loaNumber, "632")}</td>
                    <td>{getStatusValue(loaNumber, "630")}</td>
                    <td>{getStatusValue(loaNumber, "634")}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={39} className="no-records">
                  No records found
                </td>
              </tr>
            )}
            {/* Totals row */}
            <tr className="totals-row">
              <td><strong>Total</strong></td>
              <td></td>
              <td></td>
              <td><strong>{transmitterTotal}</strong></td>
              <td><strong>{receiverTotal}</strong></td>
              <td colSpan={34}></td>
            </tr>
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

export default FullReport;