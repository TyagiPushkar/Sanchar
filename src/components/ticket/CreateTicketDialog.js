"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
} from "@mui/material"
import { LoadingButton } from "@mui/lab"

const CreateTicketDialog = ({ open, onClose, onTicketCreated }) => {
  const [formData, setFormData] = useState({
    empId: "",
    station: "",
    contactPerson: "",
    contactNumber: "",
    remark: "",
  })
  const [technicians, setTechnicians] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })

  useEffect(() => {
    if (open) {
      fetchData()
      resetForm()
    }
  }, [open])

  const fetchData = async () => {
    try {
      setDataLoading(true)

      // Fetch technicians
      const techResponse = await fetch(
        "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
      )
      const techData = await techResponse.json()

      if (techData.success) {
        const filteredTechnicians = techData.data.filter((emp) => emp.Role === "Technician")
        setTechnicians(filteredTechnicians)
      }

      // Fetch stations
      const stationResponse = await fetch("https://namami-infotech.com/SANCHAR/src/buyer/buyer_list.php")
      const stationData = await stationResponse.json()

      if (stationData.success) {
        setStations(stationData.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setSnackbar({
        open: true,
        message: "Failed to load technicians and stations data",
        severity: "error",
      })
    } finally {
      setDataLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      empId: "",
      station: "",
      contactPerson: "",
      contactNumber: "",
      remark: "",
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.empId) {
      newErrors.empId = "Please select a technician"
    }
    if (!formData.station) {
      newErrors.station = "Please select a station"
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required"
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required"
    } else if (formData.contactNumber.length < 10) {
      newErrors.contactNumber = "Contact number must be at least 10 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const selectedTechnician = technicians.find((tech) => tech.EmpId === formData.empId)

      const submitData = new FormData()
      submitData.append("Milestone", "Support Ticket")
      submitData.append("MenuId", "7")
      submitData.append("EmpName", selectedTechnician?.Name || "")
      submitData.append("EmpId", formData.empId)
      submitData.append("Station", formData.station)
      submitData.append("Status", "Assigned")
      submitData.append("Remark", formData.remark || "")
      submitData.append("ContactPerson", formData.contactPerson)
      submitData.append("ContactNumber", formData.contactNumber)

      const response = await fetch("https://namami-infotech.com/SANCHAR/src/support/create_ticket.php", {
        method: "POST",
        body: submitData,
      })

      const result = await response.json()

      if (result.success) {
        setSnackbar({
          open: true,
          message: "Support ticket created successfully",
          severity: "success",
        })
        onTicketCreated()
      } else {
        throw new Error(result.message || "Failed to create ticket")
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      setSnackbar({
        open: true,
        message: "Failed to create support ticket",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Create New Support Ticket
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the details to create a new support ticket for a technician.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {dataLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Loading data...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
              

              <Autocomplete
                 fullWidth
                 options={stations}
                 getOptionLabel={(option) =>
                   `${option.StationName} - ${option.ZoneName}`
                 }
                 value={stations.find((s) => s.StationName === formData.station) || null}
                 onChange={(event, newValue) => {
                   setFormData((prev) => ({
                     ...prev,
                     station: newValue ? newValue.StationName : "",
                   }))
                   if (errors.station) {
                     setErrors((prev) => ({ ...prev, station: "" }))
                   }
                 }}
                 renderInput={(params) => (
                   <TextField
                     {...params}
                     label="Station"
                     error={!!errors.station}
                     helperText={errors.station}
                   />
                 )}
              />

              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleInputChange("contactPerson")}
                error={!!errors.contactPerson}
                helperText={errors.contactPerson}
                placeholder="Enter contact person name"
              />

              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange("contactNumber")}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
                placeholder="Enter contact number"
              />

              {/* Remark */}
              <TextField
                fullWidth
                label="Remark (Optional)"
                value={formData.remark}
                onChange={handleInputChange("remark")}
                multiline
                rows={3}
                placeholder="Enter any additional remarks"
                              />
              <Autocomplete
                   fullWidth
                   options={technicians}
                   getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
                   value={technicians.find((t) => t.EmpId === formData.empId) || null}
                   onChange={(event, newValue) => {                 
                   setFormData((prev) => ({
                     ...prev,
                     empId: newValue ? newValue.EmpId : "",
                   }))
                   if (errors.empId) {
                     setErrors((prev) => ({ ...prev, empId: "" }))
                   }
                   }}
                   renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Technician"
                      error={!!errors.empId}
                      helperText={errors.empId}
                    />
                   )}
             />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={loading} variant="contained" disabled={dataLoading}>
            Create Ticket
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CreateTicketDialog
