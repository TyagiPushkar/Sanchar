"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import * as XLSX from "xlsx"

function FullReport() {
  const [transactions, setTransactions] = useState([])
  const [statusData, setStatusData] = useState([])
  const [loaData, setLoaData] = useState([]) // New state for menuId=1 data
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions data (menuId=8)
        const transactionsResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=8",
        )

        // Fetch status data (menuId=10)
        const statusResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=10",
        )

        // Fetch LOA data (menuId=1) - NEW
        const loaResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=1",
        )

        if (transactionsResponse.data.success && statusResponse.data.success && loaResponse.data.success) {
          setTransactions(transactionsResponse.data.data)
          setFilteredRecords(transactionsResponse.data.data)
          setStatusData(statusResponse.data.data)
          setLoaData(loaResponse.data.data) // Set LOA data
        } else {
          setError("Failed to fetch data from one or more sources.")
        }
      } catch (err) {
        setError("Failed to connect to the server.")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter records based on search term and status filter
  useEffect(() => {
    const filtered = transactions.filter((transaction) => {
      const loaNumber = getTransactionValue(transaction, "574")
      const matchesSearch = loaNumber.toLowerCase().includes(searchTerm.toLowerCase())

      if (statusFilter === "all") return matchesSearch

      const status = getProjectStatus(loaNumber)
      return matchesSearch && status === statusFilter
    })

    setFilteredRecords(filtered)
    setPage(0) // Reset to first page when filters change
  }, [transactions, searchTerm, statusFilter])

  // Get value from transaction details by checkpoint ID
  const getTransactionValue = (transaction, checkpointId) => {
    if (!transaction || !transaction.Details) return "-"
    const detail = transaction.Details.find((d) => d.ChkId === checkpointId)
    return detail ? detail.Value : "-"
  }

  // Get value from status data for a specific LOA and checkpoint
  const getStatusValue = (loaNumber, checkpointId) => {
    const statusRecord = statusData.find((record) => getTransactionValue(record, "589") === loaNumber)
    return getTransactionValue(statusRecord, checkpointId)
  }

  // NEW: Get value from LOA data (menuId=1) for a specific LOA and checkpoint
  const getLoaValue = (loaNumber, checkpointId) => {
    const loaRecord = loaData.find((record) => getTransactionValue(record, "60") === loaNumber)
    return getTransactionValue(loaRecord, checkpointId)
  }

  // Calculate pending invoice amount for a given LOA
  const calculatePendingAmount = (loaNumber) => {
    const statusRecord = statusData.find((record) => getTransactionValue(record, "589") === loaNumber)

    if (!statusRecord) return 0

    // Invoice amount checkpoint IDs
    const amountCheckpoints = ["596", "606", "616", "626"]
    // Payment status checkpoint IDs
    const statusCheckpoints = ["597", "607", "617", "627"]

    let totalPending = 0

    amountCheckpoints.forEach((amountCp, index) => {
      const amount = Number.parseFloat(getTransactionValue(statusRecord, amountCp)) || 0
      const status = getTransactionValue(statusRecord, statusCheckpoints[index])

      if (status !== "Done") {
        totalPending += amount
      }
    })

    return totalPending
  }

  // Determine project status based on the conditions
  const getProjectStatus = (loaNumber) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the corresponding status record for this LOA
    const statusRecord = statusData.find((record) => getTransactionValue(record, "589") === loaNumber)

    if (!statusRecord) return "-"

    // Get all required dates
    const warrantyEndDate = getDateFromValue(getTransactionValue(statusRecord, "592"))
    const installationDate = getDateFromValue(getTransactionValue(statusRecord, "593"))
    const completionDate = getDateFromValue(getTransactionValue(statusRecord, "625"))

    // Check completion first
    if (completionDate && completionDate <= today) {
      return "Complete"
    }

    if (warrantyEndDate && warrantyEndDate > today) {
      return "Under Warranty"
    }

    // Check installation
    if (installationDate && installationDate > today) {
      return "Under Installation"
    }

    // If installation date passed and warranty expired
    if ((!installationDate || installationDate <= today) && (!warrantyEndDate || warrantyEndDate <= today)) {
      return "AMC Work"
    }

    return "-"
  }

  // Helper function to convert value to Date object
  const getDateFromValue = (value) => {
    if (!value) return null

    // Try different date formats
    const dateFormats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    ]

    for (const format of dateFormats) {
      const match = value.match(format)
      if (match) {
        if (format === dateFormats[0]) {
          // DD/MM/YYYY
          const day = Number.parseInt(match[1], 10)
          const month = Number.parseInt(match[2], 10) - 1
          const year = Number.parseInt(match[3], 10)
          return new Date(year, month, day)
        } else {
          // YYYY-MM-DD
          const year = Number.parseInt(match[1], 10)
          const month = Number.parseInt(match[2], 10) - 1
          const day = Number.parseInt(match[3], 10)
          return new Date(year, month, day)
        }
      }
    }

    return null
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  const handleChangePage = (newPage) => setPage(newPage)

  // Calculate totals for transmitter and receiver quantities
  const calculateTotals = () => {
    let transmitterTotal = 0
    let receiverTotal = 0

    filteredRecords.forEach((record) => {
      const txQty = Number.parseFloat(getTransactionValue(record, "575")) || 0
      const rxQty = Number.parseFloat(getTransactionValue(record, "576")) || 0

      transmitterTotal += txQty
      receiverTotal += rxQty
    })

    return { transmitterTotal, receiverTotal }
  }

  const calculateWarrantyPeriod = (loaNumber) => {
  const statusRecord = statusData.find((record) => getTransactionValue(record, "589") === loaNumber)

  if (!statusRecord) return "-"

  const startDate = getDateFromValue(getStatusValue(loaNumber, "591"))
  const endDate = getDateFromValue(getStatusValue(loaNumber, "592"))

  if (!startDate || !endDate) return "-"

  // Calculate difference in months
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12
  months -= startDate.getMonth()
  months += endDate.getMonth()

  // If end day is earlier than start day, subtract one month
  if (endDate.getDate() < startDate.getDate()) {
    months--
  }

  // Handle edge case: if it's exactly 11 months but spans a full year period
  // (e.g., 1st Sep 2024 to 31st Aug 2025 should be considered as 1 year)
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
  const isFullYear = daysDiff >= 365 && daysDiff <= 366

  if (isFullYear && months === 11) {
    months = 12
  }

  // Calculate years and remaining months
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  // Format the result
  if (years === 0 && remainingMonths === 0) {
    return "Nil"
  } else if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? "s" : ""}`
  } else {
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
  }
}

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredRecords.map((record) => {
      const loaNumber = getTransactionValue(record, "574")
      return {
        "LOA Number": loaNumber,
        "LOA Date": getLoaValue(loaNumber, "126"), // NEW
        "LOA File No.": getLoaValue(loaNumber, "651"), // NEW
        "Tender No.": getLoaValue(loaNumber, "4"), // NEW
        "Value Of Order": getLoaValue(loaNumber, "72"), // UPDATED
        "WPC Work": getLoaValue(loaNumber, "69"), // UPDATED
        "Transmitter QTY": getLoaValue(loaNumber, "61"), // UPDATED
        "RX Receiver QTY": getLoaValue(loaNumber, "63"), // UPDATED
        "Date Of Work Start": getTransactionValue(record, "649"),
        "Project Status": getProjectStatus(loaNumber),
        "Handover Date of System": getStatusValue(loaNumber, "590"),
        "Warranty Period": calculateWarrantyPeriod(loaNumber),
        "Total Amount":
          Number(getStatusValue(loaNumber, "596")) +
          Number(getStatusValue(loaNumber, "606")) +
          Number(getStatusValue(loaNumber, "616")) +
          Number(getStatusValue(loaNumber, "626")),
        "Payment Status": getStatusValue(loaNumber, "627"),
        "Billing Cycle": getStatusValue(loaNumber, "594"),
        "Amount Per Cycle": getStatusValue(loaNumber, "596"),
        "Pending Invoice Amount": calculatePendingAmount(loaNumber),
        "First ARC Start Date": getStatusValue(loaNumber, "595"),
        "First Bill No.": getStatusValue(loaNumber, "601"),
        "First Bill Date": getStatusValue(loaNumber, "602"),
        "First Amount": getStatusValue(loaNumber, "596"),
        "First Payment Status Remarks": getStatusValue(loaNumber, "604"),
        "Second ARC Start Date": getStatusValue(loaNumber, "605"),
        "Second Bill No.": getStatusValue(loaNumber, "611"),
        "Second Bill Date": getStatusValue(loaNumber, "612"),
        "Second Amount": getStatusValue(loaNumber, "606"),
        "Second Payment Status Remarks": getStatusValue(loaNumber, "614"),
        "Third ARC Start Date": getStatusValue(loaNumber, "615"),
        "Third Bill No.": getStatusValue(loaNumber, "621"),
        "Third Bill Date": getStatusValue(loaNumber, "622"),
        "Third Amount": getStatusValue(loaNumber, "616"),
        "Third Payment Status Remarks": getStatusValue(loaNumber, "624"),
        "Fourth ARC Start Date": getStatusValue(loaNumber, "625"),
        "Fourth Bill No.": getStatusValue(loaNumber, "631"),
        "Fourth Bill Date": getStatusValue(loaNumber, "632"),
        "Fourth Amount": getStatusValue(loaNumber, "626"),
        "Fourth Payment Status Remarks": getStatusValue(loaNumber, "634"),
      }
    })

    // Add totals row
    const { transmitterTotal, receiverTotal } = calculateTotals()
    exportData.push({
      "LOA Number": "TOTAL",
      "LOA Date": "", // NEW
      "LOA File No.": "", // NEW
      "Tender No.": "", // NEW
      "Value Of Order": "", // UPDATED
      "WPC Work": "", // UPDATED
      "Transmitter QTY": transmitterTotal, // UPDATED
      "RX Receiver QTY": receiverTotal, // UPDATED
      "Date Of Work Start": "",
      "Project Status": "",
      "Handover Date of System": "",
      "Warranty Period": "",
      "Total Amount": "",
      "Payment Status": "",
      "Billing Cycle": "",
      "Amount Per Cycle": "",
      "Pending Invoice Amount": "",
      "First ARC Start Date": "",
      "First Bill No.": "",
      "First Bill Date": "",
      "First Amount": "",
      "First Payment Status Remarks": "",
      "Second ARC Start Date": "",
      "Second Bill No.": "",
      "Second Bill Date": "",
      "Second Amount": "",
      "Second Payment Status Remarks": "",
      "Third ARC Start Date": "",
      "Third Bill No.": "",
      "Third Bill Date": "",
      "Third Amount": "",
      "Third Payment Status Remarks": "",
      "Fourth ARC Start Date": "",
      "Fourth Bill No.": "",
      "Fourth Bill Date": "",
      "Fourth Amount": "",
      "Fourth Payment Status Remarks": "",
    })

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const colWidths = Array(38).fill({ wch: 15 }) // Updated to 38 columns
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Full Report")

    // Generate filename with current date
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0]
    const filename = `Full_Report_${dateStr}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
  }

  const { transmitterTotal, receiverTotal } = calculateTotals()
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage)
  const startIndex = page * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading materials...</p>
      </div>
    )
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
            <select value={statusFilter} onChange={handleStatusFilterChange} className="status-filter">
              <option value="all">All Statuses</option>
              <option value="Under Warranty">Under Warranty</option>
              <option value="AMC Work">AMC Work</option>
              <option value="Under Installation">Under Installation</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

          <button
            onClick={exportToExcel}
            className="action-button"
            style={{ backgroundColor: "#F69320" }}
            title="Export to Excel"
          >
            📊 Export to Excel
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <table className="material-table" style={{ border: "1px solid #ddd" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>LOA Number</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>LOA Date</th> {/* NEW */}
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>LOA File No.</th> {/* NEW */}
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Tender No.</th> {/* NEW */}
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Value Of Order</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>WPC Work</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Transmitter QTY</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>RX Receiver QTY</th>
              <th style={{ border: "1px solid #ddd", minWidth: "140px" }}>Date Of Work Start</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Project Status</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>e-MB Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Warranty Period</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Good Bill Raised Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Goods Bill Invoice No.</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Invoice Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Payment Status</th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>Billing Cycle</th>
              <th style={{ border: "1px solid #ddd", minWidth: "140px" }}>Amount Per Cycle</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>Pending Invoice Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>First AMC Start Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill No.</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>Payment Status Remarks</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>Second AMC Start Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill No.</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>Payment Status Remarks</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>Third AMC Start Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill No.</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>Payment Status Remarks</th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>Fourth AMC Start Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill No.</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Bill Date</th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>Amount</th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>Payment Status Remarks</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => {
                const loaNumber = getTransactionValue(record, "574")
                const statusRecord = statusData.find((record) => getTransactionValue(record, "589") === loaNumber)

                return (
                  <tr key={record.ActivityId}>
                    <td style={{ border: "1px solid #ddd" }}>{loaNumber}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "126")}</td> {/* NEW */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "651")}</td> {/* NEW */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "4")}</td> {/* NEW */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "72")}</td> {/* UPDATED */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "69")}</td> {/* UPDATED */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "61")}</td> {/* UPDATED */}
                    <td style={{ border: "1px solid #ddd" }}>{getLoaValue(loaNumber, "63")}</td> {/* UPDATED */}
                    <td style={{ border: "1px solid #ddd" }}>{getTransactionValue(record, "649")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getProjectStatus(loaNumber)}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "590")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{calculateWarrantyPeriod(loaNumber)}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "652")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "653")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "656")}</td>
                    {/* <td style={{ border: "1px solid #ddd" }}>
                      {Number(getStatusValue(loaNumber, "596")) +
                        Number(getStatusValue(loaNumber, "606")) +
                        Number(getStatusValue(loaNumber, "616")) +
                        Number(getStatusValue(loaNumber, "626"))}
                    </td> */}
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "627")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "594")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "596")}</td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {calculatePendingAmount(loaNumber).toLocaleString("en-IN")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "595")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "601")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "602")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "596")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "604")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "605")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "611")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "612")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "606")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "614")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "615")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "621")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "622")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "616")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "624")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "625")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "631")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "632")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "626")}</td>
                    <td style={{ border: "1px solid #ddd" }}>{getStatusValue(loaNumber, "634")}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={38} className="no-records" style={{ border: "1px solid #ddd" }}> {/* Updated to 38 columns */}
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-button" disabled={page === 0} onClick={() => handleChangePage(page - 1)}>
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
  )
}

export default FullReport