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
  Button,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Tooltip,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import * as XLSX from "xlsx";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  FileUpload as FileUploadIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";

// Color palette
const colors = {
  primary: "#1976d2",
  secondary: "#dc004e",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  background: "#f5f5f5",
  paper: "#ffffff",
  textPrimary: "#333333",
  textSecondary: "#666666",
  border: "#e0e0e0",
  hover: "#f5f5f5",
  headerBg: "#F69320",
};

const InvoiceManagement = () => {
  // State for invoices data
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dropdown options states
  const [loaOptions, setLoaOptions] = useState([]);
  const [stationData, setStationData] = useState([]);
  const [sectionData, setSectionData] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterLOA, setSelectedFilterLOA] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [invoiceDialog, setInvoiceDialog] = useState({
    open: false,
    mode: "create", // 'create' or 'edit'
    data: null,
  });

  // Form state for create/edit - Added invoice_number
  const [formData, setFormData] = useState({
    LOA: "",
    Section: "",
    Station: "",
    BillType: "",
    NoOfRx: "",
    RxAmount: "",
    NoOfTx: "",
    TxAmount: "",
    RMId: "",
    MBId: "",
    InvoiceAmount: "",
    DateInvoice: new Date().toISOString().split("T")[0],
    AmountReceived: "",
    InvoiceNumber: "", // New field
  });

  // File upload states
  const [files, setFiles] = useState({
    rm_copy: null,
    mb_copy: null,
    invoice_copy: null,
  });

  // File preview names
  const [fileNames, setFileNames] = useState({
    rm_copy: "",
    mb_copy: "",
    invoice_copy: "",
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Tab state for view details
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    invoice: null,
  });
  const [tabValue, setTabValue] = useState(0);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter stations and sections when LOA changes in form
  useEffect(() => {
    if (formData.LOA) {
      // Filter stations for selected LOA
      const stationEntry = stationData.find(
        (item) => item.LOA === formData.LOA,
      );
      setFilteredStations(stationEntry?.Stations || []);

      // Filter sections for selected LOA
      const sectionEntry = sectionData.find(
        (item) => item.LOA === formData.LOA,
      );
      setFilteredSections(sectionEntry?.Sections || []);
    } else {
      setFilteredStations([]);
      setFilteredSections([]);
    }
  }, [formData.LOA, stationData, sectionData]);

  // Filter invoices based on search, LOA, and date range
  useEffect(() => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.loa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.bill_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedFilterLOA) {
      filtered = filtered.filter((inv) => inv.loa === selectedFilterLOA);
    }

    if (dateRange.start) {
      filtered = filtered.filter(
        (inv) => new Date(inv.date_invoice) >= new Date(dateRange.start),
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(
        (inv) => new Date(inv.date_invoice) <= new Date(dateRange.end),
      );
    }

    setFilteredInvoices(filtered);
    setPage(0);
  }, [searchTerm, selectedFilterLOA, dateRange, invoices]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [invoicesRes, loaRes, stationRes, sectionRes] = await Promise.all([
        fetch(
          "https://namami-infotech.com/SANCHAR/src/invoice/get_invoice.php",
        ),
        fetch("https://namami-infotech.com/SANCHAR/src/menu/get_loa.php"),
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/station_list.php"),
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/section_list.php"),
      ]);

      const invoicesData = await invoicesRes.json();
      const loaData = await loaRes.json();
      const stationData = await stationRes.json();
      const sectionData = await sectionRes.json();

      // Process invoices
      if (invoicesData.success) {
        setInvoices(invoicesData.data || []);
      }

      // Process LOA options
      if (loaData.success) {
        setLoaOptions(loaData.data || []);
      }

      // Process station data
      if (stationData.success) {
        setStationData(stationData.data || []);
      }

      // Process section data
      if (sectionData.success) {
        setSectionData(sectionData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterLOAChange = (event, newValue) => {
    setSelectedFilterLOA(newValue);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleClearDateRange = () => {
    setDateRange({ start: "", end: "" });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      LOA: "",
      Section: "",
      Station: "",
      BillType: "",
      NoOfRx: "",
      RxAmount: "",
      NoOfTx: "",
      TxAmount: "",
      RMId: "",
      MBId: "",
      InvoiceAmount: "",
      DateInvoice: new Date().toISOString().split("T")[0],
      AmountReceived: "",
      InvoiceNumber: "",
    });
    setFiles({ rm_copy: null, mb_copy: null, invoice_copy: null });
    setFileNames({ rm_copy: "", mb_copy: "", invoice_copy: "" });
    setFormErrors({});
    setFilteredStations([]);
    setFilteredSections([]);
    setInvoiceDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEditDialog = (invoice) => {
    setFormData({
      LOA: invoice.loa || "",
      Section: invoice.section || "",
      Station: invoice.station || "",
      BillType: invoice.bill_type || "",
      NoOfRx: invoice.no_of_rx || "",
      RxAmount: invoice.rx_amount || "",
      NoOfTx: invoice.no_of_tx || "",
      TxAmount: invoice.tx_amount || "",
      RMId: invoice.rm_id || "",
      MBId: invoice.mb_id || "",
      InvoiceAmount: invoice.invoice_amount || "",
      DateInvoice:
        invoice.date_invoice || new Date().toISOString().split("T")[0],
      AmountReceived: invoice.amount_received || "",
      InvoiceNumber: invoice.invoice_number || "",
    });
    setFiles({ rm_copy: null, mb_copy: null, invoice_copy: null });
    setFileNames({ rm_copy: "", mb_copy: "", invoice_copy: "" });
    setFormErrors({});
    setInvoiceDialog({ open: true, mode: "edit", data: invoice });
  };

  const handleCloseDialog = () => {
    setInvoiceDialog({ open: false, mode: "create", data: null });
  };

  const handleCloseDetailDialog = () => {
    setDetailDialog({ open: false, invoice: null });
    setTabValue(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));
      setFileNames((prev) => ({
        ...prev,
        [fileType]: file.name,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.LOA) errors.LOA = "LOA is required";
    if (!formData.Section) errors.Section = "Section is required";
    if (!formData.Station) errors.Station = "Station is required";
    if (!formData.InvoiceAmount)
      errors.InvoiceAmount = "Invoice amount is required";
    if (!formData.InvoiceNumber)
      errors.InvoiceNumber = "Invoice number is required";

    // Validate numeric fields
    if (formData.NoOfRx && isNaN(formData.NoOfRx))
      errors.NoOfRx = "Must be a number";
    if (formData.RxAmount && isNaN(formData.RxAmount))
      errors.RxAmount = "Must be a number";
    if (formData.NoOfTx && isNaN(formData.NoOfTx))
      errors.NoOfTx = "Must be a number";
    if (formData.TxAmount && isNaN(formData.TxAmount))
      errors.TxAmount = "Must be a number";
    if (formData.InvoiceAmount && isNaN(formData.InvoiceAmount))
      errors.InvoiceAmount = "Must be a number";
    if (formData.AmountReceived && isNaN(formData.AmountReceived))
      errors.AmountReceived = "Must be a number";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields correctly",
        severity: "warning",
      });
      return;
    }

    try {
      setActionLoading(true);

      const formPayload = new FormData();

      // Add all text fields
      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== null &&
          formData[key] !== undefined &&
          formData[key] !== ""
        ) {
          formPayload.append(key, formData[key]);
        }
      });

      // Add files if present
      if (files.rm_copy) {
        formPayload.append("rm_copy", files.rm_copy);
      }
      if (files.mb_copy) {
        formPayload.append("mb_copy", files.mb_copy);
      }
      if (files.invoice_copy) {
        formPayload.append("invoice_copy", files.invoice_copy);
      }

      // Add ID for update
      if (invoiceDialog.mode === "edit" && invoiceDialog.data) {
        formPayload.append("id", invoiceDialog.data.id);
      }

      const url =
        invoiceDialog.mode === "create"
          ? "https://namami-infotech.com/SANCHAR/src/invoice/create_invoice.php"
          : "https://namami-infotech.com/SANCHAR/src/invoice/update_invoice.php";

      const response = await fetch(url, {
        method: "POST",
        body: formPayload,
      });

      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Invoice ${invoiceDialog.mode === "create" ? "created" : "updated"} successfully`,
          severity: "success",
        });

        // Refresh invoice list
        await fetchAllData();
        handleCloseDialog();
      } else {
        throw new Error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to process invoice",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };
 const handleExportToExcel = () => {
   try {
     // Prepare data for export
     const exportData = filteredInvoices.map((invoice, index) => ({
       "S.No.": index + 1,
       "Invoice Number": invoice.invoice_number || "-",
       "Invoice ID": invoice.id,
       LOA: invoice.loa,
       Section: invoice.section,
       Station: invoice.station,
       "Bill Type": invoice.bill_type || "-",
       "Invoice Amount": parseFloat(invoice.invoice_amount || 0).toFixed(2),
       "Amount Received": parseFloat(invoice.amount_received || 0).toFixed(2),
       Balance: (
         parseFloat(invoice.invoice_amount || 0) -
         parseFloat(invoice.amount_received || 0)
       ).toFixed(2),
       Date: formatDate(invoice.date_invoice),
       Status:
         invoice.amount_received === "0"
           ? "Unpaid"
           : parseFloat(invoice.amount_received) <
               parseFloat(invoice.invoice_amount)
             ? "Partial"
             : "Paid",
       "RM ID": invoice.rm_id || "-",
       "MB ID": invoice.mb_id || "-",
       "No. of RX": invoice.no_of_rx || "-",
       "RX Amount": parseFloat(invoice.rx_amount || 0).toFixed(2),
       "No. of TX": invoice.no_of_tx || "-",
       "TX Amount": parseFloat(invoice.tx_amount || 0).toFixed(2),
     }));

     // Create worksheet
     const ws = XLSX.utils.json_to_sheet(exportData);

     // Create workbook
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Invoices");

     // Generate filename with current date
     const date = new Date();
     const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
     const filename = `Invoices_${dateStr}.xlsx`;

     // Save file
     XLSX.writeFile(wb, filename);

     setSnackbar({
       open: true,
       message: `Exported ${exportData.length} invoices successfully`,
       severity: "success",
     });
   } catch (error) {
     console.error("Error exporting to Excel:", error);
     setSnackbar({
       open: true,
       message: "Failed to export invoices",
       severity: "error",
     });
   }
 };
  const handleViewDetails = (invoice) => {
    setDetailDialog({ open: true, invoice });
  };

  const handleViewDocument = (path) => {
    if (path) {
      window.open(`https://namami-infotech.com/SANCHAR/${path}`, "_blank");
    }
  };

  const handleDownloadDocument = async (path, filename) => {
    try {
      const response = await fetch(
        `https://namami-infotech.com/SANCHAR/${path}`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || path.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      setSnackbar({
        open: true,
        message: "Failed to download file",
        severity: "error",
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
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

  const getStatusChip = (invoice) => {
    const amountReceived = parseFloat(invoice.amount_received || 0);
    const invoiceAmount = parseFloat(invoice.invoice_amount || 0);

    if (amountReceived === 0) {
      return (
        <Chip
          label="Unpaid"
          size="small"
          sx={{ backgroundColor: colors.error, color: "white" }}
        />
      );
    } else if (amountReceived < invoiceAmount) {
      return (
        <Chip
          label="Partial"
          size="small"
          sx={{ backgroundColor: colors.warning, color: "white" }}
        />
      );
    } else {
      return (
        <Chip
          label="Paid"
          size="small"
          sx={{ backgroundColor: colors.success, color: "white" }}
        />
      );
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
  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
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
              Invoice Management
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Total Invoices: {filteredInvoices.length} | Total Amount:{" "}
              {formatCurrency(
                filteredInvoices.reduce(
                  (sum, inv) => sum + parseFloat(inv.invoice_amount || 0),
                  0,
                ),
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExportToExcel}
      disabled={filteredInvoices.length === 0}
      sx={{
        borderColor: colors.success,
        color: colors.success,
        '&:hover': {
          borderColor: colors.success,
          backgroundColor: 'rgba(76, 175, 80, 0.04)',
        },
      }}
    >
      Export to Excel
    </Button>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleOpenCreateDialog}
      sx={{
        backgroundColor: colors.primary,
        "&:hover": { backgroundColor: "#115293" },
      }}
    >
      Create Invoice
    </Button>
  </Box>
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={loaOptions}
                value={selectedFilterLOA}
                onChange={handleFilterLOAChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by LOA"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by LOA, Section, Station, Invoice No..."
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
                        onClick={handleClearSearch}
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

        {/* Invoices Table */}
        {filteredInvoices.length > 0 ? (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.headerBg }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      S.No.
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Invoice #
                    </TableCell>

                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      LOA
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Section
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Station
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Bill Type
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", fontWeight: 600 }}
                      align="right"
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", fontWeight: 600 }}
                      align="right"
                    >
                      Received
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", fontWeight: 600 }}
                      align="center"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvoices.map((invoice, index) => {
                    const serialNo = page * rowsPerPage + index + 1;

                    return (
                      <TableRow
                        key={invoice.id}
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
                          <Typography
                            sx={{ fontWeight: 500, color: colors.primary }}
                          >
                            {invoice.invoice_number || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ color: colors.textPrimary }}>
                          {invoice.loa}
                        </TableCell>
                        <TableCell sx={{ color: colors.textPrimary }}>
                          {invoice.section}
                        </TableCell>
                        <TableCell sx={{ color: colors.textPrimary }}>
                          {invoice.station}
                        </TableCell>
                        <TableCell sx={{ color: colors.textSecondary }}>
                          {invoice.bill_type || "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {formatCurrency(invoice.invoice_amount)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: colors.success, fontWeight: 500 }}
                        >
                          {formatCurrency(invoice.amount_received)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.date_invoice)}
                        </TableCell>
                        <TableCell>{getStatusChip(invoice)}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(invoice)}
                                sx={{ color: colors.primary }}
                              >
                                <ReceiptIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(invoice)}
                                sx={{ color: colors.warning }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
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
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: `1px solid ${colors.border}`,
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
            }}
          >
            <ReceiptIcon sx={{ fontSize: 48, color: colors.border, mb: 2 }} />
            <Typography color="textSecondary">No invoices found</Typography>
          </Paper>
        )}
      </Box>

      {/* Create/Edit Invoice Dialog */}
      <Dialog
        open={invoiceDialog.open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ color: colors.textPrimary }}>
            {invoiceDialog.mode === "create"
              ? "Create New Invoice"
              : "Edit Invoice"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* Invoice Number - New Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Invoice Number *"
                name="InvoiceNumber"
                value={formData.InvoiceNumber}
                onChange={handleInputChange}
                error={!!formErrors.InvoiceNumber}
                helperText={formErrors.InvoiceNumber}
                placeholder="e.g., DEL/2026/001"
              />
            </Grid>

            {/* LOA Autocomplete */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={loaOptions}
                value={formData.LOA}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    LOA: newValue || "",
                    Section: "",
                    Station: "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="LOA *"
                    size="small"
                    error={!!formErrors.LOA}
                    helperText={formErrors.LOA}
                  />
                )}
              />
            </Grid>

            {/* Section Autocomplete - Filtered by LOA */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filteredSections}
                value={formData.Section}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, Section: newValue || "" }));
                }}
                disabled={!formData.LOA}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Section *"
                    size="small"
                    error={!!formErrors.Section}
                    helperText={
                      formErrors.Section ||
                      (!formData.LOA ? "Select LOA first" : "")
                    }
                  />
                )}
              />
            </Grid>

            {/* Station Autocomplete - Filtered by LOA */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filteredStations}
                value={formData.Station}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, Station: newValue || "" }));
                }}
                disabled={!formData.LOA}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Station *"
                    size="small"
                    error={!!formErrors.Station}
                    helperText={
                      formErrors.Station ||
                      (!formData.LOA ? "Select LOA first" : "")
                    }
                  />
                )}
              />
            </Grid>

            {/* Bill Type */}
            {/* Bill Type Dropdown */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!formErrors.BillType}>
                <InputLabel>Bill Type</InputLabel>
                <Select
                  name="BillType"
                  value={formData.BillType}
                  onChange={handleInputChange}
                  label="Bill Type"
                >
                  <MenuItem value="Goods Bill">Goods Bill</MenuItem>
                  <MenuItem value="AMC">AMC</MenuItem>
                </Select>
                {formErrors.BillType && (
                  <FormHelperText>{formErrors.BillType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* RX Details */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="No. of RX"
                name="NoOfRx"
                type="number"
                value={formData.NoOfRx}
                onChange={handleInputChange}
                error={!!formErrors.NoOfRx}
                helperText={formErrors.NoOfRx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="RX Amount"
                name="RxAmount"
                type="number"
                value={formData.RxAmount}
                onChange={handleInputChange}
                error={!!formErrors.RxAmount}
                helperText={formErrors.RxAmount}
              />
            </Grid>

            {/* TX Details */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="No. of TX"
                name="NoOfTx"
                type="number"
                value={formData.NoOfTx}
                onChange={handleInputChange}
                error={!!formErrors.NoOfTx}
                helperText={formErrors.NoOfTx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="TX Amount"
                name="TxAmount"
                type="number"
                value={formData.TxAmount}
                onChange={handleInputChange}
                error={!!formErrors.TxAmount}
                helperText={formErrors.TxAmount}
              />
            </Grid>

            {/* IDs */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="RM ID"
                name="RMId"
                value={formData.RMId}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="MB ID"
                name="MBId"
                value={formData.MBId}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Invoice Amount */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Invoice Amount *"
                name="InvoiceAmount"
                type="number"
                value={formData.InvoiceAmount}
                onChange={handleInputChange}
                error={!!formErrors.InvoiceAmount}
                helperText={formErrors.InvoiceAmount}
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Date"
                name="DateInvoice"
                type="date"
                value={formData.DateInvoice}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Amount Received */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Amount Received"
                name="AmountReceived"
                type="number"
                value={formData.AmountReceived}
                onChange={handleInputChange}
                error={!!formErrors.AmountReceived}
                helperText={formErrors.AmountReceived}
              />
            </Grid>

            {/* File Uploads */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: colors.textPrimary }}
              >
                Document Uploads
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<FileUploadIcon />}
                sx={{ height: 56, justifyContent: "flex-start" }}
              >
                RM Copy
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "rm_copy")}
                />
              </Button>
              {fileNames.rm_copy && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", color: colors.success }}
                >
                  Selected: {fileNames.rm_copy}
                </Typography>
              )}
              {invoiceDialog.mode === "edit" &&
                invoiceDialog.data?.rm_copy &&
                !fileNames.rm_copy && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: colors.textSecondary,
                    }}
                  >
                    Current: {invoiceDialog.data.rm_copy.split("/").pop()}
                  </Typography>
                )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<FileUploadIcon />}
                sx={{ height: 56, justifyContent: "flex-start" }}
              >
                MB Copy
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "mb_copy")}
                />
              </Button>
              {fileNames.mb_copy && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", color: colors.success }}
                >
                  Selected: {fileNames.mb_copy}
                </Typography>
              )}
              {invoiceDialog.mode === "edit" &&
                invoiceDialog.data?.mb_copy &&
                !fileNames.mb_copy && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: colors.textSecondary,
                    }}
                  >
                    Current: {invoiceDialog.data.mb_copy.split("/").pop()}
                  </Typography>
                )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<FileUploadIcon />}
                sx={{ height: 56, justifyContent: "flex-start" }}
              >
                Invoice Copy
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "invoice_copy")}
                />
              </Button>
              {fileNames.invoice_copy && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", color: colors.success }}
                >
                  Selected: {fileNames.invoice_copy}
                </Typography>
              )}
              {invoiceDialog.mode === "edit" &&
                invoiceDialog.data?.copy &&
                !fileNames.invoice_copy && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: colors.textSecondary,
                    }}
                  >
                    Current: {invoiceDialog.data.copy.split("/").pop()}
                  </Typography>
                )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={actionLoading}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: colors.primary,
              "&:hover": { backgroundColor: "#115293" },
            }}
          >
            {invoiceDialog.mode === "create" ? "Create" : "Update"}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        {detailDialog.invoice && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                    Invoice #
                    {detailDialog.invoice.invoice_number ||
                      detailDialog.invoice.id}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: colors.textSecondary }}
                  >
                    ID: {detailDialog.invoice.id}
                  </Typography>
                </Box>
                {getStatusChip(detailDialog.invoice)}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                sx={{ mb: 2 }}
              >
                <Tab label="Invoice Details" />
                <Tab label="Documents" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.invoice_number || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      LOA
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.loa}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Section
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.section}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Station
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.station}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Bill Type
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.bill_type || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      No. of RX
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.no_of_rx || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      RX Amount
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatCurrency(detailDialog.invoice.rx_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      No. of TX
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.no_of_tx || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      TX Amount
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatCurrency(detailDialog.invoice.tx_amount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      RM ID
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.rm_id || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      MB ID
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.invoice.mb_id || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(detailDialog.invoice.date_invoice)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Invoice Amount
                    </Typography>
                    <Typography variant="h6" sx={{ color: colors.primary }}>
                      {formatCurrency(detailDialog.invoice.invoice_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Amount Received
                    </Typography>
                    <Typography variant="h6" sx={{ color: colors.success }}>
                      {formatCurrency(detailDialog.invoice.amount_received)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color:
                          parseFloat(detailDialog.invoice.invoice_amount) -
                            parseFloat(
                              detailDialog.invoice.amount_received || 0,
                            ) >
                          0
                            ? colors.warning
                            : colors.success,
                      }}
                    >
                      {formatCurrency(
                        parseFloat(detailDialog.invoice.invoice_amount) -
                          parseFloat(detailDialog.invoice.amount_received || 0),
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          gutterBottom
                        >
                          RM Copy
                        </Typography>
                        {detailDialog.invoice.rm_copy ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ mb: 1, wordBreak: "break-all" }}
                            >
                              {detailDialog.invoice.rm_copy.split("/").pop()}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon />}
                                onClick={() =>
                                  handleViewDocument(
                                    detailDialog.invoice.rm_copy,
                                  )
                                }
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() =>
                                  handleDownloadDocument(
                                    detailDialog.invoice.rm_copy,
                                    `RM_${detailDialog.invoice.id}.pdf`,
                                  )
                                }
                              >
                                Download
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No document uploaded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          gutterBottom
                        >
                          MB Copy
                        </Typography>
                        {detailDialog.invoice.mb_copy ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ mb: 1, wordBreak: "break-all" }}
                            >
                              {detailDialog.invoice.mb_copy.split("/").pop()}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon />}
                                onClick={() =>
                                  handleViewDocument(
                                    detailDialog.invoice.mb_copy,
                                  )
                                }
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() =>
                                  handleDownloadDocument(
                                    detailDialog.invoice.mb_copy,
                                    `MB_${detailDialog.invoice.id}.pdf`,
                                  )
                                }
                              >
                                Download
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No document uploaded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          gutterBottom
                        >
                          Invoice Copy
                        </Typography>
                        {detailDialog.invoice.copy ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ mb: 1, wordBreak: "break-all" }}
                            >
                              {detailDialog.invoice.copy.split("/").pop()}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon />}
                                onClick={() =>
                                  handleViewDocument(detailDialog.invoice.copy)
                                }
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() =>
                                  handleDownloadDocument(
                                    detailDialog.invoice.copy,
                                    `Invoice_${detailDialog.invoice.id}.pdf`,
                                  )
                                }
                              >
                                Download
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No document uploaded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailDialog}>Close</Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleCloseDetailDialog();
                  handleOpenEditDialog(detailDialog.invoice);
                }}
                sx={{
                  backgroundColor: colors.warning,
                  "&:hover": { backgroundColor: "#b26a00" },
                }}
              >
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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
    </>
  );
};

export default InvoiceManagement;
