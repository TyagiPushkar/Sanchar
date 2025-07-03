"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Edit, X } from "lucide-react"

const API_URL = "https://namami-infotech.com/SANCHAR/src/participant"
const ROWS_PER_PAGE_OPTIONS = [5, 10, 15]
const DEFAULT_ROWS_PER_PAGE = 15

const ParticipantList = () => {
  // State management
  const [state, setState] = useState({
    records: [],
    loading: true,
    error: "",
    searchTerm: "",
    page: 0,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
    editDialogOpen: false,
    currentParticipant: null,
    editLoading: false,
    editError: "",
    editSuccess: "",
  })

  const navigate = useNavigate()

  // Derived state
  const filteredRecords = useMemo(() => {
    let result = state.records
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase()
      result = result.filter(
        (record) =>
          record.CompanyName?.toLowerCase().includes(term) ||
          record.ContactPerson?.toLowerCase().includes(term) ||
          record.Mail?.toLowerCase().includes(term) ||
          record.Mobile?.toLowerCase().includes(term),
      )
    }
    return result
  }, [state.records, state.searchTerm])

  // API calls
  const fetchParticipants = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/participant_list.php`)
      const data = await response.json()

      if (data.success) {
        setState((prev) => ({
          ...prev,
          records: data.data,
          loading: false,
          error: "",
        }))
      } else {
        setState((prev) => ({
          ...prev,
          error: "No participant data found.",
          loading: false,
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to fetch participant data.",
        loading: false,
      }))
    }
  }, [])

  // FIXED: The main issue was here - using state.currentParticipant inside setState
  const updateParticipant = useCallback(async () => {
    setState((prev) => ({ ...prev, editLoading: true, editError: "", editSuccess: "" }))

    try {
      // Get the current participant data before the API call to avoid stale state
      const participantToUpdate = state.currentParticipant

      const response = await fetch(`${API_URL}/edit_participant.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(participantToUpdate),
      })

      const data = await response.json()

      if (data.success) {
        setState((prev) => {
          // FIXED: Use participantToUpdate instead of state.currentParticipant
          const updatedRecords = prev.records.map((record) =>
            record.ID === participantToUpdate.ID ? { ...participantToUpdate } : record,
          )

          return {
            ...prev,
            editSuccess: "Participant updated successfully!",
            records: updatedRecords,
            editLoading: false,
          }
        })

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            editDialogOpen: false,
            currentParticipant: null,
            editSuccess: "",
          }))
        }, 1500)
      } else {
        setState((prev) => ({
          ...prev,
          editError: data.message || "Failed to update participant",
          editLoading: false,
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        editError: "An error occurred while updating participant",
        editLoading: false,
      }))
    }
  }, [state.currentParticipant])

  // Event handlers
  const handleSearch = (e) => {
    const value = e.target.value
    setState((prev) => ({
      ...prev,
      searchTerm: value,
      page: 0, // Reset to first page when search changes
    }))
  }

  const handleChangePage = (_, newPage) => {
    setState((prev) => ({ ...prev, page: newPage }))
  }

  const handleChangeRowsPerPage = (e) => {
    const newRowsPerPage = Number.parseInt(e.target.value, 10)
    setState((prev) => ({
      ...prev,
      rowsPerPage: newRowsPerPage,
      page: 0, // Reset to first page when rows per page changes
    }))
  }

  const handleEditClick = (participant) => {
    setState((prev) => ({
      ...prev,
      currentParticipant: { ...participant }, // Create a copy to avoid mutations
      editDialogOpen: true,
      editError: "",
      editSuccess: "",
    }))
  }

  const handleEditClose = () => {
    setState((prev) => ({
      ...prev,
      editDialogOpen: false,
      currentParticipant: null,
      editError: "",
      editSuccess: "",
    }))
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setState((prev) => ({
      ...prev,
      currentParticipant: {
        ...prev.currentParticipant,
        [name]: value,
      },
    }))
  }

  const handleEditSubmit = () => {
    updateParticipant()
  }

  // Effects
  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  // Render loading state
  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
        <CircularProgress sx={{ color: "#F69320" }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading participant data...
        </Typography>
      </Box>
    )
  }

  // Main render
  return (
    <Box p={2}>
      {/* Edit Participant Dialog */}
      <Dialog open={state.editDialogOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Participant</Typography>
            <IconButton onClick={handleEditClose}>
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {state.editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.editError}
            </Alert>
          )}
          {state.editSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {state.editSuccess}
            </Alert>
          )}
          {state.currentParticipant && (
            <Box mt={2}>
              <TextField
                fullWidth
                label="Company Name"
                name="CompanyName"
                value={state.currentParticipant.CompanyName || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Contact Person"
                name="ContactPerson"
                value={state.currentParticipant.ContactPerson || ""}
                onChange={handleEditChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Mobile"
                name="Mobile"
                value={state.currentParticipant.Mobile || ""}
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
                name="Mail"
                type="email"
                value={state.currentParticipant.Mail || ""}
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
            disabled={state.editLoading}
            sx={{
              backgroundColor: "#F69320",
              "&:hover": {
                backgroundColor: "#e08416",
              },
            }}
          >
            {state.editLoading ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Participant List */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight="bold" color="#333">
          Participant List
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Search by Company, Contact, Email or Mobile"
            variant="outlined"
            size="small"
            value={state.searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <Search size={18} color="#666" style={{ marginRight: "8px" }} />,
            }}
            sx={{
              width: 300,
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#F69320",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#F69320",
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/new-participant")}
            sx={{
              backgroundColor: "#F69320",
              "&:hover": {
                backgroundColor: "#e08416",
              },
            }}
          >
            Add Participant
          </Button>
        </Box>
      </Box>

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {state.error}
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
        }}
      >
        <Table size="medium">
          <TableHead sx={{ backgroundColor: "#F69320" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Company Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contact Person</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mobile</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mail</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">No participants found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords
                .slice(state.page * state.rowsPerPage, state.page * state.rowsPerPage + state.rowsPerPage)
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
                    <TableCell>{record.CompanyName}</TableCell>
                    <TableCell>{record.ContactPerson}</TableCell>
                    <TableCell>{record.Mobile}</TableCell>
                    <TableCell>{record.Mail}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditClick(record)} sx={{ color: "#F69320" }}>
                        <Edit size={18} />
                      </IconButton>
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
        page={state.page}
        rowsPerPage={state.rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
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
  )
}

export default ParticipantList
