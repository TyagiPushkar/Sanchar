import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Pagination,
  InputAdornment,
  Stack,
  Alert,
  IconButton,
  Popover,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Search,
  Add,
  Visibility,
  FilterList,
  Clear,
  GetApp,
  DateRange,
  Upload,
  CloudUpload,
  Download,
  CheckCircle,
  Error,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../auth/AuthContext";
import PMTicketCreate from "./PMTicketCreate";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const PMWorkList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Bulk task states
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkError, setBulkError] = useState("");
  const [bulkPreview, setBulkPreview] = useState([]);

  // Date range filter state
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  // Column filter states
  const [columnFilters, setColumnFilters] = useState({
    LOA: "",
    EmpName: "",
    Section: "",
    Station: "",
    Status: "",
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [currentFilterColumn, setCurrentFilterColumn] = useState("");

  const rowsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, columnFilters, dateRange]);

  // Calculate status counts for ALL tickets
  const allStatusCounts = useMemo(() => {
    const counts = {
      total: tickets.length,
      assigned: 0,
      complete: 0,
      closed: 0,
      wip: 0,
      "in progress": 0,
    };

    tickets.forEach((ticket) => {
      const status = ticket.Status?.toLowerCase();
      switch (status) {
        case "assigned":
          counts.assigned++;
          break;
        case "complete":
          counts.complete++;
          break;
        case "closed":
          counts.closed++;
          break;
        case "wip":
          counts.wip++;
          break;
        case "in progress":
          counts["in progress"]++;
          break;
      }
    });

    return counts;
  }, [tickets]);

  // Calculate status counts for FILTERED tickets
  const filteredStatusCounts = useMemo(() => {
    const counts = {
      total: filtered.length,
      assigned: 0,
      complete: 0,
      closed: 0,
      wip: 0,
      "in progress": 0,
    };

    filtered.forEach((ticket) => {
      const status = ticket.Status?.toLowerCase();
      switch (status) {
        case "assigned":
          counts.assigned++;
          break;
        case "complete":
          counts.complete++;
          break;
        case "closed":
          counts.closed++;
          break;
        case "wip":
          counts.wip++;
          break;
        case "in progress":
          counts["in progress"]++;
          break;
      }
    });

    return counts;
  }, [filtered]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/pm/get_tickets.php",
      );
      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
      } else {
        setTickets([]);
        setError("No Ticket found");
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Network error occurred while fetching tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredTickets = [...tickets];

    // Apply global search
    if (searchTerm) {
      filteredTickets = filteredTickets.filter(
        (ticket) =>
          ticket.Station?.toLowerCase().includes(searchTerm) ||
          ticket.EmpName?.toLowerCase().includes(searchTerm) ||
          ticket.ContactPerson?.toLowerCase().includes(searchTerm),
      );
    }

    // Apply column filters
    Object.keys(columnFilters).forEach((column) => {
      const filterValue = columnFilters[column];
      if (filterValue) {
        filteredTickets = filteredTickets.filter((ticket) =>
          String(ticket[column] || "")
            .toLowerCase()
            .includes(filterValue.toLowerCase()),
        );
      }
    });

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filteredTickets = filteredTickets.filter((ticket) => {
        const ticketDate = new Date(ticket.Date);
        ticketDate.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return ticketDate >= fromDate && ticketDate <= toDate;
        } else if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return ticketDate >= fromDate;
        } else if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return ticketDate <= toDate;
        }
        return true;
      });
    }

    setFiltered(filteredTickets);
    setPage(1);
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const clearColumnFilter = (column) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: "",
    }));
  };

  const clearDateFilter = () => {
    setDateRange({ from: null, to: null });
  };

  const clearAllFilters = () => {
    setColumnFilters({
      LOA: "",
      EmpName: "",
      Section: "",
      Station: "",
      Status: "",
    });
    setSearchTerm("");
    setDateRange({ from: null, to: null });
  };

  const handleFilterClick = (event, column) => {
    setFilterAnchorEl(event.currentTarget);
    setCurrentFilterColumn(column);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setCurrentFilterColumn("");
  };

  const handleViewTicket = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleTicketCreated = () => {
    fetchTickets();
    setIsCreateDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "complete":
      case "completed":
        return "primary";
      case "in progress":
        return "warning";
      case "closed":
        return "success";
      case "wip":
        return "error";
      case "assigned":
        return "info";
      default:
        return "default";
    }
  };

  // Get unique values for dropdown filters
  const getUniqueValues = (column) => {
    const values = [
      ...new Set(tickets.map((ticket) => ticket[column]).filter(Boolean)),
    ];
    return values.sort();
  };

  // Export to Excel function
  const exportToExcel = () => {
    setExportLoading(true);

    try {
      const exportData = filtered.map((ticket) => ({
        "Ticket ID": ticket.Id,
        LOA: ticket.LOA,
        Technician: ticket.EmpName,
        Section: ticket.Section,
        Station: ticket.Station,
        Status: ticket.Status,
        "Assign Date": new Date(ticket.Date).toLocaleDateString("en-GB"),
        "Visit Date":
          ticket.Date == ticket.UpdateDateTime
            ? ""
            : new Date(ticket.UpdateDateTime).toLocaleDateString("en-GB"),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "PM Work Tickets");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `pm_work_tickets_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data to Excel");
    } finally {
      setExportLoading(false);
    }
  };

  // Export all data to Excel (ignoring filters)
  const exportAllToExcel = () => {
    setExportLoading(true);

    try {
      const exportData = tickets.map((ticket) => ({
        "Ticket ID": ticket.Id,
        LOA: ticket.LOA,
        Technician: ticket.EmpName,
        Section: ticket.Section,
        Station: ticket.Station,
        Status: ticket.Status,
        "Assign Date": new Date(ticket.Date).toLocaleDateString("en-GB"),
        "Visit Date":
          ticket.Date == ticket.UpdateDateTime
            ? ""
            : new Date(ticket.UpdateDateTime).toLocaleDateString("en-GB"),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "All PM Work Tickets");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `all_pm_work_tickets_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data to Excel");
    } finally {
      setExportLoading(false);
    }
  };

  // Parse Excel file to JSON
  const parseExcelToJSON = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // Map the Excel columns to the required format
          const tasks = jsonData.map((row, index) => ({
            LOA: row["LOA"]?.toString().trim() || "",
            Section: row["Section"]?.toString().trim() || "",
            Station: row["Station"]?.toString().trim() || "",
            EmpId: row["EmpId"]?.toString().trim() || "",
            EmpName: row["EmpName"]?.toString().trim() || "",
            Remark: row["Remark"]?.toString().trim() || "",
            ContactPerson: row["ContactPerson"]?.toString().trim() || "",
            ContactNumber: row["ContactNumber"]?.toString().trim() || "",
          }));

          resolve(tasks);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Validate task data
  const validateTaskData = (tasks) => {
    const errors = [];
    const validTasks = [];

    tasks.forEach((task, index) => {
      const rowNum = index + 2; // +2 because Excel row numbers start at 1 and header is row 1
      const rowErrors = [];

      if (!task.LOA) {
        rowErrors.push("LOA is required");
      }
      if (!task.Section) {
        rowErrors.push("Section is required");
      }
      if (!task.Station) {
        rowErrors.push("Station is required");
      }
      if (!task.EmpId) {
        rowErrors.push("EmpId is required");
      }
      if (!task.EmpName) {
        rowErrors.push("EmpName is required");
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNum}: ${rowErrors.join(", ")}`);
      } else {
        validTasks.push(task);
      }
    });

    return { validTasks, errors };
  };

  // Download sample Excel for bulk tasks
  const downloadSampleBulkExcel = () => {
    try {
      const sampleData = [
        {
          LOA: "LOA-001",
          Section: "North Division",
          Station: "Central Station",
          EmpId: "EMP001",
          EmpName: "Rahul Sharma",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData);

      const colWidths = [
        { wch: 15 }, // LOA
        { wch: 20 }, // Section
        { wch: 25 }, // Station
        { wch: 15 }, // EmpId
        { wch: 20 }, // EmpName
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Sample Bulk Tasks");
      XLSX.writeFile(wb, "sample_bulk_pm_tasks.xlsx");
    } catch (error) {
      console.error("Error downloading sample:", error);
      setError("Failed to download sample file");
    }
  };

  // Handle file selection for bulk upload
  const handleBulkFileChange = async (event) => {
    const file = event.target.files[0];
    setBulkFile(file);
    setBulkError("");
    setBulkResults(null);

    // Preview the data
    if (file) {
      try {
        const tasks = await parseExcelToJSON(file);
        setBulkPreview(tasks.slice(0, 5)); // Show first 5 rows as preview
      } catch (error) {
        console.error("Error parsing file for preview:", error);
        setBulkError("Error reading file. Please check the format.");
      }
    } else {
      setBulkPreview([]);
    }
  };

  // Upload bulk tasks
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      setBulkError("Please select a file to upload");
      return;
    }

    setBulkUploading(true);
    setBulkProgress(0);
    setBulkError("");
    setBulkResults(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setBulkProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Parse Excel file to JSON
      const tasks = await parseExcelToJSON(bulkFile);

      if (tasks.length === 0) {
        throw new Error("No data found in the Excel file");
      }

      // Validate the data
      const { validTasks, errors } = validateTaskData(tasks);

      if (validTasks.length === 0) {
        throw new Error("No valid tasks found. Please check the errors below.");
      }

      // Prepare the payload as per API requirement
      const payload = { tasks: validTasks };

      // Send JSON data to API
      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/pm/bulk_pm_create.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      clearInterval(progressInterval);
      setBulkProgress(100);

      const data = await response.json();

      if (data.success) {
        setBulkResults({
          success: validTasks.length - errors.length,
          failed: errors.length,
          total: tasks.length,
          errors: errors,
          apiErrors: data.errors || [],
        });
        // Refresh tickets list after successful bulk upload
        fetchTickets();

        // Clear preview after successful upload
        setBulkPreview([]);
        setBulkFile(null);
      } else {
        setBulkError(data.message || "Failed to create bulk tasks");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error in bulk upload:", error);
      setBulkError(error.message || "Error processing file or uploading tasks");
    } finally {
      setBulkUploading(false);
    }
  };

  // Close bulk dialog and reset states
  const handleCloseBulkDialog = () => {
    setIsBulkDialogOpen(false);
    setBulkFile(null);
    setBulkUploading(false);
    setBulkProgress(0);
    setBulkResults(null);
    setBulkError("");
    setBulkPreview([]);
  };

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTickets = filtered.slice(startIndex, endIndex);

  const hasActiveFilters =
    Object.values(columnFilters).some((filter) => filter !== "") ||
    searchTerm !== "" ||
    dateRange.from !== null ||
    dateRange.to !== null;
  const hasFilteredData = filtered.length > 0;
  const hasAnyData = tickets.length > 0;

  // Use filtered counts when there are active filters, otherwise use all counts
  const displayCounts = hasActiveFilters
    ? filteredStatusCounts
    : allStatusCounts;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            PM Work List
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ minWidth: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              placeholder="Search by Station, Technician"
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <DatePicker
                label="From Date"
                value={dateRange.from}
                onChange={(newValue) =>
                  setDateRange((prev) => ({ ...prev, from: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: 140 }} />
                )}
                maxDate={dateRange.to || undefined}
              />
              <DatePicker
                label="To Date"
                value={dateRange.to}
                onChange={(newValue) =>
                  setDateRange((prev) => ({ ...prev, to: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: 140 }} />
                )}
                minDate={dateRange.from || undefined}
              />
              {(dateRange.from || dateRange.to) && (
                <IconButton
                  size="small"
                  onClick={clearDateFilter}
                  sx={{ color: "text.secondary" }}
                >
                  <Clear />
                </IconButton>
              )}
            </Box>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearAllFilters}
                sx={{ whiteSpace: "nowrap" }}
              >
                Clear Filters
              </Button>
            )}

            {hasAnyData && (
              <Button
                variant="outlined"
                onClick={exportToExcel}
                disabled={exportLoading || !hasFilteredData}
                startIcon={<GetApp />}
                sx={{ whiteSpace: "nowrap" }}
              >
                Export
              </Button>
            )}

            {/* Bulk Task Button */}
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => setIsBulkDialogOpen(true)}
              sx={{ whiteSpace: "nowrap" }}
            >
              Bulk Task
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{
                whiteSpace: "nowrap",
                backgroundColor: "#F69320",
                color: "#fff",
                "&:hover": { backgroundColor: "#F69320" },
              }}
            >
              New Ticket
            </Button>
          </Stack>
        </Box>

        {/* Export All Button - Only show when there are active filters */}
        {hasActiveFilters && hasAnyData && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={exportAllToExcel}
              disabled={exportLoading}
              startIcon={<GetApp />}
              size="small"
            >
              Export All Data ({tickets.length} records)
            </Button>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="text.secondary">Loading tickets...</Typography>
          </Box>
        ) : (
          <>
            {/* Table */}
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ mb: 3, maxHeight: "69vh", overflow: "auto" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F69320", color: "#fff" }}>
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <strong>ID</strong>
                    </TableCell>

                    {/* LOA Column with Filter */}
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <strong>LOA</strong>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={(e) => handleFilterClick(e, "LOA")}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                        {columnFilters.LOA && (
                          <Chip
                            label={columnFilters.LOA}
                            size="small"
                            onDelete={() => clearColumnFilter("LOA")}
                            sx={{ backgroundColor: "#fff", color: "#F69320" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Technician Column with Filter */}
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <strong>Technician</strong>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={(e) => handleFilterClick(e, "EmpName")}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                        {columnFilters.EmpName && (
                          <Chip
                            label={columnFilters.EmpName}
                            size="small"
                            onDelete={() => clearColumnFilter("EmpName")}
                            sx={{ backgroundColor: "#fff", color: "#F69320" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Section Column with Filter */}
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <strong>Section</strong>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={(e) => handleFilterClick(e, "Section")}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                        {columnFilters.Section && (
                          <Chip
                            label={columnFilters.Section}
                            size="small"
                            onDelete={() => clearColumnFilter("Section")}
                            sx={{ backgroundColor: "#fff", color: "#F69320" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Station Column with Filter */}
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <strong>Station</strong>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={(e) => handleFilterClick(e, "Station")}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                        {columnFilters.Station && (
                          <Chip
                            label={columnFilters.Station}
                            size="small"
                            onDelete={() => clearColumnFilter("Station")}
                            sx={{ backgroundColor: "#fff", color: "#F69320" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Status Column with Filter */}
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <strong>Status</strong>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={(e) => handleFilterClick(e, "Status")}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                        {columnFilters.Status && (
                          <Chip
                            label={columnFilters.Status}
                            size="small"
                            onDelete={() => clearColumnFilter("Status")}
                            sx={{ backgroundColor: "#fff", color: "#F69320" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <strong>Assign Date</strong>
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", backgroundColor: "#F69320" }}
                    >
                      <strong>Visit Date</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTickets.length > 0 ? (
                    paginatedTickets.map((ticket) => (
                      <TableRow key={ticket.Id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {ticket.Id}
                          </Typography>
                        </TableCell>
                        <TableCell
                          onClick={() => handleViewTicket(ticket.Id)}
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              color: "#4020f6ff",
                            },
                          }}
                        >
                          {ticket.LOA}
                        </TableCell>
                        <TableCell>{ticket.EmpName}</TableCell>
                        <TableCell>{ticket.Section}</TableCell>
                        <TableCell>{ticket.Station}</TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.Status}
                            color={getStatusColor(ticket.Status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.Date).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>
                          {ticket.Date == ticket.UpdateDateTime
                            ? ""
                            : new Date(
                                ticket.UpdateDateTime,
                              ).toLocaleDateString("en-GB")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No tickets found.{" "}
                          {hasActiveFilters && "Try clearing some filters."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Filter Popover */}
            <Popover
              open={Boolean(filterAnchorEl)}
              anchorEl={filterAnchorEl}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <Box sx={{ p: 2, minWidth: 200 }}>
                {currentFilterColumn === "Status" ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Status</InputLabel>
                    <Select
                      value={columnFilters.Status}
                      label="Select Status"
                      onChange={(e) =>
                        handleColumnFilterChange("Status", e.target.value)
                      }
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      {getUniqueValues("Status").map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label={`Filter ${currentFilterColumn}`}
                    value={columnFilters[currentFilterColumn] || ""}
                    onChange={(e) =>
                      handleColumnFilterChange(
                        currentFilterColumn,
                        e.target.value,
                      )
                    }
                    size="small"
                    fullWidth
                    autoFocus
                  />
                )}
              </Box>
            </Popover>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filtered.length)} of {filtered.length}{" "}
                  tickets
                  {hasActiveFilters &&
                    ` (Filtered from ${tickets.length} total)`}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Create Ticket Dialog */}
        <PMTicketCreate
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onTicketCreated={handleTicketCreated}
        />

        {/* Bulk Task Dialog */}
        <Dialog
          open={isBulkDialogOpen}
          onClose={handleCloseBulkDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CloudUpload sx={{ color: "#F69320" }} />
              <Typography variant="h6">Bulk Create PM Tasks</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {/* Sample Download Section */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: "#f5f5f5" }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Step 1: Download Sample Template
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadSampleBulkExcel}
                  size="small"
                >
                  Download Sample Excel
                </Button>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Step 2: Upload Your Excel File
                </Typography>

                <Box
                  sx={{
                    border: "2px dashed #ccc",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    bgcolor: "#fafafa",
                    mb: 2,
                  }}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkFileChange}
                    style={{ display: "none" }}
                    id="bulk-file-upload"
                  />
                  <label htmlFor="bulk-file-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<Upload />}
                      sx={{ mb: 2 }}
                    >
                      Choose File
                    </Button>
                  </label>

                  {bulkFile && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={bulkFile.name}
                        onDelete={() => setBulkFile(null)}
                        color="primary"
                        variant="outlined"
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        Size: {(bulkFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Data Preview */}
                {bulkPreview.length > 0 && !bulkResults && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview (First {bulkPreview.length} rows):
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1, maxHeight: 150, overflow: "auto" }}
                    >
                      <List dense>
                        {bulkPreview.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`${item.LOA} - ${item.EmpName} (${item.Station})`}
                              secondary={`Section: ${item.Section}, EmpId: ${item.EmpId}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Box>
                )}

                {/* Upload Progress */}
                {bulkUploading && (
                  <Box sx={{ width: "100%", mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={bulkProgress}
                    />
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Processing... {bulkProgress}%
                    </Typography>
                  </Box>
                )}

                {/* Error Message */}
                {bulkError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {bulkError}
                  </Alert>
                )}

                {/* Results Section */}
                {bulkResults && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      fontWeight="bold"
                    >
                      Upload Results
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Card variant="outlined" sx={{ bgcolor: "#e8f5e8" }}>
                          <CardContent>
                            <Typography variant="h6" color="success.main">
                              {bulkResults.success || 0}
                            </Typography>
                            <Typography variant="body2">Successful</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card variant="outlined" sx={{ bgcolor: "#ffebee" }}>
                          <CardContent>
                            <Typography variant="h6" color="error.main">
                              {bulkResults.failed || 0}
                            </Typography>
                            <Typography variant="body2">Failed</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card variant="outlined" sx={{ bgcolor: "#fff3e0" }}>
                          <CardContent>
                            <Typography variant="h6" color="warning.main">
                              {bulkResults.total || 0}
                            </Typography>
                            <Typography variant="body2">Total</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Validation Errors */}
                    {bulkResults.errors && bulkResults.errors.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{ mt: 2, color: "error.main" }}
                        >
                          Validation Errors:
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{ maxHeight: 200, overflow: "auto", p: 1 }}
                        >
                          <List dense>
                            {bulkResults.errors.map((error, index) => (
                              <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <Error color="error" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={error}
                                  primaryTypographyProps={{ variant: "body2" }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </>
                    )}

                    {/* API Errors */}
                    {bulkResults.apiErrors &&
                      bulkResults.apiErrors.length > 0 && (
                        <>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ mt: 2, color: "warning.main" }}
                          >
                            API Errors:
                          </Typography>
                          <Paper
                            variant="outlined"
                            sx={{ maxHeight: 200, overflow: "auto", p: 1 }}
                          >
                            <List dense>
                              {bulkResults.apiErrors.map((error, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Error color="warning" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={error}
                                    primaryTypographyProps={{
                                      variant: "body2",
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </>
                      )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleBulkUpload}
              disabled={!bulkFile || bulkUploading}
              sx={{
                backgroundColor: "#F69320",
                color: "#fff",
                "&:hover": { backgroundColor: "#F69320" },
                "&.Mui-disabled": {
                  backgroundColor: "#ffb74d",
                },
              }}
            >
              {bulkUploading ? "Processing..." : "Upload & Create Tasks"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default PMWorkList;