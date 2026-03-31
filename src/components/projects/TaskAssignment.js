"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useLocation, useParams } from "react-router-dom"
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Paper,
  Alert,
  Grid,
  CircularProgress,
  Divider,
  Snackbar,
  Autocomplete,
} from "@mui/material"
import { CheckCircle, LocationOn, Person, Work, Add, CalendarToday, Block } from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { styled } from "@mui/material/styles"

const milestones = [
  {
    label: "Civil and Antenna Install",
    value: "2",
    color: "#2196f3",
    bgColor: "#e3f2fd",
    phase: 1,
  },
  {
    label: "Laying Of Cable",
    value: "3",
    color: "#9c27b0",
    bgColor: "#f3e5f5",
    phase: 2,
  },
  {
    label: "Installation Of Transmitter",
    value: "4",
    color: "#4caf50",
    bgColor: "#e8f5e8",
    phase: 3,
  },
  {
    label: "Final Check & Handover",
    value: "5",
    color: "#ff9800",
    bgColor: "#fff3e0",
    phase: 4,
  },
]

const StyledCard = styled(Card)(({ theme }) => ({
  margin: "0 auto",
  borderRadius: 16,
  border: `2px solid #ffcc80`,
  boxShadow: "0 8px 32px rgba(255, 152, 0, 0.1)",
}))

const OrangeButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#ff9800",
  color: "white",
  borderRadius: 25,
  padding: "12px 32px",
  fontSize: "16px",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#f57c00",
  },
  "&:disabled": {
    backgroundColor: "#ffcc80",
  },
}))

