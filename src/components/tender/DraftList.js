import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "./DraftList.css"; // You would need to create this CSS file

function DraftList() {
  const [tempRecords, setTempRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [stageFilters, setStageFilters] = useState({});
  const [stageCounts, setStageCounts] = useState({});
  const [selectedStages, setSelectedStages] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Stage configuration with field IDs and step mapping
  const stages = [
    { 
      key: 'first_stage', 
      name: 'Tender Publish Details', 
      label: '1', 
      step: 0
    },
    { 
      key: 'second_stage', 
      name: 'Tender Participated by SWCL', 
      label: '2', 
      step: 1
    },
    { 
      key: 'third_stage', 
      name: 'Tender Opened', 
      label: '3', 
      step: 2
    },
    { 
      key: 'fourth_stage', 
      name: 'LOA Awarded', 
      label: '4', 
      step: 3
    }
  ];

  // Initialize stage filters
  useEffect(() => {
    const initialFilters = {};
    stages.forEach(stage => {
      initialFilters[stage.key] = 'all'; // all, complete, incomplete, not-applicable
    });
    setStageFilters(initialFilters);
  }, []);

  useEffect(() => {
    const fetchTempData = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_temp_draft.php?menuId=1",
        );
        if (response.data.success) {
          const recordsWithStep = response.data.data.map(record => {
            // Calculate current step based on stage_status from API
            let currentStep = 0;
            const stageStatus = record.stage_status || {};
            
            // Find first incomplete stage (excluding Not Applicable)
            for (let i = 0; i < stages.length; i++) {
              const stageKey = stages[i].key;
              const status = stageStatus[stageKey];
              
              if ((status === "Not Complete" || status === "Incomplete" || !status) && status !== "Not Applicable") {
                currentStep = i;
                break;
              }
              
              // If all stages are complete or not applicable, set to last stage
              if (i === stages.length - 1) {
                currentStep = i;
              }
            }
            
            return {
              ...record,
              currentStep: currentStep
            };
          });
          setTempRecords(recordsWithStep);
          setFilteredRecords(recordsWithStep);
          calculateStageCounts(recordsWithStep);
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

  // Calculate counts for each stage status
  const calculateStageCounts = (records) => {
    const counts = {};
    
    stages.forEach(stage => {
      counts[stage.key] = {
        all: 0,
        complete: 0,
        incomplete: 0,
        notApplicable: 0
      };
    });

    records.forEach(record => {
      const stageStatus = record.stage_status || {};
      
      stages.forEach(stage => {
        counts[stage.key].all++;
        const status = stageStatus[stage.key];
        
        if (status === "Not Applicable") {
          counts[stage.key].notApplicable++;
        } else if (status === "Complete" || status === "Completed") {
          counts[stage.key].complete++;
        } else {
          counts[stage.key].incomplete++;
        }
      });
    });

    setStageCounts(counts);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    applyFilters(value, stageFilters);
  };

  const handleStageFilterChange = (stageKey, filterValue) => {
    const newFilters = {
      ...stageFilters,
      [stageKey]: filterValue
    };
    setStageFilters(newFilters);
    
    // Update selected stages for visual feedback
    if (filterValue === 'all') {
      setSelectedStages(prev => prev.filter(s => s !== stageKey));
    } else {
      setSelectedStages(prev => [...prev.filter(s => s !== stageKey), stageKey]);
    }
    
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (searchValue, filters) => {
    let filtered = tempRecords.filter((record) => {
      // Apply search filter
      const nameEntry = record.chkData?.find((chk) => chk.ChkId === "4");
      const tenderno = nameEntry?.Value?.toLowerCase() || "";
      const nameEntry2 = record.chkData?.find((chk) => chk.ChkId === "7");
      const name = nameEntry2?.Value?.toLowerCase() || "";

      const searchMatch = searchValue === "" || 
        tenderno.includes(searchValue) || 
        name.includes(searchValue);

      // Apply stage filters
      let stageMatch = true;
      const stageStatus = record.stage_status || {};
      
      stages.forEach(stage => {
        const filterValue = filters[stage.key];
        if (filterValue !== 'all') {
          const status = stageStatus[stage.key];
          
          if (filterValue === 'complete') {
            stageMatch = stageMatch && (status === "Complete" || status === "Completed");
          } else if (filterValue === 'incomplete') {
            stageMatch = stageMatch && (status !== "Complete" && status !== "Completed" && status !== "Not Applicable");
          } else if (filterValue === 'not-applicable') {
            stageMatch = stageMatch && (status === "Not Applicable");
          }
        }
      });

      return searchMatch && stageMatch;
    });

    setFilteredRecords(filtered);
    setPage(0);
    calculateStageCounts(filtered);
  };

  const clearAllFilters = () => {
    const clearedFilters = {};
    stages.forEach(stage => {
      clearedFilters[stage.key] = 'all';
    });
    setStageFilters(clearedFilters);
    setSelectedStages([]);
    setSearchTerm("");
    applyFilters("", clearedFilters);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredRecords.map(record => {
      const nameEntry = record.chkData?.find((chk) => chk.ChkId === "4");
      const nameEntry2 = record.chkData?.find((chk) => chk.ChkId === "7");
      const nameEntry3 = record.chkData?.find((chk) => chk.ChkId === "60");
      const stageStatus = record.stage_status || {};
      
      const rowData = {
        "Tender No.": nameEntry?.Value || "-",
        "LOA No.": nameEntry3?.Value || "-",
        "Buyer": nameEntry2?.Value || "-",
        "Created Date": formatDate(record.Datetime),
        "Last Update": getTimeSince(record.LastUpdate),
      };

      // Add stage status columns
      stages.forEach(stage => {
        const status = stageStatus[stage.key];
        rowData[`Stage ${stage.label} (${stage.name})`] = status || "Not Started";
      });

      return rowData;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tender List");
    
    // Export file
    const fileName = `tender_list_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

  // Calculate time since last update
  const getTimeSince = (lastUpdate) => {
    if (!lastUpdate) return "-";
    
    // If lastUpdate is already formatted as a relative time, return it
    if (typeof lastUpdate === "string" && !lastUpdate.includes("-") && !lastUpdate.includes(":")) {
      return lastUpdate;
    }
    
    const updateDate = new Date(lastUpdate);
    const now = new Date();
    const diffMs = now - updateDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  // Check stage status and determine if it's editable
  const getStageStatusInfo = (record, stageKey) => {
    const stageStatus = record.stage_status || {};
    const status = stageStatus[stageKey];
    
    if (status === "Not Applicable") {
      return {
        isEditable: false,
        isComplete: false,
        isNotApplicable: true,
        statusText: status
      };
    } else if (status === "Complete" || status === "Completed") {
      return {
        isEditable: false,
        isComplete: true,
        isNotApplicable: false,
        statusText: status
      };
    } else {
      // Not Complete, Incomplete, or undefined/null
      return {
        isEditable: true,
        isComplete: false,
        isNotApplicable: false,
        statusText: status || "Not Started"
      };
    }
  };

  // Function to handle stage click - only for editable stages
  const handleStageClick = (record, stageIndex, stageKey, stageName, stageInfo) => {
    // Check if stage is editable (not complete and not not-applicable)
    if (stageInfo.isEditable) {
      navigate(`/edit-draft/${record.ActivityId}?step=${stageIndex}`);
    }
  };

  // Render stage status with appropriate icon and behavior
  const renderStageStatus = (record, stageIndex, stageKey, stageName) => {
    const stageInfo = getStageStatusInfo(record, stageKey);
    const title = `${stageName}: ${stageInfo.statusText}${stageInfo.isEditable ? ' - Click to edit' : ''}`;
    
    let iconContent = "";
    let iconClass = "";
    
    if (stageInfo.isComplete) {
      iconContent = "✓";
      iconClass = "complete";
    } else if (stageInfo.isNotApplicable) {
      iconContent = "N/A";
      iconClass = "not-applicable";
    } else {
      iconContent = "✗";
      iconClass = "incomplete";
    }
    
    return (
      <div 
        className="stage-status-column" 
        title={title}
        onClick={() => handleStageClick(record, stageIndex, stageKey, stageName, stageInfo)}
        style={{ 
          cursor: stageInfo.isEditable ? 'pointer' : 'default',
          opacity: stageInfo.isEditable ? 1 : 0.7
        }}
      >
        <span className={`stage-icon ${iconClass}`}>{iconContent}</span>
      </div>
    );
  };

  // Render stage filter dropdown
  const renderStageFilter = (stage) => {
    const counts = stageCounts[stage.key] || { all: 0, complete: 0, incomplete: 0, notApplicable: 0 };
    
    return (
      <div key={stage.key} className="stage-filter">
        <div className="stage-filter-header">
          <span className="stage-filter-label">Stage {stage.label}</span>
          <span className="stage-filter-counts">
            ({counts.complete}✓ {counts.incomplete}✗ {counts.notApplicable}N/A)
          </span>
        </div>
        <select
          value={stageFilters[stage.key] || 'all'}
          onChange={(e) => handleStageFilterChange(stage.key, e.target.value)}
          className="stage-filter-select"
          style={{
            backgroundColor: stageFilters[stage.key] !== 'all' ? '#e3f2fd' : 'white',
            borderColor: stageFilters[stage.key] !== 'all' ? '#2196f3' : '#ddd'
          }}
        >
          <option value="all">All ({counts.all})</option>
          <option value="complete">Complete ({counts.complete})</option>
          <option value="incomplete">Incomplete ({counts.incomplete})</option>
          <option value="not-applicable">Not Applicable ({counts.notApplicable})</option>
        </select>
      </div>
    );
  };

  // Calculate total incomplete stages count
  const getTotalIncompleteCount = () => {
    let total = 0;
    Object.values(stageCounts).forEach(counts => {
      total += counts.incomplete || 0;
    });
    return total;
  };

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading drafts...</p>
      </div>
    );
  }

  return (
    <div className="draft-list-container">
      <div className="draft-list-header">
        <div className="title-container">
          <h2 className="draft-list-title">Tender List</h2>
          <div className="draft-stats">
            <span className="draft-count">Total Tenders - {filteredRecords.length}</span>
            <span className="incomplete-count">
              Total Incomplete Stages - {getTotalIncompleteCount()}
            </span>
          </div>
        </div>

        <div className="draft-list-actions">
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
            className="action-button export-button"
            onClick={exportToExcel}
            title="Export to Excel"
          >
            📊 Export Excel
          </button>
          <button
            className="action-button new-tender-button"
            onClick={() => navigate("/create-tender")}
          >
            New Tender
          </button>
        </div>
      </div>

      {/* Stage Filters Row */}
      <div className="stage-filters-container">
        <div className="stage-filters-header">
          <h3>Filter by Stage Status</h3>
          {selectedStages.length > 0 && (
            <button 
              className="clear-filters-button"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
        <div className="stage-filters-grid">
          {stages.map(stage => renderStageFilter(stage))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container" ref={tableRef}>
        <table className="draft-table">
          <thead>
            <tr>
              <th>Tender No.</th>
              <th>LOA No.</th>
              <th>Buyer</th>
              <th>Created Date</th>
              <th>Last Update</th>
              {stages.map((stage) => (
                <th key={stage.key} className="stage-column-header">
                  <div className="stage-header-content">
                    <span className="stage-number">{stage.label}</span>
                    <span className="stage-name">{stage.name}</span>
                  </div>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => {
                const nameEntry = record.chkData?.find((chk) => chk.ChkId === "4");
                const nameEntry2 = record.chkData?.find((chk) => chk.ChkId === "7");
                const nameEntry3 = record.chkData?.find((chk) => chk.ChkId === "60");
                const timeSince = getTimeSince(record.LastUpdate);

                return (
                  <tr key={record.ID}>
                    <td className="tender-no">{nameEntry?.Value || "-"}</td>
                    <td>{nameEntry3?.Value || "-"}</td>
                    <td>{nameEntry2?.Value || "-"}</td>
                    <td>{formatDate(record.Datetime)}</td>
                    <td>
                      <span className={`time-badge ${timeSince.includes("day") ? "old" : "recent"}`}>
                        {timeSince}
                      </span>
                    </td>
                    {stages.map((stage, index) => (
                      <td key={stage.key} className="stage-column-cell">
                        {renderStageStatus(record, index, stage.key, stage.name)}
                      </td>
                    ))}
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="view-button"
                          title="View Draft"
                          onClick={() => navigate(`/tender/view/${record.ActivityId}`)}
                        >
                          <span className="button-icon">👁️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5 + stages.length + 1} className="no-records">
                  No draft records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="pagination">
          <button 
            className="pagination-button"
            disabled={page === 0}
            onClick={() => handleChangePage(page - 1)}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show pages around current page
              let pageNum = page;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button 
                  key={pageNum} 
                  className={`page-number ${pageNum === page ? 'active' : ''}`}
                  onClick={() => handleChangePage(pageNum)}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          
          <button 
            className="pagination-button"
            disabled={page >= totalPages - 1}
            onClick={() => handleChangePage(page + 1)}
          >
            Next
          </button>
        </div>
        
        <div className="page-info">
          Showing {startIndex + 1} - {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
        </div>
      </div>

      {/* Add some CSS styles for the stage icons */}
      <style jsx>{`
        .stage-status-column {
          text-align: center;
          padding: 8px;
          transition: background-color 0.2s;
        }
        
        .stage-status-column:hover {
          background-color: #f5f5f5;
        }
        
        .stage-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 14px;
          font-weight: bold;
        }
        
        .stage-icon.complete {
          background-color: #4caf50;
          color: white;
        }
        
        .stage-icon.incomplete {
          background-color: #f44336;
          color: white;
        }
        
        .stage-icon.not-applicable {
          background-color: #2196f3; /* Blue background for N/A */
          color: white;
        }
        
        .stage-column-cell {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default DraftList;