import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TenderList.css"; // You would need to create this CSS file

function TenderList() {
  const [tempRecords, setTempRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTempData = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_temp.php?menuId=1"
        );
        if (response.data.success) {
          setTempRecords(response.data.data);
          setFilteredRecords(response.data.data);
        } else {
          setError("No data found.");
        }
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTempData();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = tempRecords.filter((record) => {
      const nameEntry = record.chkData?.find((chk) => chk.ChkId === "3");
      const tenderno = nameEntry?.Value?.toLowerCase() || "";
      const nameEntry2 = record.chkData?.find((chk) => chk.ChkId === "6");
      const name = nameEntry2?.Value?.toLowerCase() || "";

      return tenderno.includes(value) || name.includes(value);
    });
    setFilteredRecords(filtered);
    setPage(0);
  };

  const handleChangePage = (newPage) => setPage(newPage);

  const formatDate = (datetime) => {
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to determine row class based on awarded value
  const getRowClass = (awardedValue) => {
    if (awardedValue && awardedValue.toLowerCase().includes("sanchar")) {
      return "awarded-sanchar";
    }
    return "awarded-other";
  };

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tenders...</p>
      </div>
    );
  }

  return (
    <div className="tender-list-container">
      <div className="tender-list-header">
        <h2 className="tender-list-title">Tender List</h2>

        <div className="tender-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by Tender No. or Buyer Name"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button
            className="action-button draft-button"
            onClick={() => navigate("/draft")}
          >
            Drafts
          </button>
          <button
            className="action-button new-tender-button"
            onClick={() => navigate("/create-tender")}
          >
            New Tender
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="tender-table">
          <thead>
            <tr>
              <th>Tender No.</th>
              <th>LOA No.</th>
              <th>Buyer</th>
              <th>Date</th>
              <th>Awarded to</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => {
                const nameEntry = record.chkData?.find(
                  (chk) => chk.ChkId === "4"
                );
                const nameEntry2 = record.chkData?.find(
                  (chk) => chk.ChkId === "7"
                );
                const nameEntry3 = record.chkData?.find(
                  (chk) => chk.ChkId === "60"
                );
                const nameEntry4 = record.chkData?.find(
                  (chk) => chk.ChkId === "56"
                );
                
                const awardedValue = nameEntry4?.Value || "";
                const rowClass = getRowClass(awardedValue);

                return (
                  <tr key={record.ID} className={rowClass}>
                    <td>{nameEntry?.Value || "-"}</td>
                    <td>{nameEntry3?.Value || "-"}</td>
                    <td>{nameEntry2?.Value || "-"}</td>
                    <td>{formatDate(record.Datetime)}</td>
                    <td>{awardedValue}</td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          navigate(`/tender/view/${record.ActivityId}`)
                        }
                      >
                        <span className="view-icon">👁️</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="no-records">
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
          disabled={page >= totalPages - 1}
          onClick={() => handleChangePage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TenderList;