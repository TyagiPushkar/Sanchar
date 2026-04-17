"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  useTheme,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Warning as WarningIcon,
  PendingActions as PendingIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CompletedWork from "../work-status/CompletedWork";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
  pending: "#ff9800",
  overdue: "#f44336",
  completed: "#4caf50",
  amcRaised: "#8e24aa",
};

// Category colors for charts
const CATEGORY_COLORS = {
  FIRST_SUPPLY_PENDING: "#ff9800",
  INVOICE_TO_RAISED: "#673ab7", // updated
  AMC_BILL_PENDING: "#2196f3",
  AMC_PAYMENT_PENDING: "#f44336",
};

const DashboardData = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loaFilter, setLoaFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/report/get_dashboard.php",
      );
      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
        console.log("Dashboard data fetched successfully:", data);
      } else {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setSnackbar({
        open: true,
        message: "Failed to load dashboard data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "FIRST_SUPPLY_PENDING":
        return <PendingIcon sx={{ fontSize: 40, color: colors.pending }} />;
      case "AMC_BILL_RAISED":
        return <PendingIcon sx={{ fontSize: 40, color: colors.amcRaised }} />;
      case "AMC_BILL_PENDING":
        return <ReceiptIcon sx={{ fontSize: 40, color: colors.info }} />;
      case "AMC_PAYMENT_PENDING":
        return <PaymentIcon sx={{ fontSize: 40, color: colors.error }} />;
      default:
        return <WarningIcon sx={{ fontSize: 40, color: colors.warning }} />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "FIRST_SUPPLY_PENDING":
        return "Goods Supply Pending Pymt";
      case "AMC_BILL_RAISED":
        return "INVOICE TO BE RAISED";
      case "AMC_BILL_PENDING":
        return "AMC Bill Pending";
      case "AMC_PAYMENT_PENDING":
        return "AMC Payment Pending";
      default:
        return category;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "FIRST_SUPPLY_PENDING":
        return colors.pending;
      case "AMC_BILL_PENDING":
        return colors.info;
      case "AMC_BILL_RAISED":
        return colors.amcRaised; // new purple
      case "AMC_PAYMENT_PENDING":
        return colors.error;
      default:
        return colors.warning;
    }
  };

  // Prepare data for charts
  const getChartData = () => {
    if (!dashboardData?.summary) return [];

    return dashboardData.summary.map((item) => ({
      name: getCategoryLabel(item.category),
      records: item.total_records,
      amount: parseFloat(item.total_amount),
      category: item.category,
    }));
  };

  const getPieChartData = () => {
    if (!dashboardData?.summary) return [];

    return dashboardData.summary.map((item) => ({
      name: getCategoryLabel(item.category),
      value: parseFloat(item.total_amount),
      category: item.category,
    }));
  };

  const isWithin30Days = (date) => {
    if (!date) return false;
    const today = new Date();
    const target = new Date(date);
    const diff = (target - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };
  const filteredData =
    dashboardData?.amc_bill_raised?.filter((item) => {
      const matchLOA = loaFilter ? item.LOA_Number === loaFilter : true;

      const itemDate = dayjs(item.bill_start_date);

      const matchFrom = fromDate
        ? itemDate.isAfter(dayjs(fromDate).subtract(1, "day"))
        : true;

      const matchTo = toDate
        ? itemDate.isBefore(dayjs(toDate).add(1, "day"))
        : true;

      return matchLOA && matchFrom && matchTo;
    }) || [];
  const uniqueLOAs = [
    ...new Set(dashboardData?.amc_bill_raised?.map((i) => i.LOA_Number)),
  ];
  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      "LOA Number": item.LOA_Number,
      Period: item.period,
      AMC: item.amc_year,
      "Bill Start Date": formatDate(item.bill_start_date),
      "Bill Amount": item.bill_amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "AMC Data");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "AMC_Bill_Report.xlsx");
  };
  const handleClearFilters = () => {
    setLoaFilter("");
    setFromDate(null);
    setToDate(null);
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

  const chartData = getChartData();
  const pieData = getPieChartData();
  const totalRecords =
    dashboardData?.summary?.reduce(
      (acc, item) => acc + item.total_records,
      0,
    ) || 0;
  const totalAmount =
    dashboardData?.summary?.reduce(
      (acc, item) => acc + parseFloat(item.total_amount),
      0,
    ) || 0;

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: colors.textPrimary, fontWeight: 600 }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Overview of pending supplies, bills, and payments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            borderColor: colors.primary,
            color: colors.primary,
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {/* Summary Cards */}
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Summary Card */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.primary} 0%, #1565C0 100%)`,
              color: "white",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    width: 36,
                    height: 36,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption">Total</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {totalRecords}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                {formatCurrency(totalAmount)}
              </Typography>
              {/* <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total amount across all categories
              </Typography> */}
            </CardContent>
          </Card>
        </Grid>

        {/* Sorted Category Cards */}
        {dashboardData?.summary
          ?.sort((a, b) => {
            const order = [
              "FIRST_SUPPLY_PENDING",
              "INVOICE_TO_RAISED", // 👈 ye pehle ayega
              "AMC_BILL_PENDING",
              "AMC_PAYMENT_PENDING",
            ];
            return order.indexOf(a.category) - order.indexOf(b.category);
          })
          .map((item) => (
            <Grid item xs={12} sm={6} md={2.4} key={item.category}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  height: "100%",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                    borderColor: getCategoryColor(item.category),
                  },
                  ...(selectedCategory === item.category && {
                    borderColor: getCategoryColor(item.category),
                    borderWidth: 2,
                  }),
                }}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === item.category ? null : item.category,
                  )
                }
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Top Row */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* <Avatar
                      sx={{
                        bgcolor: `${getCategoryColor(item.category)}20`,
                        color: getCategoryColor(item.category),
                        width: 32,
                        height: 32,
                      }}
                    >
                      {getCategoryIcon(item.category)}
                    </Avatar> */}
                    {getCategoryIcon(item.category)}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: colors.textPrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </Typography>
                  </Box>

                  {/* Numbers */}
                  <Box
                    mt={1}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6" fontWeight={600}>
                      {item.total_records}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: getCategoryColor(item.category),
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(item.total_amount)}
                    </Typography>
                  </Box>

                  {/* Progress */}
                  <LinearProgress
                    variant="determinate"
                    value={(item.total_records / totalRecords) * 100}
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: `${getCategoryColor(item.category)}20`,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getCategoryColor(item.category),
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Detailed Tables */}
      <Grid container spacing={3}>
        {/* First Supply Pending Table */}
        {(selectedCategory === null ||
          selectedCategory === "FIRST_SUPPLY_PENDING") && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                overflow: "hidden",
                mb: 3,
                ...(selectedCategory === "FIRST_SUPPLY_PENDING" && {
                  borderColor: colors.pending,
                  borderWidth: 2,
                }),
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: `${colors.pending}10`,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PendingIcon sx={{ color: colors.pending }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                    GOODS SUPPLY PENDING PAYMENT (
                    {dashboardData?.first_supply_pending?.length || 0})
                  </Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{ backgroundColor: colors.pending, color: "white" }}
                    >
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell sx={{ color: "white" }}>LOA Number</TableCell>
                      <TableCell sx={{ color: "white" }}>Invoice No.</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Invoice Date
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Days Pending
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Tx/Rx Qty.</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Invoice Amount
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Received Amount
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData?.first_supply_pending?.map((item) => (
                      <TableRow key={item.id} hover>
                        {/* <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.ActivityId}
                          </Typography>
                        </TableCell> */}
                        <TableCell>
                          <Tooltip title={item.loa}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.loa}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{item.invoice_number}</TableCell>
                        <TableCell>{formatDate(item.date_invoice)}</TableCell>
                        <TableCell>{item.days_pending}</TableCell>
                        <TableCell>
                          {item.no_of_tx}/{item.no_of_rx}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 500, color: colors.pending }}
                        >
                          {formatCurrency(item.invoice_amount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            +item.amount_received +
                              +item.penalty_deduction +
                              +item.tax_deduction,
                          )}
                        </TableCell>
                        <TableCell>{item.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* AMC Bill Raising */}
        {(selectedCategory === null ||
          selectedCategory === "AMC_BILL_RAISED") && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                overflow: "hidden",
                mb: 3,
                ...(selectedCategory === "AMC_BILL_RAISED" && {
                  borderColor: colors.info,
                  borderWidth: 2,
                }),
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: `${colors.amcRaised}15`,
                  borderBottom: `1px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  overflow: "hidden",
                }}
              >
                {/* LEFT SIDE: TITLE ONLY */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <ReceiptIcon sx={{ color: colors.amcRaised }} />
                  <Typography
                    variant="h6"
                    sx={{ color: colors.textPrimary, fontWeight: 600 }}
                  >
                    Invoice To Be Raised (
                    {dashboardData?.amc_bill_raised?.length || 0})
                  </Typography>
                </Box>

                {/* RIGHT SIDE: ALL FILTERS WITH REDUCED GAP */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {" "}
                  {/* Reduced gap from 1 to 0.5 */}
                  {/* LOA FILTER */}
                  <TextField
                    select
                    size="small"
                    label="LOA"
                    value={loaFilter}
                    onChange={(e) => setLoaFilter(e.target.value)}
                    SelectProps={{
                      MenuProps: {
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        PaperProps: {
                          sx: {
                            mt: 1,
                            maxHeight: 300,
                          },
                        },
                      },
                    }}
                    sx={{
                      width: 300,
                      "& .MuiSelect-select": {
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      },
                    }}
                  >
                    <MenuItem value="">All</MenuItem>

                    {[
                      ...new Set(
                        dashboardData?.amc_bill_raised?.map(
                          (i) => i.LOA_Number,
                        ) || [],
                      ),
                    ].map((loa) => (
                      <MenuItem
                        key={loa}
                        value={loa}
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          maxWidth: 300,
                        }}
                      >
                        {loa}
                      </MenuItem>
                    ))}
                  </TextField>
                  {/* DATE PICKERS - Reduced widths */}
                  <Box sx={{ width: 100 }}>
                    <DatePicker
                      selected={fromDate}
                      onChange={(date) => setFromDate(date)}
                      customInput={
                        <TextField
                          size="small"
                          label="From"
                          sx={{
                            width: "100%",
                            m: 0,
                          }}
                        />
                      }
                    />
                  </Box>
                  <Box sx={{ width: 100 }}>
                    <DatePicker
                      selected={toDate}
                      onChange={(date) => setToDate(date)}
                      customInput={
                        <TextField
                          size="small"
                          label="To"
                          sx={{
                            width: "100%",
                            m: 0,
                          }}
                        />
                      }
                    />
                  </Box>
                  {/* EXPORT ICON BUTTON */}
                  <IconButton
                    onClick={handleExport}
                    sx={{
                      backgroundColor: colors.amcRaised,
                      color: "white",
                      width: "40px",
                      height: "40px",
                      "&:hover": { backgroundColor: "#6a1b9a" },
                      m: 0,
                    }}
                    size="small"
                  >
                    <FileDownloadIcon />{" "}
                    {/* Or use GetAppIcon / DownloadIcon */}
                  </IconButton>
                </Box>
              </Box>
              <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: colors.amcRaised }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell sx={{ color: "white" }}>LOA Number</TableCell>
                      <TableCell sx={{ color: "white" }}>Period</TableCell>
                      <TableCell sx={{ color: "white" }}>AMC</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Bill Start Date
                      </TableCell>
                      <TableCell align="right" sx={{ color: "white" }}>
                        Bill Amount
                      </TableCell>
                      {/* <TableCell sx={{ color: "white" }}>Remarks</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData?.map((item) => (
                      <TableRow key={item.id} hover>
                        {/* <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.ActivityId}
                          </Typography>
                        </TableCell> */}
                        <TableCell>
                          <Tooltip title={item.LOA_Number}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.amc_year}
                            size="small"
                            sx={{
                              backgroundColor: isWithin30Days(
                                item.bill_start_date,
                              )
                                ? colors.error
                                : colors.amcRaised,
                              color: "white",
                              fontSize: "0.7rem",
                              fontWeight: isWithin30Days(item.bill_start_date)
                                ? 700
                                : 500,
                              boxShadow: isWithin30Days(item.bill_start_date)
                                ? "0 0 10px rgba(244,67,54,0.6)"
                                : "none",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(item.bill_start_date)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 500, color: colors.info }}
                        >
                          {formatCurrency(item.bill_amount)}
                        </TableCell>
                        {/* <TableCell>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.textSecondary }}
                          >
                            {item.remarks}
                          </Typography>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* AMC Bill Pending Table */}
        {(selectedCategory === null ||
          selectedCategory === "AMC_BILL_PENDING") && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                overflow: "hidden",
                mb: 3,
                ...(selectedCategory === "AMC_BILL_PENDING" && {
                  borderColor: colors.amcRaised,
                  borderWidth: 2,
                }),
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: `${colors.info}10`,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ReceiptIcon sx={{ color: colors.info }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                    AMC Bill Pending (
                    {dashboardData?.amc_bill_pending?.length || 0})
                  </Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: colors.info }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell sx={{ color: "white" }}>LOA Number</TableCell>
                      <TableCell sx={{ color: "white" }}>Period</TableCell>
                      <TableCell sx={{ color: "white" }}>AMC</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Bill Start Date
                      </TableCell>
                      <TableCell align="right" sx={{ color: "white" }}>
                        Bill Amount
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData?.amc_bill_pending?.map((item) => (
                      <TableRow key={item.id} hover>
                        {/* <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.ActivityId}
                          </Typography>
                        </TableCell> */}
                        <TableCell>
                          <Tooltip title={item.LOA_Number}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.amc_year}
                            size="small"
                            sx={{
                              backgroundColor: colors.info,
                              color: "white",
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(item.bill_start_date)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 500, color: colors.info }}
                        >
                          {formatCurrency(item.bill_amount)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.textSecondary }}
                          >
                            {item.remarks}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* AMC Payment Pending Table */}
        {(selectedCategory === null ||
          selectedCategory === "AMC_PAYMENT_PENDING") && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                overflow: "hidden",
                ...(selectedCategory === "AMC_PAYMENT_PENDING" && {
                  borderColor: colors.error,
                  borderWidth: 2,
                }),
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: `${colors.error}10`,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PaymentIcon sx={{ color: colors.error }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                    AMC Payment Pending (
                    {dashboardData?.amc_payment_pending?.length || 0})
                  </Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: colors.error }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell sx={{ color: "white" }}>LOA Number</TableCell>
                      <TableCell sx={{ color: "white" }}>Period</TableCell>
                      <TableCell sx={{ color: "white" }}>AMC</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Invoice Date
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Invoice Number
                      </TableCell>
                      <TableCell align="right" sx={{ color: "white" }}>
                        Invoice Amount
                      </TableCell>
                      <TableCell align="center" sx={{ color: "white" }}>
                        Ageing (Days)
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData?.amc_payment_pending?.map((item) => (
                      <TableRow key={item.id} hover>
                        {/* <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.ActivityId}
                          </Typography>
                        </TableCell> */}
                        <TableCell>
                          <Tooltip title={item.LOA_Number}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.amc_year}
                            size="small"
                            sx={{
                              backgroundColor: colors.error,
                              color: "white",
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>

                        <TableCell>{formatDate(item.invoice_date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.invoice_number}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 500, color: colors.error }}
                        >
                          {formatCurrency(item.bill_amount)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.ageing_days} days`}
                            size="small"
                            sx={{
                              backgroundColor:
                                item.ageing_days > 30
                                  ? colors.error
                                  : colors.warning,
                              color: "white",
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.textSecondary }}
                          >
                            {item.remarks}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
      <CompletedWork />
    </Box>
  );
};

export default DashboardData;
