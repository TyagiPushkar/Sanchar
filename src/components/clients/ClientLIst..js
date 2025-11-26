import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ClientList.css";

function ClientList() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/NIKHILOFFSET/src/clients/clients.php"
        );

        if (response.data.success) {
          setClients(response.data.data);
          setFilteredClients(response.data.data);
        } else {
          setError("No clients found.");
        }
      } catch (err) {
        setError("Failed to fetch client data.");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = clients.filter((client) => {
      const fullName = `${client.FirstName} ${client.LastName}`.toLowerCase();
      return (
        fullName.includes(value) ||
        (client.Email?.toLowerCase().includes(value)) ||
        (client.CompanyName?.toLowerCase().includes(value))
      );
    });

    setFilteredClients(filtered);
    setPage(0);
  };

  const handleChangePage = (newPage) => setPage(newPage);

  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredClients.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Clients...</p>
      </div>
    );
  }

  return (
    <div className="tender-list-container">
      <div className="tender-list-header">
        <div className="tender-list-actions">
          <h2 className="tender-list-title">Client List</h2>

          <button
            className="action-button new-tender-button"
            onClick={() => navigate("/add-client")}
          >
            Add Client
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <input
        type="text"
        placeholder="Search by name, email or company..."
        className="search-box"
        value={searchTerm}
        onChange={handleSearch}
      />

      <div className="table-container">
        <table className="tender-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((client) => (
                <tr key={client.ClientID}>
                  <td>{client.FirstName} {client.LastName}</td>
                  <td>{client.Email}</td>
                  <td>{client.CompanyName || "-"}</td>
                  <td>{client.PhoneNumber || "-"}</td>

                  <td>
                    <button
                      className="edit-button"
                      onClick={() =>
                        navigate(`/client/edit/${client.ClientID}`, {
                          state: { client },
                        })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-records">
                  No Clients Found
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

export default ClientList;
