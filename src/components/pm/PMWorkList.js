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
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Search,
  Add,
  Visibility,
  FilterList,
  Clear,
  GetApp,
  DateRange,
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
        ticketDate.setHours(0, 0, 0, 0); // Normalize to start of day

        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of the day
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
      // Prepare data for export
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 10 }, // Ticket ID
        { wch: 15 }, // LOA
        { wch: 20 }, // Technician
        { wch: 15 }, // Section
        { wch: 25 }, // Station
        { wch: 12 }, // Status
        { wch: 12 }, // Assign Date
        { wch: 12 }, // Visit Date
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "PM Work Tickets");

      // Generate file name with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `pm_work_tickets_${timestamp}.xlsx`;

      // Export the file
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
      // Prepare all data for export
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 10 }, // Ticket ID
        { wch: 15 }, // LOA
        { wch: 20 }, // Technician
        { wch: 15 }, // Section
        { wch: 25 }, // Station
        { wch: 12 }, // Status
        { wch: 12 }, // Assign Date
        { wch: 12 }, // Visit Date
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "All PM Work Tickets");

      // Generate file name with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `all_pm_work_tickets_${timestamp}.xlsx`;

      // Export the file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data to Excel");
    } finally {
      setExportLoading(false);
    }
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

            {/* Date Range Filter */}
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
      </Box>
    </LocalizationProvider>
  );
};

export default PMWorkList;
