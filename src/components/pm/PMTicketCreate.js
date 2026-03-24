// "use client";

// import { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   Box,
//   Typography,
//   CircularProgress,
//   Alert,
//   Snackbar,
//   Autocomplete,
//   Chip,
//   Checkbox,
// } from "@mui/material";
// import { LoadingButton } from "@mui/lab";
// import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
// import CheckBoxIcon from "@mui/icons-material/CheckBox";

// const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
// const checkedIcon = <CheckBoxIcon fontSize="small" />;

// const PMTicketCreate = ({ open, onClose, onTicketCreated }) => {
//   const [formData, setFormData] = useState({
//     empId: "",
//     stations: [], // Will store selected station objects
//     remark: "",
//     loa: "",
//     section: "", // New field for section
//   });

//   const [loaOptions, setLoaOptions] = useState([]); // Will store LOA objects with sections
//   const [sectionOptions, setSectionOptions] = useState([]); // Sections for selected LOA
//   const [technicians, setTechnicians] = useState([]);
//   const [availableStations, setAvailableStations] = useState([]); // Station objects for selected LOA
//   const [loading, setLoading] = useState(false);
//   const [dataLoading, setDataLoading] = useState(true);
//   const [errors, setErrors] = useState({});
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   useEffect(() => {
//     if (open) {
//       fetchData();
//       resetForm();
//     }
//   }, [open]);

//   const fetchData = async () => {
//     try {
//       setDataLoading(true);

//       // Fetch technicians, station list with LOA, and section list
//       const [techResponse, stationResponse, sectionResponse] =
//         await Promise.all([
//           fetch(
//             "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
//           ),
//           fetch(
//             "https://namami-infotech.com/SANCHAR/src/buyer/station_list.php",
//           ),
//           fetch(
//             "https://namami-infotech.com/SANCHAR/src/buyer/section_list.php",
//           ),
//         ]);

//       const [techData, stationData, sectionData] = await Promise.all([
//         techResponse.json(),
//         stationResponse.json(),
//         sectionResponse.json(),
//       ]);

//       if (techData.success) {
//         setTechnicians(
//           techData.data.filter(
//             (emp) => emp.Role === "Technician" && emp.IsActive === 1,
//           ),
//         );
//       }

//       if (stationData.success) {
//         setLoaOptions(stationData.data);
//       }

//       if (sectionData.success) {
//         // Store section data for later use when LOA is selected
//         setSectionOptions(sectionData.data);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setSnackbar({
//         open: true,
//         message: "Failed to load data",
//         severity: "error",
//       });
//     } finally {
//       setDataLoading(false);
//     }
//   };

//   // Update sections when LOA changes
//   useEffect(() => {
//     if (formData.loa) {
//       // Find sections for selected LOA from section_list.php data
//       const selectedLoaSection = sectionOptions.find(
//         (item) => item.LOA === formData.loa,
//       );

//       // Set sections as strings array
//       setFormData((prev) => ({
//         ...prev,
//         sections: selectedLoaSection?.Sections || [],
//         section: "", // Reset selected section when LOA changes
//       }));

//       // Get stations for this LOA from station_list.php
//       const selectedLoaObj = loaOptions.find(
//         (item) => item.LOA === formData.loa,
//       );

//       // Convert station strings to objects for consistent handling
//       const stationsAsObjects = (selectedLoaObj?.Stations || []).map(
//         (station) => ({
//           StationName: station,
//         }),
//       );
//       setAvailableStations(stationsAsObjects);

//       // Clear selected stations
//       setFormData((prev) => ({
//         ...prev,
//         stations: [],
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         sections: [],
//         section: "",
//         stations: [],
//       }));
//       setAvailableStations([]);
//     }
//   }, [formData.loa, loaOptions, sectionOptions]);

//   // Filter stations based on selected section
//   const getFilteredStations = () => {
//     if (!formData.section || !availableStations.length) {
//       return availableStations;
//     }
//     // This assumes station names might contain section information
//     // You may need to adjust this logic based on how stations are related to sections
//     return availableStations.filter(
//       (station) =>
//         station.StationName.includes(formData.section) ||
//         station.StationName.includes(
//           formData.section.replace(/\s*\([^)]*\)\s*/, ""),
//         ), // Remove code in parentheses for matching
//     );
//   };

//   const resetForm = () => {
//     setFormData({
//       empId: "",
//       stations: [],
//       remark: "",
//       loa: "",
//       section: "",
//     });
//     setErrors({});
//     setAvailableStations([]);
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.empId) newErrors.empId = "Technician is required";
//     if (!formData.stations || formData.stations.length === 0) {
//       newErrors.stations = "At least one station is required";
//     }
//     if (!formData.loa?.trim()) newErrors.loa = "LOA is required";
//     if (!formData.section?.trim()) newErrors.section = "Section is required";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       const selectedTechnician = technicians.find(
//         (tech) => tech.EmpId === formData.empId,
//       );

//       // Extract station names for the payload
//       const stationNames = formData.stations.map((s) => s.StationName);

//       const payload = {
//         Milestone: "PM",
//         MenuId: "11",
//         EmpName: selectedTechnician?.Name || "",
//         EmpId: formData.empId,
//         Stations: stationNames, // Array of station names
//         Status: "Assigned",
//         Remark: formData.remark || "",
//         LOA: formData.loa,
//         Section: formData.section, // Include section in payload
//       };

//       const response = await fetch(
//         "https://namami-infotech.com/SANCHAR/src/pm/create_ticket.php",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         },
//       );

//       const result = await response.json();

//       if (result.success) {
//         setSnackbar({
//           open: true,
//           message: "Ticket created successfully",
//           severity: "success",
//         });
//         onTicketCreated();
//         onClose();
//       } else {
//         throw new Error(result.message || "Failed to create ticket");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setSnackbar({
//         open: true,
//         message: error.message,
//         severity: "error",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter LOAs that have sections (remove empty LOA entries)
//   const filteredLoaOptions = loaOptions.filter(
//     (item) => item.LOA && item.LOA.trim() !== "",
//   );

//   return (
//     <>
//       <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           <Typography variant="h6">Assign PM WORK</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Assign a technician for PM Work
//           </Typography>
//         </DialogTitle>

//         <DialogContent dividers>
//           {dataLoading ? (
//             <Box display="flex" justifyContent="center" py={4}>
//               <CircularProgress />
//             </Box>
//           ) : (
//             <Box
//               sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}
//             >
//               {/* LOA Selection */}
//               <Autocomplete
//                 options={filteredLoaOptions.map((item) => item.LOA)}
//                 value={formData.loa || null}
//                 onChange={(e, newValue) => {
//                   setFormData((prev) => ({ ...prev, loa: newValue || "" }));
//                   if (errors.loa) setErrors((prev) => ({ ...prev, loa: "" }));
//                 }}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label="LOA"
//                     error={!!errors.loa}
//                     helperText={errors.loa}
//                     required
//                     fullWidth
//                   />
//                 )}
//               />

//               {/* Section Selection - New Dropdown */}
//               <Autocomplete
//                 options={formData.sections || []}
//                 value={formData.section || null}
//                 onChange={(e, newValue) => {
//                   setFormData((prev) => ({ ...prev, section: newValue || "" }));
//                   if (errors.section)
//                     setErrors((prev) => ({ ...prev, section: "" }));
//                 }}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label="Section"
//                     error={!!errors.section}
//                     helperText={errors.section}
//                     required
//                     fullWidth
//                     placeholder={
//                       formData.loa ? "Select section" : "Select LOA first"
//                     }
//                   />
//                 )}
//                 disabled={!formData.loa || formData.sections?.length === 0}
//                 noOptionsText={
//                   !formData.loa
//                     ? "Select LOA first"
//                     : formData.sections?.length === 0
//                       ? "No sections available for this LOA"
//                       : "No options"
//                 }
//               />

//               {/* Station Selection with Checkboxes inside Autocomplete */}
//               <Autocomplete
//                 multiple
//                 options={getFilteredStations()}
//                 disableCloseOnSelect
//                 getOptionLabel={(option) => option.StationName}
//                 value={formData.stations}
//                 onChange={(e, newValue) => {
//                   setFormData((prev) => ({
//                     ...prev,
//                     stations: newValue,
//                   }));
//                   if (errors.stations) {
//                     setErrors((prev) => ({ ...prev, stations: "" }));
//                   }
//                 }}
//                 renderOption={(props, option, { selected }) => (
//                   <li {...props}>
//                     <Checkbox
//                       icon={icon}
//                       checkedIcon={checkedIcon}
//                       style={{ marginRight: 8 }}
//                       checked={selected}
//                     />
//                     {option.StationName}
//                   </li>
//                 )}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label="Stations"
//                     error={!!errors.stations}
//                     helperText={errors.stations}
//                     required
//                     placeholder={
//                       getFilteredStations().length > 0
//                         ? "Select stations"
//                         : formData.section
//                           ? "No stations in this section"
//                           : "Select LOA and Section first"
//                     }
//                   />
//                 )}
//                 renderTags={(value, getTagProps) =>
//                   value.map((option, index) => (
//                     <Chip
//                       label={option.StationName}
//                       size="small"
//                       {...getTagProps({ index })}
//                     />
//                   ))
//                 }
//                 disabled={
//                   !formData.section || getFilteredStations().length === 0
//                 }
//                 noOptionsText={
//                   !formData.loa
//                     ? "Select LOA first"
//                     : !formData.section
//                       ? "Select section first"
//                       : getFilteredStations().length === 0
//                         ? "No stations in this section"
//                         : "No stations available"
//                 }
//               />

//               {/* Technician Selection */}
//               <Autocomplete
//                 options={technicians}
//                 getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
//                 value={
//                   technicians.find((t) => t.EmpId === formData.empId) || null
//                 }
//                 onChange={(e, newValue) => {
//                   setFormData((prev) => ({
//                     ...prev,
//                     empId: newValue?.EmpId || "",
//                   }));
//                   if (errors.empId)
//                     setErrors((prev) => ({ ...prev, empId: "" }));
//                 }}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label="Technician"
//                     error={!!errors.empId}
//                     helperText={errors.empId}
//                     required
//                   />
//                 )}
//               />
//             </Box>
//           )}
//         </DialogContent>

//         <DialogActions>
//           <Button onClick={onClose} disabled={loading}>
//             Cancel
//           </Button>
//           <LoadingButton
//             onClick={handleSubmit}
//             loading={loading}
//             variant="contained"
//             disabled={dataLoading}
//           >
//             Create Ticket
//           </LoadingButton>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
//       >
//         <Alert
//           severity={snackbar.severity}
//           onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </>
//   );
// };

// export default PMTicketCreate;

// -------------------------------

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
    stations: [],
    remark: "",
    loa: "",
    section: "",
    sections: [],
  });

  const [loaOptions, setLoaOptions] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
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

  // 🔥 FETCH DATA (ONLY 2 APIs NOW)
  const fetchData = async () => {
    try {
      setDataLoading(true);

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

  // 🔥 LOA CHANGE → LOAD SECTIONS
  useEffect(() => {
    if (formData.loa) {
      const selectedLoaObj = loaOptions.find(
        (item) => item.LOA === formData.loa,
      );

      const sections = selectedLoaObj?.Sections || [];

      setFormData((prev) => ({
        ...prev,
        sections: sections.map((s) => s.SectionName),
        section: "",
        stations: [],
      }));

      setAvailableStations([]);
    } else {
      setFormData((prev) => ({
        ...prev,
        sections: [],
        section: "",
        stations: [],
      }));
      setAvailableStations([]);
    }
  }, [formData.loa, loaOptions]);

  // 🔥 SECTION CHANGE → LOAD STATIONS
  useEffect(() => {
    if (formData.loa && formData.section) {
      const selectedLoaObj = loaOptions.find(
        (item) => item.LOA === formData.loa,
      );

      const selectedSection = selectedLoaObj?.Sections?.find(
        (sec) => sec.SectionName === formData.section,
      );

      const stations = selectedSection?.Stations || [];

      const stationsObj = stations.map((s) => ({
        StationName: s,
      }));

      setAvailableStations(stationsObj);

      setFormData((prev) => ({
        ...prev,
        stations: [],
      }));
    } else {
      setAvailableStations([]);
    }
  }, [formData.section, formData.loa, loaOptions]);

  const resetForm = () => {
    setFormData({
      empId: "",
      stations: [],
      remark: "",
      loa: "",
      section: "",
      sections: [],
    });
    setErrors({});
    setAvailableStations([]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.empId) newErrors.empId = "Technician is required";
    if (!formData.stations.length)
      newErrors.stations = "At least one station is required";
    if (!formData.loa) newErrors.loa = "LOA is required";
    if (!formData.section) newErrors.section = "Section is required";

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

      const payload = {
        Milestone: "PM",
        MenuId: "11",
        EmpName: selectedTechnician?.Name || "",
        EmpId: formData.empId,
        Stations: formData.stations.map((s) => s.StationName),
        Status: "Assigned",
        Remark: formData.remark || "",
        LOA: formData.loa,
        Section: formData.section,
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
        throw new Error(result.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLoaOptions = loaOptions
    .filter((item) => item.LOA)
    .map((item) => item.LOA);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Assign PM WORK</Typography>
        </DialogTitle>

        <DialogContent>
          {dataLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {/* LOA */}
              <Autocomplete
                options={filteredLoaOptions}
                value={formData.loa || null}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, loa: val || "" }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="LOA" error={!!errors.loa} />
                )}
              />

              {/* SECTION */}
              <Autocomplete
                options={formData.sections}
                value={formData.section || null}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, section: val || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Section"
                    error={!!errors.section}
                  />
                )}
                disabled={!formData.loa}
              />

              {/* STATIONS */}
              <Autocomplete
                multiple
                options={availableStations}
                disableCloseOnSelect
                getOptionLabel={(o) => o.StationName}
                value={formData.stations}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, stations: val }))
                }
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      checked={selected}
                    />
                    {option.StationName}
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((opt, i) => (
                    <Chip
                      label={opt.StationName}
                      {...getTagProps({ index: i })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stations"
                    error={!!errors.stations}
                  />
                )}
                disabled={!formData.section}
              />

              {/* TECHNICIAN */}
              <Autocomplete
                options={technicians}
                getOptionLabel={(o) => `${o.Name} (${o.EmpId})`}
                value={
                  technicians.find((t) => t.EmpId === formData.empId) || null
                }
                onChange={(e, val) =>
                  setFormData((p) => ({
                    ...p,
                    empId: val?.EmpId || "",
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Technician"
                    error={!!errors.empId}
                  />
                )}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton onClick={handleSubmit} loading={loading}>
            Create Ticket
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default PMTicketCreate;