export default function TaskAssignment() {
  const { ActivityId } = useParams() || { ActivityId: "1" }
  const [milestone, setMilestone] = useState("")
  const [stations, setStations] = useState([])
  const [availableStations, setAvailableStations] = useState([])
  const [selectedStations, setSelectedStations] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [technician, setTechnician] = useState(null)
  const [date, setDate] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submissionResults, setSubmissionResults] = useState([])
  const [existingTasks, setExistingTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const location = useLocation()
  const { tenderNo } = location.state || {}
  const { loaNo } = location.state || {}

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  const showNotification = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // Fetch existing tasks for the tender
  const fetchExistingTasks = async () => {
    if (!tenderNo) return

    setLoadingTasks(true)
    try {
      const response = await fetch(
        `https://namami-infotech.com/SANCHAR/src/task/project_task.php?TenderNo=${tenderNo}`,
      )
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setExistingTasks(data.data)
      } else {
        setExistingTasks([])
      }
    } catch (error) {
      console.error("Error fetching existing tasks:", error)
      setExistingTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  const isStationAvailableForMilestone = (stationName, selectedMilestoneValue) => {
    const selectedMilestoneData = milestones.find((m) => m.value === selectedMilestoneValue);
    if (!selectedMilestoneData) return false;
  
    const currentPhase = selectedMilestoneData.phase;
  
    // Check if station already has this milestone completed or assigned
    const hasCurrentMilestoneTask = existingTasks.some(
      (task) =>
        task.Station === stationName && 
        task.MenuId.toString() === selectedMilestoneValue && 
        (task.Status === "Complete" || task.Status === "Assigned")
    );
  
    if (hasCurrentMilestoneTask) {
      return false; // Station already has this milestone completed or assigned
    }
  
    // For phase 1 (Civil Work), all stations are available if not already assigned/completed
    if (currentPhase === 1) {
      return true;
    }
  
    // For subsequent phases, check if previous phase is completed
    const previousPhase = currentPhase - 1;
    const previousMilestone = milestones.find((m) => m.phase === previousPhase);
  
    if (!previousMilestone) return false;
  
    // Check if station has the previous phase completed
    const hasPreviousPhaseCompleted = existingTasks.some(
      (task) =>
        task.Station === stationName &&
        task.MenuId.toString() === previousMilestone.value &&
        task.Status === "Complete"
    );
  
    return hasPreviousPhaseCompleted;
  };

  // Filter available stations based on selected milestone
 // Filter available stations based on selected milestone
const filterAvailableStations = () => {
  if (!milestone) {
    setAvailableStations([]);
    return;
  }

  const filtered = stations.filter((station) => 
    isStationAvailableForMilestone(station.name, milestone)
  );

  setAvailableStations(filtered);

  // Remove selected stations that are no longer available
  setSelectedStations((prev) => 
    prev.filter((station) => 
      isStationAvailableForMilestone(station.name, milestone)
    )
  );
};

   useEffect(() => {
     // 🔴 ONLY THIS SECTION CHANGES - Fetch stations with new response format
     fetch(
       `https://namami-infotech.com/SANCHAR/src/tender/tender_stations.php?ActivityId=${ActivityId}`,
     )
       .then((res) => res.json())
       .then((data) => {
         if (data.success) {
           // Handle both old and new response formats
           let stationObjects = [];

           if (Array.isArray(data.data)) {
             // New format: { data: [{ station, section }] }
             stationObjects = data.data.map((item, index) => ({
               id: (index + 1).toString(),
               name: item.station,
               location: `Section: ${item.section}`, // You can use section info here
               section: item.section, // Store section for potential future use
             }));
           } else if (Array.isArray(data.stations)) {
             // Old format: { stations: [...] }
             stationObjects = data.stations.map((stationName, index) => ({
               id: (index + 1).toString(),
               name: stationName,
               location: `Location for ${stationName}`,
             }));
           }

           setStations(stationObjects);
         } else {
           setStations([]);
         }
       })
       .catch(() => setStations([]));

     // Fetch technicians (NO CHANGE)
     fetch(
       "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
     )
       .then((res) => res.json())
       .then((data) => {
         if (data.success) {
           const technicians = data.data.filter(
             (emp) => emp.Role === "Technician" && emp.IsActive === 1,
           );
           setTechnicians(technicians);
         } else {
           setTechnicians([]);
         }
       })
       .catch(() => setTechnicians([]));

     // Fetch existing tasks (NO CHANGE)
     fetchExistingTasks();
   }, [ActivityId, tenderNo]);

  // Update available stations when milestone or existing tasks change
  useEffect(() => {
    filterAvailableStations()
  }, [milestone, existingTasks, stations])

  const handleTechnicianChange = (event, newValue) => {
    setTechnician(newValue)
  }

  const handleSubmit = async () => {
    if (!milestone || selectedStations.length === 0 || !technician || !date) {
      showNotification("Please fill in all required fields before assigning the task.", "error")
      return
    }

    setIsLoading(true)
    setSubmissionResults([])

    const selectedMilestone = milestones.find((m) => m.value === milestone)
    const results = []

    try {
      for (const station of selectedStations) {
        const taskData = {
          Milestone: selectedMilestone.label,
          MenuId: milestone,
          EmpName: technician.Name,
          EmpId: technician.EmpId,
          Station: station.name,
          TargetDate: format(date, "yyyy-MM-dd"),
          TenderNo: tenderNo,
          LOA: loaNo,
        }

        try {
          const response = await fetch("https://namami-infotech.com/SANCHAR/src/task/add_task.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
          })

          const result = await response.json()

          results.push({
            station: station.name,
            success: result.success || response.ok,
            message: result.message || (response.ok ? "Task created successfully" : "Failed to create task"),
            data: taskData,
          })
        } catch (error) {
          results.push({
            station: station.name,
            success: false,
            message: `Error: ${error.message}`,
            data: taskData,
          })
        }
      }

      setSubmissionResults(results)

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      if (successCount === results.length) {
        showNotification(`All ${successCount} tasks assigned successfully!`, "success")
        // Refresh existing tasks after successful assignment
        fetchExistingTasks()
      } else if (successCount > 0) {
        showNotification(`${successCount} tasks assigned successfully, ${failCount} failed.`, "warning")
        // Refresh existing tasks after partial success
        fetchExistingTasks()
      } else {
        showNotification("All task assignments failed.", "error")
      }

      if (successCount === results.length) {
        setMilestone("")
        setSelectedStations([])
        setTechnician(null)
        setDate(null)
      }
    } catch (error) {
      showNotification("An error occurred while assigning tasks.", "error")
      console.error("Submission error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMilestone = milestones.find((m) => m.value === milestone)
  const getStationStatus = (stationName) => {
    if (!milestone) return null;
  
    const selectedMilestoneData = milestones.find((m) => m.value === milestone);
    if (!selectedMilestoneData) return null;
  
    // Check if already has current milestone task (completed or assigned)
    const hasCurrentTask = existingTasks.some(
      (task) => 
        task.Station === stationName && 
        task.MenuId.toString() === milestone && 
        (task.Status === "Complete" || task.Status === "Assigned")
    );
  
    if (hasCurrentTask) {
      const status = existingTasks.find(
        (task) => 
          task.Station === stationName && 
          task.MenuId.toString() === milestone
      ).Status;
      
      return { 
        type: status === "Complete" ? "completed" : "assigned",
        message: status === "Complete" 
          ? "Already completed this milestone" 
          : "Already assigned for this milestone"
      };
    }
  
    // For phases > 1, check previous phase completion
    if (selectedMilestoneData.phase > 1) {
      const previousPhase = selectedMilestoneData.phase - 1;
      const previousMilestone = milestones.find((m) => m.phase === previousPhase);
      
      if (!previousMilestone) return null;
  
      const hasPreviousPhaseCompleted = existingTasks.some(
        (task) =>
          task.Station === stationName &&
          task.MenuId.toString() === previousMilestone.value &&
          task.Status === "Complete"
      );
  
      if (!hasPreviousPhaseCompleted) {
        const hasPreviousPhaseAssigned = existingTasks.some(
          (task) =>
            task.Station === stationName &&
            task.MenuId.toString() === previousMilestone.value &&
            task.Status === "Assigned"
        );
  
        return {
          type: "blocked",
          message: hasPreviousPhaseAssigned 
            ? `${previousMilestone.label} in progress` 
            : `${previousMilestone.label} not completed`
        };
      }
    }
  
    return null;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", padding: "1px" }}
      >
        <StyledCard>
          <CardHeader
            sx={{
              textAlign: "center",
              pb: 2,
              background: "linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)",
            }}
            title={
              <Typography
                variant="h4"
                component="div"
                sx={{
                  background: "linear-gradient(45deg, #ff9800, #f57c00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "bold",
                  mb: 1,
                }}
              >
                Assign Task to Technician || Tender No. - {tenderNo}
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Complete the form to assign tasks to multiple stations (Phase-based progression)
              </Typography>
            }
          />

          <CardContent sx={{ p: 3 }}>
            {loadingTasks && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Loading existing tasks...
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Grid container spacing={3}>
                {/* Milestone Selection - Now Autocomplete */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#ff9800" }}>
                    Select Milestone
                  </Typography>
                  <Autocomplete
                    value={milestones.find((m) => m.value === milestone) || null}
                    onChange={(event, newValue) => {
                      setMilestone(newValue ? newValue.value : "")
                    }}
                    options={milestones}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Milestone" placeholder="Choose a milestone..." fullWidth />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: option.color,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Phase {option.phase}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    sx={{ mb: 2 }}
                  />

                  {/* {selectedMilestone && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: selectedMilestone.bgColor,
                        border: `2px solid ${selectedMilestone.color}`,
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <CheckCircle sx={{ color: selectedMilestone.color }} />
                        <Box>
                          <Typography variant="body1" fontWeight="medium" sx={{ color: selectedMilestone.color }}>
                            {selectedMilestone.label}
                          </Typography>
                          <Chip
                            label={`Phase ${selectedMilestone.phase}`}
                            size="small"
                            sx={{
                              backgroundColor: selectedMilestone.color,
                              color: "white",
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  )} */}
                </Grid>

                {/* Station Selection - Now Autocomplete */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#ff9800" }}>
                    Select Stations ({selectedStations.length} selected)
                  </Typography>
                  {/* {milestone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Available: {availableStations.length} / {stations.length} stations
                    </Typography>
                  )} */}

                  <Autocomplete
                    multiple
                    value={selectedStations}
                    onChange={(event, newValue) => {
                      setSelectedStations(newValue)
                    }}
                    options={availableStations}
                    getOptionLabel={(option) => option.name}
                    getOptionDisabled={(option) => !isStationAvailableForMilestone(option.name, milestone)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Stations" placeholder="Choose stations..." fullWidth />
                    )}
                    renderOption={(props, option) => {
                      const isAvailable = isStationAvailableForMilestone(option.name, milestone)
                      const stationStatus = getStationStatus(option.name)

                      return (
                        <Box component="li" {...props} sx={{ opacity: isAvailable ? 1 : 0.6 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                            {!isAvailable ? (
                              <Block sx={{ color: "#f44336" }} />
                            ) : (
                              <LocationOn sx={{ color: "#ff9800" }} />
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.location}
                              </Typography>
                              {stationStatus && (
                                <Typography
                                  variant="caption"
                                  color={stationStatus.type === "assigned" ? "warning.main" : "error.main"}
                                  sx={{ display: "block" }}
                                >
                                  {stationStatus.message}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={option.name}
                          size="small"
                          sx={{
                            backgroundColor: "#fff3e0",
                            color: "#ff9800",
                            "& .MuiChip-deleteIcon": {
                              color: "#ff9800",
                            },
                          }}
                        />
                      ))
                    }
                    disabled={!milestone}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: "#ffcc80" }} />

              <Grid container spacing={3}>
                {/* Technician Selection */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#ff9800" }}>
                    Select Technician
                  </Typography>
                  <Autocomplete
                    value={technician}
                    onChange={handleTechnicianChange}
                    options={technicians}
                    getOptionLabel={(option) => option.Name || ""}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Technician" placeholder="Choose a technician..." fullWidth />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar src={option.Avatar || undefined} sx={{ width: 32, height: 32 }}>
                            {!option.Avatar && <Person />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {option.Name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.Role}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  />

                  {/* {technician && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: "#fff3e0",
                        border: "2px solid #ffcc80",
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          src={technician.Avatar || undefined}
                          sx={{ width: 48, height: 48, border: "2px solid #ff9800" }}
                        >
                          {!technician.Avatar && <Person />}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {technician.Name}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                            <Work fontSize="small" />
                            <Typography variant="body2">{technician.Designation}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  )} */}
                </Grid>

                {/* Date Selection */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#ff9800" }}>
                    Target Completion Date
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Target Completion Date"
                      value={date}
                      onChange={(newValue) => setDate(newValue)}
                      minDate={new Date()}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <CalendarToday sx={{ color: "#ff9800", mr: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>

              {/* Task Summary */}
              {/* {milestone && selectedStations.length > 0 && technician && date && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: "#fff3e0",
                    border: "2px solid #ffcc80",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" textAlign="center" gutterBottom sx={{ color: "#ff9800", fontWeight: 600 }}>
                    Task Assignment Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Milestone:</strong> {selectedMilestone?.label} (Phase {selectedMilestone?.phase})
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Technician:</strong> {technician.Name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Stations:</strong> {selectedStations.length} selected
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Target Date:</strong> {format(date, "PPP")}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, fontStyle: "italic", textAlign: "center", color: "text.secondary" }}
                  >
                    This will create {selectedStations.length} separate task(s) for each station.
                  </Typography>
                </Paper>
              )} */}

              {/* Submission Results */}
              {submissionResults.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#ff9800" }}>
                    Submission Results
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {submissionResults.map((result, index) => (
                      <Alert key={index} severity={result.success ? "success" : "error"}>
                        <strong>{result.station}:</strong> {result.message}
                      </Alert>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Submit Button */}
              <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                <OrangeButton
                  onClick={handleSubmit}
                  disabled={isLoading || !milestone || selectedStations.length === 0 || !technician || !date}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Add />}
                  size="large"
                >
                  {isLoading ? "Assigning Tasks..." : `Assign ${selectedStations.length || 0} Task(s)`}
                </OrangeButton>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </motion.div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
