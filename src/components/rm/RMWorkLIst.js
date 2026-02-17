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
  LinearProgress,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
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

const RMWorkList = () => {
  const [loaOptions, setLoaOptions] = useState([]);
  const [selectedLOA, setSelectedLOA] = useState(null);
  const [allSections, setAllSections] = useState([]); // All sections from all LOAs
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uploadDialog, setUploadDialog] = useState({
    open: false,
    section: null,
    loa: null,
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [documents, setDocuments] = useState({}); // Store uploaded documents per section+loa
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch LOA data and uploaded documents on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter sections based on search term and selected LOA
  useEffect(() => {
    let filtered = [...allSections];

    // Filter by selected LOA if any
    if (selectedLOA) {
      filtered = filtered.filter((item) => item.loa === selectedLOA.LOA);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.section.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredSections(filtered);
    setPage(0); // Reset to first page on filter change
  }, [searchTerm, selectedLOA, allSections]);

  const fetchData = async () => {
    try {
      setDataLoading(true);

      // Fetch LOA sections and uploaded documents in parallel
      const [sectionsResponse, uploadsResponse] = await Promise.all([
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/section_list.php"),
        fetch("https://namami-infotech.com/SANCHAR/src/rm/get_rm_uploads.php"),
      ]);

      const sectionsData = await sectionsResponse.json();
      const uploadsData = await uploadsResponse.json();

      if (sectionsData.success) {
        // Filter out empty LOA and create options for Autocomplete
        const validLOAs = sectionsData.data.filter((item) => item.LOA);
        setLoaOptions(validLOAs);

        // Create flat list of all sections with their LOA
        const allSectionsList = [];
        sectionsData.data.forEach((item) => {
          if (item.Sections && Array.isArray(item.Sections)) {
            item.Sections.forEach((section) => {
              allSectionsList.push({
                loa: item.LOA || "No LOA",
                section: section,
                id: `${item.LOA}-${section}`.replace(/[^a-zA-Z0-9]/g, "-"),
              });
            });
          }
        });
        setAllSections(allSectionsList);
      }

      // Process uploaded documents
      if (uploadsData.success && uploadsData.data) {
        const docsMap = {};
        uploadsData.data.forEach((upload) => {
          const key = `${upload.LOA}-${upload.Section}`.replace(
            /[^a-zA-Z0-9]/g,
            "-",
          );
          docsMap[key] = {
            id: upload.Id,
            name: upload.FilePath.split("/").pop(),
            path: upload.FilePath,
            uploadedAt: upload.UploadDateTime,
            loa: upload.LOA,
            section: upload.Section,
            url: `https://namami-infotech.com/SANCHAR/${upload.FilePath}`,
          };
        });
        setDocuments(docsMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load data",
        severity: "error",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleLOAChange = (event, newValue) => {
    setSelectedLOA(newValue);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUploadClick = (section, loa) => {
    setSelectedFile(null);
    setUploadDialog({ open: true, section, loa });
  };

  const handleCloseUploadDialog = () => {
    setUploadDialog({ open: false, section: null, loa: null });
    setUploadProgress({});
    setSelectedFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: "Please select a file",
        severity: "warning",
      });
      return;
    }

    const section = uploadDialog.section;
    const loa = uploadDialog.loa;

    try {
      setUploading(true);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [section]: Math.min((prev[section] || 0) + 10, 90),
        }));
      }, 200);

      // Create form data for file upload with exact payload structure
      const formData = new FormData();
      formData.append("file", selectedFile); // binary file
      formData.append("LOA", loa); // LOA string
      formData.append("Section", section); // Section string

      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/rm/upload_rm_file.php",
        {
          method: "POST",
          body: formData,
        },
      );

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success) {
        setUploadProgress((prev) => ({ ...prev, [section]: 100 }));

        // Refresh the uploads list
        const uploadsResponse = await fetch(
          "https://namami-infotech.com/SANCHAR/src/rm/get_rm_uploads.php",
        );
        const uploadsData = await uploadsResponse.json();

        if (uploadsData.success && uploadsData.data) {
          const docsMap = { ...documents };
          uploadsData.data.forEach((upload) => {
            const key = `${upload.LOA}-${upload.Section}`.replace(
              /[^a-zA-Z0-9]/g,
              "-",
            );
            docsMap[key] = {
              id: upload.Id,
              name: upload.FilePath.split("/").pop(),
              path: upload.FilePath,
              uploadedAt: upload.UploadDateTime,
              loa: upload.LOA,
              section: upload.Section,
              url: `https://namami-infotech.com/SANCHAR/${upload.FilePath}`,
            };
          });
          setDocuments(docsMap);
        }

        setSnackbar({
          open: true,
          message: `Document uploaded successfully for ${section}`,
          severity: "success",
        });

        // Close dialog after successful upload
        setTimeout(() => {
          handleCloseUploadDialog();
        }, 1000);
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to upload document",
        severity: "error",
      });
      setUploadProgress((prev) => ({ ...prev, [section]: 0 }));
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (url) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  if (dataLoading) {
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
  const paginatedSections = filteredSections.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <Box sx={{ p: 3 }}>
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
              RM Work List
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Total Sections: {filteredSections.length} |
              {selectedLOA
                ? ` Selected LOA: ${selectedLOA.LOA}`
                : " Showing all LOAs"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* LOA Autocomplete */}
            <Box sx={{ minWidth: 400 }}>
              <Autocomplete
                options={loaOptions}
                getOptionLabel={(option) => option.LOA}
                value={selectedLOA}
                onChange={handleLOAChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by LOA"
                    size="small"
                    placeholder="Search LOA..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {option.LOA}
                    </Typography>
                  </li>
                )}
              />
            </Box>

            {/* Search Field */}
            <TextField
              placeholder="Search sections..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
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
          </Box>
        </Box>

        {/* Table Section */}
        {filteredSections.length > 0 ? (
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
                      LOA
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Section Name
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Document Status
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                      Uploaded Date
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
                  {paginatedSections.map((item, index) => {
                    const doc = documents[item.id];
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
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: colors.textPrimary,
                              fontSize: "0.875rem",
                            }}
                          >
                            {item.loa}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: colors.textPrimary,
                            }}
                          >
                            {item.section}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {doc ? (
                            <Chip
                              icon={<FileIcon sx={{ fontSize: 16 }} />}
                              label="Uploaded"
                              size="small"
                              sx={{
                                backgroundColor: colors.success,
                                color: "white",
                                "& .MuiChip-icon": { color: "white" },
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                          ) : (
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
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: colors.textSecondary,
                            fontSize: "0.875rem",
                          }}
                        >
                          {doc ? formatDate(doc.uploadedAt) : "-"}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            {doc ? (
                              <Tooltip title="View Document">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDocument(doc.url)}
                                  sx={{ color: colors.primary }}
                                >
                                  <ViewIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Upload Document">
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={
                                    <CloudUploadIcon sx={{ fontSize: 16 }} />
                                  }
                                  onClick={() =>
                                    handleUploadClick(item.section, item.loa)
                                  }
                                  sx={{
                                    backgroundColor: colors.primary,
                                    "&:hover": { backgroundColor: "#115293" },
                                    fontSize: "0.75rem",
                                    textTransform: "none",
                                    py: 0.5,
                                  }}
                                >
                                  Upload
                                </Button>
                              </Tooltip>
                            )}
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
              count={filteredSections.length}
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
            <Typography color="textSecondary">No sections found</Typography>
          </Paper>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ color: colors.textPrimary }}>
            Upload Document
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.textSecondary, mt: 0.5 }}
          >
            LOA: {uploadDialog.loa}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Section: {uploadDialog.section}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, textAlign: "center" }}>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                sx={{
                  mb: 2,
                  borderColor: colors.primary,
                  color: colors.primary,
                  minWidth: 200,
                }}
              >
                {selectedFile ? selectedFile.name : "Choose File"}
              </Button>
            </label>
            <Typography
              variant="caption"
              display="block"
              sx={{ color: colors.textSecondary }}
            >
              Supported formats: PDF, JPG, PNG
            </Typography>

            {uploadProgress[uploadDialog.section] > 0 && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress[uploadDialog.section]}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.border,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: colors.primary,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: colors.textSecondary }}
                >
                  Uploading: {uploadProgress[uploadDialog.section]}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleFileUpload}
            loading={uploading}
            variant="contained"
            disabled={!selectedFile}
            sx={{
              backgroundColor: colors.primary,
              "&:hover": { backgroundColor: "#115293" },
            }}
          >
            Upload
          </LoadingButton>
        </DialogActions>
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

export default RMWorkList;
