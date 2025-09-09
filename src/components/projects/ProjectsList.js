import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProjectList.css";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; 

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/tender/sanchar_tender.php?menuId=1"
        );
        if (response.data.success) {
          setProjects(response.data.data);
          setFilteredProjects(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = projects.filter((project) => {
      const tenderNo = project.TenderNo?.toLowerCase() || "";
      const buyer = project.BuyerName?.toLowerCase() || "";
      return tenderNo.includes(value) || buyer.includes(value);
    });
    setFilteredProjects(filtered);
    setPage(0);
  };

  const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRecords = filteredProjects.slice(startIndex, startIndex + rowsPerPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date) ? "-" : date.toLocaleDateString("en-GB");
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openInSameTab = (url) => {
    window.open(url, "noopener,noreferrer");
  };


   const exportToExcel = () => {
    // Prepare data for export
    const dataToExport = filteredProjects.map((buyer) => {
      return {
        "Tender No": buyer.TenderNo,
        "LOA No": buyer.LOA,
        "Buyer": buyer.BuyerName,
        "Date": buyer.TenderDate ? formatDate(buyer.TenderDate) : "-",
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buyers");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "LOA_Awarded.xlsx");
  };

  if (loading) {
    return (
      <div className="project-loading-container">
        <div className="project-spinner"></div>
        <div>Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2 className="project-list-title">
          LOA Awarded List ({filteredProjects.length})
        </h2>
        <input
          type="text"
          placeholder="Search by Tender No. or Buyer"
          value={searchTerm}
          onChange={handleSearch}
          className="project-search-input"
        />
        <button
            onClick={exportToExcel}
            className="action-button"
            style={{ backgroundColor: "#F69320" }}
            title="Export to Excel"
          >
            📊 Export to Excel
          </button>
      </div>

      <div className="project-table-container">
        <table className="project-table">
          <thead>
            <tr>
              <th>Tender No</th>
              <th>LOA No</th>
              <th>Buyer</th>
              <th>Date</th>
              <th>Tender Copy</th>
              <th>Tasks</th>
              <th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((project) => (
                <tr key={project.ActivityId}>
                  <td 
                    onClick={() => navigate(`/tender/view/${project.ActivityId}`)} 
                    style={{cursor:"pointer", fontWeight:"bold", color:"blue"}}
                  >
                    {project.TenderNo || "-"}
                  </td>
                  <td>{project.LOA || "-"}</td>
                  <td>{project.BuyerName || "-"}</td>
                  <td>{formatDate(project.TenderDate)}</td>
                  <td>
                    {project.TenderCopy && project.TenderCopy.endsWith(".pdf") ? (
                      <button
                        className="project-link-button"
                        onClick={() => openInNewTab(project.TenderCopy)}
                      >
                        📄 Open PDF
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      className="project-view-button"
                      onClick={() =>  navigate(`/project/view/${project.TenderNo}`, {
                        state: {
                          tenderNo: project.TenderNo,
                          ActivityId: project.ActivityId
                         }
                      })
                      }
                    >
                      👁️
                    </button>
                  </td>
                  <td>
                    <button
                      className="project-view-button"
                      onClick={() =>  navigate(`/assign/task/${project.ActivityId}`, {
                        state: { tenderNo: project.TenderNo }
                      })
                      }
                    >
                      📝
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="project-no-records">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="project-pagination">
        <button
          className="project-pagination-button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span className="project-page-info">
          Page {page + 1} of {totalPages || 1}
        </span>
        <button
          className="project-pagination-button"
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ProjectList;