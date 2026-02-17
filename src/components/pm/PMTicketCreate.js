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
  Checkbox,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const PMTicketCreate = ({ open, onClose, onTicketCreated }) => {
  const [formData, setFormData] = useState({
    empId: "",
    stations: [], // Will store selected station objects
    remark: "",
    loa: "", // Changed from LOA to loa to match API
  });

  const [loaOptions, setLoaOptions] = useState([]); // Will store LOA objects with stations
  const [technicians, setTechnicians] = useState([]);
  const [availableStations, setAvailableStations] = useState([]); // Station objects for selected LOA
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

      // Fetch technicians and station list with LOA
      const [techResponse, stationResponse] = await Promise.all([
        fetch(
          "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
        ),
        fetch("https://namami-infotech.com/SANCHAR/src/buyer/station_list.php"),
      ]);

      const [techData, stationData] = await Promise.all([
        techResponse.json(),
        stationResponse.json(),
      ]);

      if (techData.success) {
        setTechnicians(
          techData.data.filter(
            (emp) => emp.Role === "Technician" && emp.IsActive === 1,
          ),
        );
      }

      if (stationData.success) {
        setLoaOptions(stationData.data);
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

  // Update available stations when LOA changes
  useEffect(() => {
    if (formData.loa) {
      const selectedLoaObj = loaOptions.find(
        (item) => item.LOA === formData.loa,
      );
      // Convert station strings to objects for consistent handling
      const stationsAsObjects = (selectedLoaObj?.Stations || []).map(
        (station) => ({
          StationName: station,
          ZoneName: "", // Zone info might not be available from this API
        }),
      );
      setAvailableStations(stationsAsObjects);

      // Clear selected stations
      setFormData((prev) => ({
        ...prev,
        stations: [],
      }));
    } else {
      setAvailableStations([]);
      setFormData((prev) => ({
        ...prev,
        stations: [],
      }));
    }
  }, [formData.loa, loaOptions]);

  const resetForm = () => {
    setFormData({
      empId: "",
      stations: [],
      remark: "",
      loa: "",
    });
    setErrors({});
    setAvailableStations([]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.empId) newErrors.empId = "Technician is required";
    if (!formData.stations || formData.stations.length === 0) {
      newErrors.stations = "At least one station is required";
    }
    if (!formData.loa?.trim()) newErrors.loa = "LOA is required";

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

      // Extract station names for the payload
      const stationNames = formData.stations.map((s) => s.StationName);

      const payload = {
        Milestone: "PM",
        MenuId: "11",
        EmpName: selectedTechnician?.Name || "",
        EmpId: formData.empId,
        Stations: stationNames, // Array of station names
        Status: "Assigned",
        Remark: formData.remark || "",
        LOA: formData.loa,
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
          <Typography variant="h6">Assign PM WORK</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign a technician for PM Work
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
              {/* LOA Selection */}
              <Autocomplete
                options={loaOptions
                  .map((item) => item.LOA)
                  .filter((loa) => loa)} // Filter out empty LOA
                value={formData.loa || null}
                onChange={(e, newValue) => {
                  setFormData((prev) => ({ ...prev, loa: newValue || "" }));
                  if (errors.loa) setErrors((prev) => ({ ...prev, loa: "" }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="LOA"
                    error={!!errors.loa}
                    helperText={errors.loa}
                    required
                    fullWidth
                  />
                )}
              />

              {/* Station Selection with Checkboxes inside Autocomplete */}
              <Autocomplete
                multiple
                options={availableStations}
                disableCloseOnSelect
                getOptionLabel={(option) => option.StationName}
                value={formData.stations}
                onChange={(e, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    stations: newValue,
                  }));
                  if (errors.stations) {
                    setErrors((prev) => ({ ...prev, stations: "" }));
                  }
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.StationName}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stations"
                    error={!!errors.stations}
                    helperText={errors.stations}
                    required
                    placeholder={
                      availableStations.length > 0
                        ? "Select stations"
                        : "Select LOA first"
                    }
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.StationName}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                disabled={!formData.loa || availableStations.length === 0}
                noOptionsText={
                  !formData.loa ? "Select LOA first" : "No stations available"
                }
              />

              {/* Technician Selection */}
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
