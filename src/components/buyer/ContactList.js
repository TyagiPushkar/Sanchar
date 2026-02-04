"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Box,
  Button,
  Autocomplete,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

function ContactList() {
  const { user } = useAuth();
  const [tempRecords, setTempRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const navigate = useNavigate();

  const typeOptions = ["Zone", "Division", "Station"];

  useEffect(() => {
    const fetchTempData = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SANCHAR/src/buyer/contact_station_list.php",
        );
        if (response.data.success) {
          setTempRecords(response.data.data);
          setFilteredRecords(response.data.data);
        } else {
          setError("No data found.");
        }
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTempData();
  }, []);

  useEffect(() => {
    let filtered = tempRecords;

    if (typeFilter) {
      filtered = filtered.filter(
        (record) => record.Type?.toLowerCase() === typeFilter.toLowerCase(),
      );
    }

    if (searchTerm) {
      const value = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.ZoneID?.toString().toLowerCase().includes(value) ||
          record.ZoneName?.toLowerCase().includes(value) ||
          record.DivisionID?.toString().toLowerCase().includes(value) ||
          record.DivisionName?.toLowerCase().includes(value) ||
          record.StationID?.toString().toLowerCase().includes(value) ||
          record.StationName?.toLowerCase().includes(value) ||
          // Add TypeId search
          record.TypeId?.toString().toLowerCase().includes(value) ||
          // Add ContactPerson search
          record.ContactPerson?.toLowerCase().includes(value) ||
          // Also search Type (if needed)
          record.Type?.toLowerCase().includes(value),
      );
    }

    setFilteredRecords(filtered);
    setPage(0);
  }, [searchTerm, typeFilter, tempRecords]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (contact) => {
    setCurrentContact(contact);
    setEditDialogOpen(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setCurrentContact(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    // Prepare payload with consistent field names
    const payload = {
      ID: currentContact.Id || currentContact.ID, // Handle both cases
      Type: currentContact.Type,
      TypeId: currentContact.TypeId,
      ContactNumber: currentContact.ContactNumber,
      ContactPerson: currentContact.ContactPerson,
      ContactMail: currentContact.ContactMail,
    };

    try {
      const response = await axios.post(
        "https://namami-infotech.com/SANCHAR/src/buyer/edit_contact_station.php",
        payload,
      );

      if (response.data.success) {
        setEditSuccess("Contact updated successfully!");

        // Update both records states
        setTempRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.ID === currentContact.ID ? { ...currentContact } : record,
          ),
        );

        setFilteredRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.ID === currentContact.ID ? { ...currentContact } : record,
          ),
        );

        setTimeout(() => {
          setEditDialogOpen(false);
        }, 1500);
      } else {
        setEditError(response.data.message || "Failed to update contact");
      }
    } catch (err) {
      setEditError("An error occurred while updating contact");
      console.error("Edit error:", err.response?.data); // Log detailed error
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
        flexDirection="column"
      >
        <CircularProgress sx={{ color: "#F69320" }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading contact data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Edit Contact Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Edit Contact</Typography>
            <IconButton onClick={handleEditClose}>
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          {editSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {editSuccess}
            </Alert>
          )}
          {currentContact && (
            <Box mt={2}>
              <TextField
                fullWidth
                label="Type"
                name="Type"
                value={currentContact.Type || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Type ID"
                name="TypeId"
                value={currentContact.TypeId || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Contact Person"
                name="ContactPerson"
                value={currentContact.ContactPerson || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Mobile"
                name="ContactNumber"
                value={currentContact.ContactNumber || ""}
                onChange={handleEditChange}
                margin="normal"
                required
                inputProps={{
                  pattern: "[0-9]{10}",
                  title: "Please enter a 10-digit mobile number",
                }}
              />
              <TextField
                fullWidth
                label="Email"
                name="ContactMail"
                type="email"
                value={currentContact.ContactMail || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Contact List */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5" fontWeight="bold" color="#333">
          Contact List
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <Autocomplete
            options={typeOptions}
            value={typeFilter}
            onChange={(event, newValue) => setTypeFilter(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Type" size="small" />
            )}
            sx={{ width: 180 }}
            clearOnEscape
          />

          <TextField
            label="Search by Type, Type ID, or Contact Person"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <Search size={18} color="#666" style={{ marginRight: "8px" }} />
              ),
            }}
            sx={{
              width: 300,
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#F69320",
                },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#F69320",
              },
            }}
          />
          {(user.role === "Admin" || user.role === "Project Manager") && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate("/contact")}
              sx={{
                backgroundColor: "#F69320",
                "&:hover": {
                  backgroundColor: "#e08416",
                },
              }}
            >
              Add Contact
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          mb: 2,
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          width: "100%",
          maxHeight: "69vh",
          overflow: "auto",
        }}
      >
        <Table size="medium" stickyHeader>
          <TableHead sx={{ backgroundColor: "#F69320" }}>
            <TableRow>
              {[
                "Type",
                "Type ID",
                "Contact Person",
                "Mobile",
                "Mail",

                "Actions",
              ].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    backgroundColor: "#F69320", // 🔒 solid bg
                    color: "white",
                    fontWeight: "bold",
                    position: "sticky",
                    top: 0,
                    zIndex: 2, // 🔒 stay above rows
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No contacts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => (
                  <TableRow
                    key={record.ID}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(246, 147, 32, 0.04)",
                      },
                    }}
                  >
                    <TableCell>{record.Type}</TableCell>
                    <TableCell>{record.TypeId}</TableCell>
                    <TableCell>{record.ContactPerson}</TableCell>
                    <TableCell>{record.ContactNumber}</TableCell>
                    <TableCell>{record.ContactMail}</TableCell>

                    <TableCell>
                      {(user.role === "Admin" ||
                        user.role === "Project Manager") && (
                        <IconButton
                          onClick={() => handleEditClick(record)}
                          sx={{ color: "#F69320" }}
                        >
                          <Edit size={18} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRecords.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 15]}
        sx={{
          ".MuiTablePagination-selectIcon": {
            color: "#F69320",
          },
          ".MuiTablePagination-select": {
            fontWeight: 500,
          },
          ".Mui-selected": {
            backgroundColor: "#F69320 !important",
            color: "white",
          },
        }}
      />
    </Box>
  );
}

export default ContactList;