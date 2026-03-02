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
};

// Category colors for charts
const CATEGORY_COLORS = {
  FIRST_SUPPLY_PENDING: "#ff9800",
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
        return "First Supply Pending";
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
    <Box sx={{ p: 3 }}>
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Summary Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.primary} 0%, #1565C0 100%)`,
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    width: 56,
                    height: 56,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Pending
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {totalRecords}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total amount across all categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Summary Cards */}
        {dashboardData?.summary?.map((item) => (
          <Grid item xs={12} md={4} key={item.category}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {getCategoryIcon(item.category)}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                      {getCategoryLabel(item.category)}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ color: colors.textPrimary, fontWeight: 600 }}
                    >
                      {item.total_records}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: colors.textSecondary }}
                    >
                      Records
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: getCategoryColor(item.category),
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(item.total_amount)}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(item.total_records / totalRecords) * 100}
                  sx={{
                    mt: 2,
                    height: 6,
                    borderRadius: 3,
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

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Bar Chart */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: colors.textPrimary }}
            >
              Amount Distribution by Category
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: colors.textSecondary, fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: colors.textSecondary, fontSize: 12 }}
                    tickFormatter={(value) =>
                      `₹${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                    contentStyle={{
                      backgroundColor: colors.paper,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 4,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Amount" fill={colors.primary}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: colors.textPrimary }}
            >
              Records Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                    contentStyle={{
                      backgroundColor: colors.paper,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 4,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
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
                    First Supply Pending (
                    {dashboardData?.first_supply_pending?.length || 0})
                  </Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: colors.background }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell>LOA Number</TableCell>
                      <TableCell>Bill Raised Date</TableCell>
                      <TableCell align="right">Bill Amount</TableCell>
                      <TableCell>Last Updated</TableCell>
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
                          <Tooltip title={item.LOA_Number}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 300,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {formatDate(item.bill_raised_date)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 500, color: colors.pending }}
                        >
                          {formatCurrency(item.bill_amount)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.textSecondary }}
                          >
                            {new Date(item.last_updated).toLocaleString()}
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
                  borderColor: colors.info,
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
                    <TableRow sx={{ backgroundColor: colors.background }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell>LOA Number</TableCell>
                      <TableCell>AMC Year</TableCell>
                      <TableCell>Bill Start Date</TableCell>
                      <TableCell align="right">Bill Amount</TableCell>
                      <TableCell>Last Updated</TableCell>
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
                                maxWidth: 300,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
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
                            {new Date(item.last_updated).toLocaleString()}
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
                    <TableRow sx={{ backgroundColor: colors.background }}>
                      {/* <TableCell>Activity ID</TableCell> */}
                      <TableCell>LOA Number</TableCell>
                      <TableCell>AMC Year</TableCell>
                      <TableCell>Invoice Date</TableCell>
                      <TableCell>Invoice Number</TableCell>
                      <TableCell align="right">Bill Amount</TableCell>
                      <TableCell align="center">Ageing (Days)</TableCell>
                      <TableCell>Last Updated</TableCell>
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
                                maxWidth: 300,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.LOA_Number}
                            </Typography>
                          </Tooltip>
                        </TableCell>
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
                            {new Date(item.last_updated).toLocaleString()}
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
    </Box>
  );
};

export default DashboardData;
