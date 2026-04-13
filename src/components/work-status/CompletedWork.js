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
} from "@mui/icons-material";

// Color palette
const colors = {
  primary: "#1976d2",
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

const CompletedWork = () => {
  const [allWorkData, setAllWorkData] = useState([]);
  const [completedWorkData, setCompletedWorkData] = useState([]);
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
  const [workStatusFilter, setWorkStatusFilter] = useState("all");

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
    completedWorkData,
    selectedLOA,
    selectedStation,
    searchTerm,
    workStatusFilter,
  ]);

  const fetchWorkStatus = async () => {
    try {
      setLoading(true);

      const url = `https://namami-infotech.com/SANCHAR/src/work-status/get_work_status.php`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setAllWorkData(result.data);

        // Filter only records where work_done_status is not NULL
        // Filter records where work_done_status is not NULL AND rm_status is completed
        const completed = result.data.filter(
          (item) =>
            item.work_done_status !== null &&
            item.work_done_status !== "" &&
            item.rm_status !== "Complete",
        );
        setCompletedWorkData(completed);

        // Extract unique LOAs and stations from completed work only
        const uniqueLOAs = [...new Set(completed.map((item) => item.loa))];
        const uniqueStations = [
          ...new Set(completed.map((item) => item.station)),
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
    let filtered = [...completedWorkData];

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

    // Filter by search term (searches in section, station, loa, work_done_status)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.section?.toLowerCase().includes(term) ||
          item.station?.toLowerCase().includes(term) ||
          item.loa?.toLowerCase().includes(term) ||
          item.work_done_status?.toLowerCase().includes(term),
      );
    }

    // Filter by Work Status
    if (workStatusFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.work_done_status === workStatusFilter,
      );
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
    setWorkStatusFilter("all");
  };

  const handleRefresh = () => {
    handleClearFilters();
    fetchWorkStatus();
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
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "-";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusChip = (status) => {
    const statusColors = {
      completed: colors.success,
      "in-progress": colors.info,
      pending: colors.warning,
      "not-started": colors.error,
    };

    const color = statusColors[status?.toLowerCase()] || colors.primary;

    return (
      <Chip
        label={status || "Not Started"}
        size="small"
        sx={{
          backgroundColor: color,
          color: "white",
          fontSize: "0.75rem",
          height: 24,
        }}
      />
    );
  };

  // Get unique work status values for filter
  const workStatusOptions = [
    ...new Set(
      completedWorkData.map((item) => item.work_done_status).filter(Boolean),
    ),
  ];

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

  return (
    <Box sx={{ pt: 2 }}>
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
            Pending Work & RM Status
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Total Records with Work Done: {completedWorkData.length} | Filtered:{" "}
            {filteredData.length}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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
            workStatusFilter !== "all") && (
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

          {/* Work Status Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Work Status</InputLabel>
              <Select
                value={workStatusFilter}
                label="Work Status"
                onChange={(e) => setWorkStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                {workStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by LOA, Station, Section, or Work Status..."
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
                  <TableCell
                    sx={{ bgcolor: "#F69320", color: "#fff", fontWeight: 600 }}
                  >
                    RM Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item, index) => {
                  const serialNo = page * rowsPerPage + index + 1;

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
                              // overflow: "hidden",
                              //textOverflow: "ellipsis",
                              // whiteSpace: "nowrap",
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
                        {getStatusChip(item.work_done_status)}
                      </TableCell>
                      <TableCell align="right">{item.tx_qt || "-"}</TableCell>
                      <TableCell align="right">{item.rx_qt || "-"}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.tx_unit_price)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.rx_unit_price)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.rm_status || "pending"}
                          size="small"
                          sx={{
                            backgroundColor:
                              item.rm_status === "completed"
                                ? colors.success
                                : colors.warning,
                            color: "white",
                            fontSize: "0.75rem",
                            height: 24,
                          }}
                        />
                      </TableCell>
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
            No completed work records found
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

export default CompletedWork;
