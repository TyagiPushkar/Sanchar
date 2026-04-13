"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

// Color palette
const colors = {
  primary: "#1976d2",
  secondary: "#dc004e",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  background: "#f5f5f5",
  paper: "#ffffff",
  textPrimary: "#333333",
  textSecondary: "#666666",
  border: "#e0e0e0",
  hover: "#f5f5f5",
  headerBg: "#F69320",
};

const WorkStatus = () => {
  const [workStatusData, setWorkStatusData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [loaOptions, setLoaOptions] = useState([]);
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedLOA, setSelectedLOA] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [rmStatusFilter, setRmStatusFilter] = useState("all");
  const [workDoneFilter, setWorkDoneFilter] = useState("all");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch work status data on component mount
  useEffect(() => {
    fetchWorkStatus();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [
    workStatusData,
    selectedLOA,
    selectedStation,
    searchTerm,
    dateRange,
    rmStatusFilter,
    workDoneFilter,
  ]);

  const fetchWorkStatus = async (filters = {}) => {
    try {
      setLoading(true);

      // Build query string based on filters
      const queryParams = new URLSearchParams();
      if (filters.loa) queryParams.append("loa", filters.loa);
      if (filters.station) queryParams.append("station", filters.station);

      const url = `https://namami-infotech.com/SANCHAR/src/work-status/get_work_status.php${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setWorkStatusData(result.data);

        // Extract unique LOAs and stations for filter options
        const uniqueLOAs = [...new Set(result.data.map((item) => item.loa))];
        const uniqueStations = [
          ...new Set(result.data.map((item) => item.station)),
        ];

        setLoaOptions(uniqueLOAs.map((loa) => ({ loa })));
        setStationOptions(uniqueStations.map((station) => ({ station })));
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching work status:", error);
      setSnackbar({
        open: true,
        message: "Failed to load work status data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workStatusData];

    // Filter by LOA
    if (selectedLOA) {
      filtered = filtered.filter((item) => item.loa === selectedLOA.loa);
    }

    // Filter by Station
    if (selectedStation) {
      filtered = filtered.filter(
        (item) => item.station === selectedStation.station,
      );
    }

    // Filter by search term (searches in section, station, loa)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.section?.toLowerCase().includes(term) ||
          item.station?.toLowerCase().includes(term) ||
          item.loa?.toLowerCase().includes(term),
      );
    }

    // Filter by RM Status
    // if (rmStatusFilter !== "all") {
    //   if (rmStatusFilter === "completed") {
    //     filtered = filtered.filter((item) => item.rm_status === "completed");
    //   } else if (rmStatusFilter === "pending") {
    //     filtered = filtered.filter(
    //       (item) => !item.rm_status || item.rm_status === "pending",
    //     );
    //   }
    // }

    if (rmStatusFilter !== "all") {
      if (rmStatusFilter === "complete") {
        filtered = filtered.filter(
          (item) =>
            item.rm_status && item.rm_status.toLowerCase() === "complete",
        );
      } else if (rmStatusFilter === "pending") {
        filtered = filtered.filter(
          (item) =>
            !item.rm_status || item.rm_status.toLowerCase() === "pending",
        );
      }
    }

    // Filter by Work Done Status
    if (workDoneFilter !== "all") {
      if (workDoneFilter === "complete") {
        filtered = filtered.filter(
          (item) =>
            item.work_done_status &&
            item.work_done_status.toLowerCase() === "complete",
        );
      } else if (workDoneFilter === "pending") {
        filtered = filtered.filter(
          (item) =>
            !item.work_done_status ||
            item.work_done_status.toLowerCase() === "pending",
        );
      }
    }

    // Filter by date range
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.create_date).setHours(0, 0, 0, 0);
        const start = dateRange.startDate
          ? new Date(dateRange.startDate).setHours(0, 0, 0, 0)
          : null;
        const end = dateRange.endDate
          ? new Date(dateRange.endDate).setHours(23, 59, 59, 999)
          : null;

        if (start && end) {
          return itemDate >= start && itemDate <= end;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          return itemDate <= end;
        }
        return true;
      });
    }

    setFilteredData(filtered);
    setPage(0); // Reset to first page on filter change
  };

  const handleLOAChange = (event, newValue) => {
    setSelectedLOA(newValue);
  };

  const handleStationChange = (event, newValue) => {
    setSelectedStation(newValue);
  };

  const handleClearFilters = () => {
    setSelectedLOA(null);
    setSelectedStation(null);
    setSearchTerm("");
    setDateRange({ startDate: "", endDate: "" });
    setRmStatusFilter("all");
    setWorkDoneFilter("all");
  };

  const handleRefresh = () => {
    handleClearFilters();
    fetchWorkStatus();
  };

  const handleDateChange = (field) => (event) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "-";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusChip = (status) => {
    if (!status || status === "pending") {
      return (
        <Chip
          label="Pending"
          size="small"
          sx={{
            backgroundColor: colors.warning,
            color: "white",
            fontSize: "0.75rem",
            height: 24,
          }}
        />
      );
    } else if (status === "complete") {
      return (
        <Chip
          label="Complete"
          size="small"
          sx={{
            backgroundColor: colors.success,
            color: "white",
            fontSize: "0.75rem",
            height: 24,
          }}
        />
      );
    } else {
      return (
        <Chip
          label={status}
          size="small"
          sx={{
            backgroundColor: colors.info,
            color: "white",
            fontSize: "0.75rem",
            height: 24,
          }}
        />
      );
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "ID",
        "LOA",
        "Station",
        "Section",
        "Work Done Status",
        "TX Quantity",
        "RX Quantity",
        "TX Unit Price",
        "RX Unit Price",
        "RM Status",
        "Created Date",
        "Updated Date",
      ];

      const csvData = filteredData.map((item) => [
        item.id,
        item.loa,
        item.station,
        item.section,
        item.work_done_status || "-",
        item.tx_qt || "-",
        item.rx_qt || "-",
        item.tx_unit_price || "-",
        item.rx_unit_price || "-",
        item.rm_status || "pending",
        formatDate(item.create_date),
        formatDate(item.update_date),
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `work_status_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: "Data exported successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setSnackbar({
        open: true,
        message: "Failed to export data",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Pagination
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Calculate summary statistics
  const totalRecords = filteredData.length;
  const completedRM = filteredData.filter(
    (item) => item.rm_status && item.rm_status.toLowerCase() === "complete",
  ).length;
  const pendingRM = filteredData.filter(
    (item) => !item.rm_status || item.rm_status.toLowerCase() === "pending",
  ).length;
  const completedWorkDone = filteredData.filter(
    (item) =>
      item.work_done_status &&
      item.work_done_status.toLowerCase() === "complete",
  ).length;
  const pendingWorkDone = filteredData.filter(
    (item) =>
      !item.work_done_status ||
      item.work_done_status.toLowerCase() === "pending",
  ).length;
  const totalValue = filteredData.reduce((sum, item) => {
    const txValue = (item.tx_qt || 0) * (item.tx_unit_price || 0);
    const rxValue = (item.rx_qt || 0) * (item.rx_unit_price || 0);
    return sum + txValue + rxValue;
  }, 0);

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: colors.textPrimary, fontWeight: 600 }}
          >
            Work Status
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Total: {totalRecords} | RM Completed: {completedRM} | RM Pending:{" "}
            {pendingRM} | Work Done Completed: {completedWorkDone} | Work Done
            Pending: {pendingWorkDone}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export to CSV">
            <span>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                size="small"
                disabled={filteredData.length === 0}
              >
                Export
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {/* <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Records
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                RM Completed
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: colors.success }}
              >
                {completedRM}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                RM Pending
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: colors.warning }}
              >
                {pendingRM}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Value
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: colors.primary }}
              >
                {formatCurrency(totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          backgroundColor: colors.paper,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FilterIcon sx={{ color: colors.primary, mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          {(selectedLOA ||
            selectedStation ||
            searchTerm ||
            dateRange.startDate ||
            dateRange.endDate ||
            rmStatusFilter !== "all" ||
            workDoneFilter !== "all") && (
            <Button
              size="small"
              onClick={handleClearFilters}
              sx={{ ml: 2 }}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* LOA Filter */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={loaOptions}
              getOptionLabel={(option) => option.loa}
              value={selectedLOA}
              onChange={handleLOAChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by LOA"
                  size="small"
                  placeholder="Select LOA..."
                />
              )}
              size="small"
            />
          </Grid>

          {/* Station Filter */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={stationOptions}
              getOptionLabel={(option) => option.station}
              value={selectedStation}
              onChange={handleStationChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Station"
                  size="small"
                  placeholder="Select Station..."
                />
              )}
              size="small"
            />
          </Grid>

          {/* Work Done Status Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Work Done</InputLabel>
              <Select
                value={workDoneFilter}
                label="Work Done"
                onChange={(e) => setWorkDoneFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="complete">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* RM Status Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>RM Status</InputLabel>
              <Select
                value={rmStatusFilter}
                label="RM Status"
                onChange={(e) => setRmStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="complete">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date Range Filters - Using standard TextField */}
          {/* <Grid item xs={12} md={2}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={handleDateChange("startDate")}
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={handleDateChange("endDate")}
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid> */}

          {/* Search Field */}
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Search..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: colors.textSecondary, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchTerm("")}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table Section */}
      {filteredData.length > 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F69320" }}>
                  <TableCell
                    sx={{
                      bgcolor: "#F69320",
                      color: "#fff",
                      fontWeight: 600,
                      width: 60,
                    }}
                  >
                    S.No.
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    LOA
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    Station
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    Section
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    Work Done
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                    align="right"
                  >
                    TX Qty
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                    align="right"
                  >
                    RX Qty
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                    align="right"
                  >
                    TX Price
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                    align="right"
                  >
                    RX Price
                  </TableCell>
                  {/* <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                    align="right"
                  >
                    Total
                  </TableCell> */}
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    RM Status
                  </TableCell>
                  {/* <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    Created
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    Updated
                  </TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item, index) => {
                  const serialNo = page * rowsPerPage + index + 1;
                  const txTotal = (item.tx_qt || 0) * (item.tx_unit_price || 0);
                  const rxTotal = (item.rx_qt || 0) * (item.rx_unit_price || 0);
                  const total = txTotal + rxTotal;

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        "&:hover": { backgroundColor: colors.hover },
                        transition: "background-color 0.2s",
                      }}
                    >
                      <TableCell sx={{ color: colors.textSecondary }}>
                        {serialNo}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.loa}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: colors.textPrimary,
                              fontSize: "0.875rem",
                              maxWidth: 250,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.loa}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 500, color: colors.textPrimary }}
                        >
                          {item.station}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: colors.textPrimary }}>
                          {item.section}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.work_done_status || "Not Started"}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell align="right">{item.tx_qt || "-"}</TableCell>
                      <TableCell align="right">{item.rx_qt || "-"}</TableCell>
                      <TableCell align="center">
                        {formatCurrency(item.tx_unit_price)}
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(item.rx_unit_price)}
                      </TableCell>
                      {/* <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(total)}
                      </TableCell> */}
                      <TableCell>{getStatusChip(item.rm_status)}</TableCell>
                      {/* <TableCell sx={{ fontSize: "0.75rem" }}>
                        {formatDate(item.create_date)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>
                        {formatDate(item.update_date)}
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: `1px solid ${colors.border}`,
              ".MuiTablePagination-select": { fontSize: "0.875rem" },
              ".MuiTablePagination-displayedRows": { fontSize: "0.875rem" },
            }}
          />
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
            backgroundColor: colors.paper,
          }}
        >
          <Typography color="textSecondary">
            No work status records found
          </Typography>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{
            backgroundColor:
              snackbar.severity === "success"
                ? colors.success
                : snackbar.severity === "error"
                  ? colors.error
                  : colors.warning,
            color: "white",
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkStatus;
