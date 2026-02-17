"use client";

import { useEffect, useState } from "react";
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
  Chip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

const PMTicketCreate = ({ open, onClose, onTicketCreated }) => {
  const [formData, setFormData] = useState({
    empId: "",
    station: [], // Changed to array for multiselect
    contactPerson: "",
    contactNumber: "",
    remark: "",
    LOA: "",
  });
  const [loaList, setLoaList] = useState([]);

  const [technicians, setTechnicians] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (open) {
      fetchData();
      resetForm();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setDataLoading(true);

      // Fetch technicians
      const [techResponse, stationResponse, loaResponse] = await Promise.all([
        fetch(
          "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
        ),
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/buyer_list.php"),
        fetch("https://namami-infotech.com/SANCHAR/src/menu/get_loa.php"),
      ]);

      const [techData, stationData, loaData] = await Promise.all([
        techResponse.json(),
        stationResponse.json(),
        loaResponse.json(),
      ]);

      if (techData.success) {
        setTechnicians(
          techData.data.filter(
            (emp) => emp.Role === "Technician" && emp.IsActive === 1,
          ),
        );
      }

      if (stationData.success) {
        setStations(stationData.data);
      }
      if (loaData.success) {
        setLoaList(loaData.data); // array of strings
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

  const resetForm = () => {
    setFormData({
      empId: "",
      station: [], // Reset to empty array
      contactPerson: "",
      contactNumber: "",
      remark: "",
      LOA: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.empId) newErrors.empId = "Technician is required";
    if (!formData.station || formData.station.length === 0) {
      newErrors.station = "At least one station is required";
    }
    if (!formData.contactPerson?.trim())
      newErrors.contactPerson = "Contact person is required";
    if (!formData.LOA?.trim()) newErrors.LOA = "LOA is required";
    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (formData.contactNumber.replace(/\D/g, "").length < 10) {
      newErrors.contactNumber = "Invalid contact number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const selectedTechnician = technicians.find(
        (tech) => tech.EmpId === formData.empId,
      );

      // Extract just the station names for the array
      const stationNames = formData.station.map((s) => s.StationName);

      const payload = {
        Milestone: "PM",
        MenuId: "11",
        EmpName: selectedTechnician?.Name || "",
        EmpId: formData.empId,
        Stations: stationNames, // This will be an array of station names
        Status: "Assigned",
        Remark: formData.remark || "",
        ContactPerson: formData.contactPerson,
        ContactNumber: formData.contactNumber,
        LOA: formData.LOA,
      };

      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/pm/create_ticket.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: "Ticket created successfully",
          severity: "success",
        });
        onTicketCreated();
        onClose();
      } else {
        throw new Error(result.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Box
              sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}
            >
              <Autocomplete
                options={loaList}
                value={formData.LOA || null}
                onChange={(e, newValue) => {
                  setFormData((prev) => ({ ...prev, LOA: newValue || "" }));
                  if (errors.LOA) setErrors((prev) => ({ ...prev, LOA: "" }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="LOA"
                    error={!!errors.LOA}
                    helperText={errors.LOA}
                    required
                    fullWidth
                  />
                )}
              />

              <Autocomplete
                multiple
                options={stations}
                getOptionLabel={(option) =>
                  `${option.StationName} - ${option.ZoneName}`
                }
                value={formData.station}
                onChange={(e, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    station: newValue,
                  }));
                  if (errors.station)
                    setErrors((prev) => ({ ...prev, station: "" }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stations"
                    error={!!errors.station}
                    helperText={errors.station}
                    required
                    placeholder="Select stations"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.StationName}
                      label={option.StationName}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                filterSelectedOptions
              />

              <TextField
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    contactPerson: e.target.value,
                  }));
                  if (errors.contactPerson)
                    setErrors((prev) => ({ ...prev, contactPerson: "" }));
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
                  setFormData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }));
                  if (errors.contactNumber)
                    setErrors((prev) => ({ ...prev, contactNumber: "" }));
                }}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
                required
                fullWidth
              />

              <Autocomplete
                options={technicians}
                getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
                value={
                  technicians.find((t) => t.EmpId === formData.empId) || null
                }
                onChange={(e, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    empId: newValue?.EmpId || "",
                  }));
                  if (errors.empId)
                    setErrors((prev) => ({ ...prev, empId: "" }));
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remark: e.target.value }))
                }
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PMTicketCreate;
