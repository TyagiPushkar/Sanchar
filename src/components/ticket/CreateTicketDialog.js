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
    LOA: ""
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
      const [techResponse, stationResponse] = await Promise.all([
        fetch("https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1"),
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/buyer_list.php")
      ])

      const [techData, stationData] = await Promise.all([
        techResponse.json(),
        stationResponse.json()
      ])

      if (techData.success) {
        setTechnicians(techData.data.filter(emp => emp.Role === "Technician"))
      }

      if (stationData.success) {
        setStations(stationData.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setSnackbar({
        open: true,
        message: "Failed to load data",
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
      LOA: ""
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.empId) newErrors.empId = "Technician is required"
    if (!formData.station) newErrors.station = "Station is required"
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required"
    if (!formData.LOA.trim()) newErrors.LOA = "LOA is required"
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required"
    } else if (formData.contactNumber.length < 10) {
      newErrors.contactNumber = "Invalid contact number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const selectedTechnician = technicians.find(tech => tech.EmpId === formData.empId)

      const formDataToSend = new FormData()
      formDataToSend.append("Milestone", "Support Ticket")
      formDataToSend.append("MenuId", "7")
      formDataToSend.append("EmpName", selectedTechnician?.Name || "")
      formDataToSend.append("EmpId", formData.empId)
      formDataToSend.append("Station", formData.station)
      formDataToSend.append("Status", "Assigned")
      formDataToSend.append("Remark", formData.remark)
      formDataToSend.append("ContactPerson", formData.contactPerson)
      formDataToSend.append("ContactNumber", formData.contactNumber)
      formDataToSend.append("LOA", formData.LOA)

      const response = await fetch("https://namami-infotech.com/SANCHAR/src/support/create_ticket.php", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.success) {
        setSnackbar({
          open: true,
          message: "Ticket created successfully",
          severity: "success",
        })
        onTicketCreated()
        onClose()
      } else {
        throw new Error(result.message || "Failed to create ticket")
      }
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Create Support Ticket</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign a technician to resolve an issue
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {dataLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                 <TextField
                label="LOA"
                value={formData.LOA}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, LOA: e.target.value }))
                  if (errors.LOA) setErrors(prev => ({ ...prev, LOA: "" }))
                }}
                error={!!errors.LOA}
                helperText={errors.LOA}
                required
                fullWidth
              />
              <Autocomplete
                options={stations}
                getOptionLabel={(option) => `${option.StationName} - ${option.ZoneName}`}
                value={stations.find(s => s.StationName === formData.station) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, station: newValue?.StationName || "" }))
                  if (errors.station) setErrors(prev => ({ ...prev, station: "" }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Station"
                    error={!!errors.station}
                    helperText={errors.station}
                    required
                  />
                )}
              />

              <TextField
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, contactPerson: e.target.value }))
                  if (errors.contactPerson) setErrors(prev => ({ ...prev, contactPerson: "" }))
                }}
                error={!!errors.contactPerson}
                helperText={errors.contactPerson}
                required
                fullWidth
              />

             

              <TextField
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, contactNumber: e.target.value }))
                  if (errors.contactNumber) setErrors(prev => ({ ...prev, contactNumber: "" }))
                }}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
                required
                fullWidth
              />

              <Autocomplete
                options={technicians}
                getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
                value={technicians.find(t => t.EmpId === formData.empId) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, empId: newValue?.EmpId || "" }))
                  if (errors.empId) setErrors(prev => ({ ...prev, empId: "" }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Technician"
                    error={!!errors.empId}
                    helperText={errors.empId}
                    required
                  />
                )}
              />

              <TextField
                label="Remarks (Optional)"
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <LoadingButton 
            onClick={handleSubmit} 
            loading={loading} 
            variant="contained"
            disabled={dataLoading}
          >
            Create Ticket
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CreateTicketDialog