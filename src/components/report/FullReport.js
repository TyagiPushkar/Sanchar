"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import * as XLSX from "xlsx"

function FullReport() {
  const [transactions, setTransactions] = useState([])
  const [statusData, setStatusData] = useState([])
  const [loaData, setLoaData] = useState([]) // Primary data source
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

        // Fetch LOA data (menuId=1) - PRIMARY DATA SOURCE
        const loaResponse = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/menu/get_transaction.php?menuId=1",
        )

        if (transactionsResponse.data.success && statusResponse.data.success && loaResponse.data.success) {
          setTransactions(transactionsResponse.data.data)
          setStatusData(statusResponse.data.data)
          setLoaData(loaResponse.data.data)
          setFilteredRecords(loaResponse.data.data) // Set LOA data as filtered records
        } else {
          // setError("Failed to fetch data from one or more sources.")
          setTransactions(transactionsResponse.data.data)
          setStatusData(statusResponse.data.data)
          setLoaData(loaResponse.data.data)
          setFilteredRecords(loaResponse.data.data)
          setLoading(false)
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
    const filtered = loaData.filter((loaRecord) => {
      const loaNumber = getLoaValueDirect(loaRecord, "60") // Get LOA number directly from LOA data
      
      // Add null check for loaNumber
      if (!loaNumber || loaNumber === "-") return false
      
      const matchesSearch = loaNumber.toLowerCase().includes(searchTerm.toLowerCase())

      if (statusFilter === "all") return matchesSearch

      const status = getProjectStatus(loaNumber)
      return matchesSearch && status === statusFilter
    })

    setFilteredRecords(filtered)
    setPage(0) // Reset to first page when filters change
  }, [loaData, searchTerm, statusFilter])

  // Format date to dd-mm-yyyy
  const formatDate = (dateValue) => {
    if (!dateValue || dateValue === "-") return "-"
    
    const date = getDateFromValue(dateValue)
    if (!date) return "-"
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}-${month}-${year}`
  }

  // Get value directly from LOA record
  const getLoaValueDirect = (loaRecord, checkpointId) => {
    if (!loaRecord || !loaRecord.Details) return "-"
    const detail = loaRecord.Details.find((d) => d.ChkId === checkpointId)
    return detail ? detail.Value : "-"
  }

  // Get value from transaction details by checkpoint ID (for menuId=8 data)
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

  // Get value from LOA data for a specific LOA and checkpoint
  const getLoaValue = (loaNumber, checkpointId) => {
    const loaRecord = loaData.find((record) => getLoaValueDirect(record, "60") === loaNumber)
    return getLoaValueDirect(loaRecord, checkpointId)
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
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
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
        } else if (format === dateFormats[1]) {
          // YYYY-MM-DD
          const year = Number.parseInt(match[1], 10)
          const month = Number.parseInt(match[2], 10) - 1
          const day = Number.parseInt(match[3], 10)
          return new Date(year, month, day)
        } else if (format === dateFormats[2]) {
          // DD-MM-YYYY
          const day = Number.parseInt(match[1], 10)
          const month = Number.parseInt(match[2], 10) - 1
          const year = Number.parseInt(match[3], 10)
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

  // Calculate totals for ALL filtered records (not just current page)
  const calculateTotals = () => {
    let transmitterTotal = 0
    let receiverTotal = 0
    let totalAmount = 0
    let pendingInvoiceTotal = 0

    filteredRecords.forEach((record) => {
      const loaNumber = getLoaValueDirect(record, "60")
      const txQty = Number.parseFloat(getLoaValueDirect(record, "61")) || 0
      const rxQty = Number.parseFloat(getLoaValueDirect(record, "63")) || 0
      
      // Calculate total amount for this LOA
      const amount1 = Number.parseFloat(getStatusValue(loaNumber, "596")) || 0
      const amount2 = Number.parseFloat(getStatusValue(loaNumber, "606")) || 0
      const amount3 = Number.parseFloat(getStatusValue(loaNumber, "616")) || 0
      const amount4 = Number.parseFloat(getStatusValue(loaNumber, "626")) || 0
      
      transmitterTotal += txQty
      receiverTotal += rxQty
      totalAmount += (amount1 + amount2 + amount3 + amount4)
      pendingInvoiceTotal += calculatePendingAmount(loaNumber)
    })

    return { transmitterTotal, receiverTotal, totalAmount, pendingInvoiceTotal }
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
    // Prepare data for export - match exactly with table columns
    const exportData = filteredRecords.map((record) => {
      const loaNumber = getLoaValueDirect(record, "60");
      const goodsReceivedAmount = Number(getStatusValue(loaNumber, "656")) || 0;
      // Calculate amounts for difference columns
      const firstAmount = Number(getStatusValue(loaNumber, "596")) || 0;
      const firstReceived = Number(getStatusValue(loaNumber, "660")) || 0;
      const firstDifference = firstAmount - firstReceived;

      const secondAmount = Number(getStatusValue(loaNumber, "606")) || 0;
      const secondReceived = Number(getStatusValue(loaNumber, "663")) || 0;
      const secondDifference = secondAmount - secondReceived;

      const thirdAmount = Number(getStatusValue(loaNumber, "616")) || 0;
      const thirdReceived = Number(getStatusValue(loaNumber, "666")) || 0;
      const thirdDifference = thirdAmount - thirdReceived;

      const fourthAmount = Number(getStatusValue(loaNumber, "626")) || 0;
      const fourthReceived = Number(getStatusValue(loaNumber, "669")) || 0;
      const fourthDifference = fourthAmount - fourthReceived;

      // Calculate pending amount (similar to table column)
      const totalOrderValue = Number(getLoaValueDirect(record, "72")) || 0;
      const totalReceived =
        firstReceived + secondReceived + thirdReceived + fourthReceived;
      const pendingAmount =
        totalOrderValue - goodsReceivedAmount - totalReceived;

      return {
        "LOA Number": loaNumber,
        "LOA Date": formatDate(getLoaValueDirect(record, "126")),
        "LOA File No.": getLoaValueDirect(record, "651"),
        "Tender No.": getLoaValueDirect(record, "4"),
        "Value Of Order": getLoaValueDirect(record, "72"),
        "WPC Work": getLoaValueDirect(record, "69"),
        "Transmitter QTY": getLoaValueDirect(record, "61"),
        "RX Receiver QTY": getLoaValueDirect(record, "63"),
        "Pending Amount": pendingAmount,
        "Date Of Work Start": formatDate(getStatusValue(loaNumber, "649")),
        "Project Status": getProjectStatus(loaNumber),
        "e-MB Date": formatDate(getStatusValue(loaNumber, "590")),
        "Warranty Period": calculateWarrantyPeriod(loaNumber),
        "Good Bill Raised Date": formatDate(getStatusValue(loaNumber, "652")),
        "Goods Bill Invoice No.": getStatusValue(loaNumber, "653"),
        "Invoice Amount": getStatusValue(loaNumber, "656"),
        "Goods Bill Received Amount": getStatusValue(loaNumber, "657"),
        "Billing Cycle": getStatusValue(loaNumber, "594"),
        "Amount Per Cycle": getStatusValue(loaNumber, "596"),
        "Pending Invoice Amount": calculatePendingAmount(loaNumber),

        // First AMC Cycle
        "First AMC Start Date": formatDate(getStatusValue(loaNumber, "595")),
        "First Bill No.": getStatusValue(loaNumber, "601"),
        "First Bill Date": formatDate(getStatusValue(loaNumber, "602")),
        "First Invoice Amount": getStatusValue(loaNumber, "596"),
        "First Amount Received": getStatusValue(loaNumber, "660"),
        "First Amount Difference": firstDifference,
        "First Payment Status Remarks": getStatusValue(loaNumber, "604"),

        // Second AMC Cycle
        "Second AMC Start Date": formatDate(getStatusValue(loaNumber, "605")),
        "Second Bill No.": getStatusValue(loaNumber, "611"),
        "Second Bill Date": formatDate(getStatusValue(loaNumber, "612")),
        "Second Invoice Amount": getStatusValue(loaNumber, "606"),
        "Second Amount Received": getStatusValue(loaNumber, "663"),
        "Second Amount Difference": secondDifference,
        "Second Payment Status Remarks": getStatusValue(loaNumber, "614"),

        // Third AMC Cycle
        "Third AMC Start Date": formatDate(getStatusValue(loaNumber, "615")),
        "Third Bill No.": getStatusValue(loaNumber, "621"),
        "Third Bill Date": formatDate(getStatusValue(loaNumber, "622")),
        "Third Invoice Amount": getStatusValue(loaNumber, "616"),
        "Third Amount Received": getStatusValue(loaNumber, "666"),
        "Third Amount Difference": thirdDifference,
        "Third Payment Status Remarks": getStatusValue(loaNumber, "624"),

        // Fourth AMC Cycle
        "Fourth AMC Start Date": formatDate(getStatusValue(loaNumber, "625")),
        "Fourth Bill No.": getStatusValue(loaNumber, "631"),
        "Fourth Bill Date": formatDate(getStatusValue(loaNumber, "632")),
        "Fourth Invoice Amount": getStatusValue(loaNumber, "626"),
        "Fourth Amount Received": getStatusValue(loaNumber, "669"),
        "Fourth Amount Difference": fourthDifference,
        "Fourth Payment Status Remarks": getStatusValue(loaNumber, "634"),
      };
    });

    // Add totals row
    const {
      transmitterTotal,
      receiverTotal,
      totalAmount,
      pendingInvoiceTotal,
    } = calculateTotals();

    // Calculate total pending amount for all records
    const totalPendingAmount = filteredRecords.reduce((sum, record) => {
      const loaNumber = getLoaValueDirect(record, "60");
      const totalOrderValue = Number(getLoaValueDirect(record, "72")) || 0;
      const firstReceived = Number(getStatusValue(loaNumber, "660")) || 0;
      const secondReceived = Number(getStatusValue(loaNumber, "663")) || 0;
      const thirdReceived = Number(getStatusValue(loaNumber, "666")) || 0;
      const fourthReceived = Number(getStatusValue(loaNumber, "669")) || 0;
      const totalReceived =
        firstReceived + secondReceived + thirdReceived + fourthReceived;
      return sum + (totalOrderValue - totalReceived);
    }, 0);

    exportData.push({
      "LOA Number": "TOTAL",
      "LOA Date": "",
      "LOA File No.": "",
      "Tender No.": "",
      "Value Of Order": "",
      "WPC Work": "",
      "Transmitter QTY": transmitterTotal,
      "RX Receiver QTY": receiverTotal,
      "Pending Amount": totalPendingAmount,
      "Date Of Work Start": "",
      "Project Status": "",
      "e-MB Date": "",
      "Warranty Period": "",
      "Good Bill Raised Date": "",
      "Goods Bill Invoice No.": "",
      "Invoice Amount": "",
      "Goods Bill Received Amount": "",
      "Billing Cycle": "",
      "Amount Per Cycle": "",
      "Pending Invoice Amount": pendingInvoiceTotal,

      // First AMC Cycle totals
      "First AMC Start Date": "",
      "First Bill No.": "",
      "First Bill Date": "",
      "First Invoice Amount": "",
      "First Amount Received": "",
      "First Amount Difference": "",
      "First Payment Status Remarks": "",

      // Second AMC Cycle totals
      "Second AMC Start Date": "",
      "Second Bill No.": "",
      "Second Bill Date": "",
      "Second Invoice Amount": "",
      "Second Amount Received": "",
      "Second Amount Difference": "",
      "Second Payment Status Remarks": "",

      // Third AMC Cycle totals
      "Third AMC Start Date": "",
      "Third Bill No.": "",
      "Third Bill Date": "",
      "Third Invoice Amount": "",
      "Third Amount Received": "",
      "Third Amount Difference": "",
      "Third Payment Status Remarks": "",

      // Fourth AMC Cycle totals
      "Fourth AMC Start Date": "",
      "Fourth Bill No.": "",
      "Fourth Bill Date": "",
      "Fourth Invoice Amount": "",
      "Fourth Amount Received": "",
      "Fourth Amount Difference": "",
      "Fourth Payment Status Remarks": "",
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths - adjust based on the number of columns (now 38 columns)
    const colWidths = [
      { wch: 15 }, // LOA Number
      { wch: 12 }, // LOA Date
      { wch: 15 }, // LOA File No.
      { wch: 15 }, // Tender No.
      { wch: 15 }, // Value Of Order
      { wch: 12 }, // WPC Work
      { wch: 15 }, // Transmitter QTY
      { wch: 15 }, // RX Receiver QTY
      { wch: 15 }, // Pending Amount
      { wch: 15 }, // Date Of Work Start
      { wch: 15 }, // Project Status
      { wch: 12 }, // e-MB Date
      { wch: 15 }, // Warranty Period
      { wch: 18 }, // Good Bill Raised Date
      { wch: 20 }, // Goods Bill Invoice No.
      { wch: 15 }, // Invoice Amount
      { wch: 12 }, // Billing Cycle
      { wch: 15 }, // Amount Per Cycle
      { wch: 20 }, // Pending Invoice Amount

      // First AMC Cycle (7 columns)
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },

      // Second AMC Cycle (7 columns)
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },

      // Third AMC Cycle (7 columns)
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },

      // Fourth AMC Cycle (7 columns)
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
    ];

    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Full Report");

    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const filename = `Full_Report_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const { transmitterTotal, receiverTotal, totalAmount, pendingInvoiceTotal } =
    calculateTotals();
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

      <div
        className="table-container"
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <table className="material-table" style={{ border: "1px solid #ddd" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                LOA Number
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                LOA Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                LOA File No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Tender No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Value Of Order
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                WPC Work
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Transmitter QTY
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                RX Receiver QTY
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Pending Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "140px" }}>
                Date Of Work Start
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Project Status
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                e-MB Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Warranty Period
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Good Bill Raised Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Goods Bill Invoice No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Goods Bill Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Goods Bill Received Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "120px" }}>
                Billing Cycle
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "140px" }}>
                Amount Per Cycle
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                Pending Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                First AMC Start Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Received
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Diffrence
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>
                Payment Status Remarks
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                Second AMC Start Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Received
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Diffrence
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>
                Payment Status Remarks
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                Third AMC Start Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Received
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Diffrence
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>
                Payment Status Remarks
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "160px" }}>
                Fourth AMC Start Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill No.
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Bill Date
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Invoice Amount
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Received
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "100px" }}>
                Amount Diffrence
              </th>
              <th style={{ border: "1px solid #ddd", minWidth: "180px" }}>
                Payment Status Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record) => {
                const loaNumber = getLoaValueDirect(record, "60");
                const correspondingTransaction = transactions.find(
                  (t) => getTransactionValue(t, "574") === loaNumber,
                );

                return (
                  <tr key={record.ActivityId}>
                    <td style={{ border: "1px solid #ddd" }}>{loaNumber}</td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getLoaValueDirect(record, "126"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "651")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "4")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "72")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "69")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "61")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "63")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getLoaValueDirect(record, "72") -
                        getStatusValue(loaNumber, "656") -
                        getStatusValue(loaNumber, "660") -
                        getStatusValue(loaNumber, "663") -
                        getStatusValue(loaNumber, "666") -
                        getStatusValue(loaNumber, "669")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "649"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getProjectStatus(loaNumber)}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "590"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {calculateWarrantyPeriod(loaNumber)}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "652"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "653")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "656")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "657")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "594")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "596")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {calculatePendingAmount(loaNumber).toLocaleString(
                        "en-IN",
                      )}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "595"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "601")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "602"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "596")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "660")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "596") -
                        getStatusValue(loaNumber, "660")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "604")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "605"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "611")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "612"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "606")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "663")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "606") -
                        getStatusValue(loaNumber, "663")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "614")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "615"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "621")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "622"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "616")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "666")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "616") -
                        getStatusValue(loaNumber, "666")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "624")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "625"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "631")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {formatDate(getStatusValue(loaNumber, "632"))}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "626")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "669")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "626") -
                        getStatusValue(loaNumber, "669")}
                    </td>
                    <td style={{ border: "1px solid #ddd" }}>
                      {getStatusValue(loaNumber, "634")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={38}
                  className="no-records"
                  style={{ border: "1px solid #ddd" }}
                >
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

export default FullReport