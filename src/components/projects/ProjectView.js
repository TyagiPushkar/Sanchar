"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Chip,
  Container,
  Skeleton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  Assignment,
  Person,
  CalendarToday,
  LocationOn,
  Dashboard,
  Engineering,
  Settings,
  Timeline,
  VerifiedUser,
  Info,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  paddingBottom: 10,
  borderRadius: 12,
  maxHeight: "calc(100vh - 300px)", // Adjust this value based on your layout
  overflow: "auto",
  position: "relative",
  "& .MuiTableHead-root": {
    background: "linear-gradient(135deg, #F69320 0%, #F69320 100%)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    color: "white",
    fontWeight: 600,
    fontSize: "0.95rem",
    padding: "16px",
    backgroundColor: "#F69320", // Fallback for browsers that don't support gradients on sticky elements
  },
  "& .MuiTableRow-root:nth-of-type(even)": {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
}));

const PhaseCell = styled(TableCell)(({ theme, completed }) => ({
  position: "relative",
  padding: "16px",
  cursor: "pointer",
  backgroundColor: completed ? "rgba(76, 175, 80, 0.1)" : "transparent",
  border: completed
    ? "1px solid rgba(76, 175, 80, 0.3)"
    : "1px solid rgba(0, 0, 0, 0.12)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: completed
      ? "rgba(76, 175, 80, 0.2)"
      : "rgba(0, 0, 0, 0.04)",
    transform: "scale(1.02)",
  },
}));

const ClickableListItem = styled(ListItem)(({ theme }) => ({
  cursor: "pointer",
  borderRadius: "8px",
  margin: "4px 0",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    transform: "translateX(4px)",
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  flexWrap: "wrap",
}));

export default function StationPhaseTable() {
  const location = useLocation();
  const { tenderNo, ActivityId } = location.state || {};
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [stationData, setStationData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [phaseTasks, setPhaseTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [completionDate, setCompletionDate] = useState(null);
  const [targetDate, setTargetDate] = useState("");

  // New state for section filter
  const [selectedSection, setSelectedSection] = useState("all");
  const [sections, setSections] = useState([]);

  const phases = [
    {
      id: 1,
      name: "Civil and Antenna Install",
      icon: <Engineering fontSize="large" color="primary" />,
      milestones: ["Civil and Antenna Install"],
    },
    {
      id: 2,
      name: "Laying Of Cable",
      icon: <Settings fontSize="large" color="primary" />,
      milestones: ["Laying Of Cable"],
    },
    {
      id: 3,
      name: "Installation Of Transmitter",
      icon: <Timeline fontSize="large" color="primary" />,
      milestones: ["Installation Of Transmitter"],
    },
    {
      id: 4,
      name: "Final Check & Handover",
      icon: <VerifiedUser fontSize="large" color="primary" />,
      milestones: ["Final Check & Handover"],
    },
    {
      id: 5,
      name: "RM Work",
      icon: <VerifiedUser fontSize="large" color="primary" />,
      milestones: ["RM Work"],
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          stationsResponse,
          tasksResponse,
          employeesResponse,
          completionDateResponse,
        ] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/SANCHAR/src/tender/tender_stations.php?ActivityId=${ActivityId}`,
          ),
          axios.get(
            `https://namami-infotech.com/SANCHAR/src/task/project_task.php?TenderNo=${tenderNo}`,
          ),
          axios.get(
            "https://namami-infotech.com/SANCHAR/src/employee/list_employee.php?Tenent_Id=1",
          ),
          axios.get(
            `https://namami-infotech.com/SANCHAR/src/task/project_complete.php?TenderNo=${tenderNo}`,
          ),
        ]);

        // Handle stations response with the new structure
        if (stationsResponse.data.success) {
          if (stationsResponse.data.data) {
            // New response format with station objects
            setStationData(stationsResponse.data.data);
            // Extract just station names for backward compatibility
            const stationNames = stationsResponse.data.data.map(
              (item) => item.station,
            );
            setStations(stationNames);

            // Extract unique sections for filter
            const uniqueSections = [
              ...new Set(
                stationsResponse.data.data.map((item) => item.section),
              ),
            ].sort();
            setSections(uniqueSections);
          } else if (stationsResponse.data.stations) {
            // Old response format with just station names
            const stationNames = stationsResponse.data.stations;
            setStations(stationNames);
            // Create station data objects with section as station name (fallback)
            const stationObjects = stationNames.map((station) => ({
              station,
              section: station,
            }));
            setStationData(stationObjects);

            // For old format, sections will be the same as station names
            const uniqueSections = [...new Set(stationNames)].sort();
            setSections(uniqueSections);
          } else {
            throw new Error(
              stationsResponse.data.message || "Failed to fetch stations",
            );
          }
        } else {
          throw new Error(
            stationsResponse.data.message || "Failed to fetch stations",
          );
        }

        if (tasksResponse.data.success) {
          setTasks(tasksResponse.data.data);
        } else {
          throw new Error(
            tasksResponse.data.message || "Failed to fetch tasks",
          );
        }

        if (employeesResponse.data.success) {
          const filteredEmployees = employeesResponse.data.data.filter(
            (emp) => emp.Role === "Technician" && emp.IsActive === 1,
          );
          setEmployees(filteredEmployees);
        } else {
          console.error(
            "Failed to fetch employees:",
            employeesResponse.data.message,
          );
        }

        if (
          completionDateResponse.data.success &&
          completionDateResponse.data.data.length > 0
        ) {
          setCompletionDate(completionDateResponse.data.data[0]);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ActivityId) {
      fetchData();
    }
  }, [ActivityId, tenderNo]);

  // Helper function to get section name for a station
  const getStationSection = (stationName) => {
    const stationObj = stationData.find((item) => item.station === stationName);
    return stationObj ? stationObj.section : stationName;
  };

  // Helper function to get display name with section
  const getStationDisplayName = (stationName) => {
    const section = getStationSection(stationName);
    return `${stationName} (${section})`;
  };

  // Filter stations based on selected section
  const getFilteredStations = () => {
    if (selectedSection === "all") {
      return stations;
    }
    return stations.filter(
      (station) => getStationSection(station) === selectedSection,
    );
  };

  // Handle section filter change
  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
  };

  // Clear section filter
  const handleClearFilter = () => {
    setSelectedSection("all");
  };

  const isPhaseCompleted = (station, phase) => {
    return tasks.some(
      (task) =>
        task.Station === station &&
        phase.milestones.some((milestone) =>
          task.Milestone?.toLowerCase().includes(milestone.toLowerCase()),
        ) &&
        task.Status?.toLowerCase() === "complete",
    );
  };

  const getPhaseTasksForStation = (station, phase) => {
    return tasks.filter(
      (task) =>
        task.Station === station &&
        phase.milestones.some((milestone) =>
          task.Milestone?.toLowerCase().includes(milestone.toLowerCase()),
        ),
    );
  };

  const handlePhaseClick = (station, phase) => {
    const filteredTasks = getPhaseTasksForStation(station, phase);
    setSelectedPhase(phase);
    setSelectedStation(station);
    setPhaseTasks(filteredTasks);
    setDialogOpen(true);
  };

  const handleTaskClick = (taskId) => {
    navigate(`/task/view/${taskId}`);
  };

  const handleReassignClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setSelectedEmployee(
      employees.find((emp) => emp.EmpId === task.EmpId) || null,
    );
    setReassignDialogOpen(true);
  };

  const handleReassignTask = async () => {
    if (!selectedTask || !selectedEmployee || !targetDate) return;

    setReassignLoading(true);
    try {
      const response = await axios.post(
        "https://namami-infotech.com/SANCHAR/src/task/edit_task.php",
        {
          TaskId: selectedTask.Id,
          EmpName: selectedEmployee.Name,
          EmpId: selectedEmployee.EmpId,
          TargetDate: targetDate,
        },
      );

      if (response.data.success) {
        setTasks(
          tasks.map((task) =>
            task.Id === selectedTask.Id
              ? {
                  ...task,
                  EmpName: selectedEmployee.Name,
                  EmpId: selectedEmployee.EmpId,
                  TargetDate: targetDate,
                }
              : task,
          ),
        );

        setToast({
          show: true,
          message: "Task reassigned successfully!",
          type: "success",
        });

        setReassignDialogOpen(false);
        setTargetDate("");
      } else {
        throw new Error(response.data.message || "Failed to reassign task");
      }
    } catch (err) {
      setToast({
        show: true,
        message: err.message || "Error reassigning task",
        type: "error",
      });
    } finally {
      setReassignLoading(false);
    }
  };

  const formatDate = (dateString, format = "dd-mm-yyyy") => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    if (isNaN(date)) return dateString;

    if (format === "dd-mm-yyyy") {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return date.toLocaleDateString("en-GB");
  };

  const getProjectStats = () => {
    const filteredStations = getFilteredStations();
    const totalStations = filteredStations.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.Status?.toLowerCase() === "complete",
    ).length;

    let totalPhases = 0;
    let completedPhases = 0;

    filteredStations.forEach((station) => {
      totalPhases += phases.length;
      phases.forEach((phase) => {
        if (isPhaseCompleted(station, phase)) {
          completedPhases++;
        }
      });
    });

    const overallProgress =
      totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    return {
      totalStations,
      totalTasks,
      completedTasks,
      totalPhases,
      completedPhases,
      overallProgress,
    };
  };

  // Get stations by section for filter options
  const getStationsBySection = () => {
    const sections = {};
    stationData.forEach((item) => {
      if (!sections[item.section]) {
        sections[item.section] = [];
      }
      sections[item.section].push(item.station);
    });
    return sections;
  };

  const filteredStations = getFilteredStations();
  const stats = getProjectStats();
  const stationsBySection = getStationsBySection();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={400} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton
                variant="rectangular"
                height={120}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Data
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, color: "#F69320" }}
            >
              Tender No: {tenderNo || "N/A"}
            </Typography>
            {completionDate && (
              <Typography
                variant="subtitle1"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CalendarToday fontSize="small" color="action" />
                Project Completion Date: {formatDate(completionDate)}
              </Typography>
            )}
          </Box>
          <FilterContainer>
            <FormControl sx={{ minWidth: 300 }} size="medium">
              <InputLabel id="section-filter-label">
                Filter by Section
              </InputLabel>
              <Select
                labelId="section-filter-label"
                id="section-filter"
                value={selectedSection}
                onChange={handleSectionChange}
                input={<OutlinedInput label="Filter by Section" />}
                startAdornment={
                  <FilterList sx={{ mr: 1, color: "action.active" }} />
                }
              >
                <MenuItem value="all">
                  <em>All Sections ({stations.length} stations)</em>
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section} value={section}>
                    {section} ({stationsBySection[section]?.length || 0}{" "}
                    stations)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedSection !== "all" && (
              <Button
                variant="outlined"
                size="medium"
                startIcon={<Clear />}
                onClick={handleClearFilter}
                sx={{ borderColor: "#F69320", color: "#F69320" }}
              >
                Clear Filter
              </Button>
            )}

            {selectedSection !== "all" && (
              <Chip
                label={`Showing: ${filteredStations.length} of ${stations.length} stations`}
                color="primary"
                variant="outlined"
                sx={{ ml: "auto" }}
              />
            )}
          </FilterContainer>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            sx={{ bgcolor: "#F69320", mt: { xs: 2, sm: 0 } }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Section Filter Dropdown */}

        {/* Project Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="body2"
                      >
                        {selectedSection === "all"
                          ? "Total Stations"
                          : `Stations in ${selectedSection}`}
                      </Typography>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{ fontWeight: 700, color: "#1976d2" }}
                      >
                        {stats.totalStations}
                      </Typography>
                    </Box>
                    <LocationOn
                      sx={{ fontSize: 40, color: "#1976d2", opacity: 0.7 }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="body2"
                      >
                        Completed Phases
                      </Typography>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{ fontWeight: 700, color: "#2e7d32" }}
                      >
                        {stats.completedPhases}/{stats.totalPhases}
                      </Typography>
                    </Box>
                    <CheckCircle
                      sx={{ fontSize: 40, color: "#2e7d32", opacity: 0.7 }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="body2"
                      >
                        Total Tasks
                      </Typography>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{ fontWeight: 700, color: "#f57c00" }}
                      >
                        {stats.totalTasks}
                      </Typography>
                    </Box>
                    <Assignment
                      sx={{ fontSize: 40, color: "#f57c00", opacity: 0.7 }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="body2"
                      >
                        Overall Progress
                      </Typography>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{ fontWeight: 700, color: "#1565c0" }}
                      >
                        {Math.round(stats.overallProgress)}%
                      </Typography>
                    </Box>
                    <Dashboard
                      sx={{ fontSize: 40, color: "#1565c0", opacity: 0.7 }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>
        </Grid>

        {filteredStations.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body1">
              No stations found for the selected section.
            </Typography>
          </Alert>
        ) : (
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="15%">Station (Section)</TableCell>
                  {phases.map((phase) => (
                    <TableCell key={phase.id} align="center" width="15%">
                      {phase.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStations.map((station) => (
                  <TableRow key={station} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight="medium">
                          {getStationDisplayName(station)}
                        </Typography>
                      </Box>
                    </TableCell>
                    {phases.map((phase) => {
                      const completed = isPhaseCompleted(station, phase);
                      const phaseTasks = getPhaseTasksForStation(
                        station,
                        phase,
                      );
                      const hasTask = phaseTasks.length > 0;

                      return (
                        <PhaseCell
                          key={phase.id}
                          align="center"
                          completed={completed}
                          onClick={() => handlePhaseClick(station, phase)}
                        >
                          {completed ? (
                            <Box>
                              <CheckCircle
                                sx={{ color: "success.main", fontSize: 28 }}
                              />
                              <Typography variant="caption" display="block">
                                {formatDate(
                                  tasks.find(
                                    (t) =>
                                      t.Station === station &&
                                      t.Status?.toLowerCase() === "complete" &&
                                      phase.milestones.some((m) =>
                                        t.Milestone?.toLowerCase().includes(
                                          m.toLowerCase(),
                                        ),
                                      ),
                                  )?.UpdateDateTime,
                                  "dd-mm-yyyy",
                                )}
                              </Typography>
                            </Box>
                          ) : hasTask ? (
                            <Info
                              sx={{ color: "warning.main", fontSize: 28 }}
                            />
                          ) : (
                            <Cancel
                              sx={{ color: "text.disabled", fontSize: 28 }}
                            />
                          )}
                          <Typography variant="body2" sx={{ mt: 0 }}>
                            {completed
                              ? "Completed"
                              : hasTask
                                ? "In Progress"
                                : "Not Started"}
                          </Typography>
                        </PhaseCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}

        {/* Task Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6">
                {selectedPhase?.name} Tasks -{" "}
                {selectedStation && getStationDisplayName(selectedStation)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phaseTasks.length} task{phaseTasks.length !== 1 ? "s" : ""}{" "}
                found
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {phaseTasks.length === 0 ? (
              <Alert severity="info">
                <Typography variant="body1">
                  No tasks found for this phase and station.
                </Typography>
              </Alert>
            ) : (
              <List>
                {phaseTasks.map((task) => (
                  <Box key={task.Id}>
                    <ClickableListItem
                      alignItems="flex-start"
                      onClick={() => handleTaskClick(task.Id)}
                    >
                      <ListItemIcon>
                        {task.Status?.toLowerCase() === "complete" ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Info color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {task.Milestone}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 0.5,
                                  }}
                                >
                                  <Person
                                    sx={{
                                      fontSize: 16,
                                      mr: 1,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Assigned to: {task.EmpName || "N/A"} (
                                    {task.EmpId})
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 0.5,
                                  }}
                                >
                                  <CalendarToday
                                    sx={{
                                      fontSize: 16,
                                      mr: 1,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Target Date: {formatDate(task.TargetDate)}
                                  </Typography>
                                </Box>
                              </Grid>
                              {task.Status?.toLowerCase() === "complete" &&
                                task.UpdateDateTime && (
                                  <Grid item xs={12} sm={6}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 0.5,
                                      }}
                                    >
                                      <CheckCircle
                                        sx={{
                                          fontSize: 16,
                                          mr: 1,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Completed on:{" "}
                                        {formatDate(
                                          task.UpdateDateTime,
                                          "dd-mm-yyyy",
                                        )}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                            </Grid>
                            {task.Status?.toLowerCase() !== "complete" && (
                              <Box
                                sx={{
                                  mt: 1,
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  label={task.Status || "Unknown"}
                                  size="small"
                                  color={
                                    task.Status?.toLowerCase() === "complete"
                                      ? "success"
                                      : "warning"
                                  }
                                  variant="outlined"
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={(e) => handleReassignClick(task, e)}
                                  sx={{ ml: 1 }}
                                >
                                  Reassign
                                </Button>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ClickableListItem>
                    <Divider variant="inset" component="li" />
                  </Box>
                ))}
              </List>
            )}
          </DialogContent>
        </Dialog>

        {/* Reassign Dialog */}
        <Dialog
          open={reassignDialogOpen}
          onClose={() => setReassignDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Task: {selectedTask?.Milestone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Assignee: {selectedTask?.EmpName} ({selectedTask?.EmpId}
                )
              </Typography>
            </Box>

            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
              value={selectedEmployee}
              onChange={(_, newValue) => setSelectedEmployee(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {option.Pic ? (
                      <img
                        src={option.Pic}
                        alt={option.Name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Person
                        sx={{ width: 40, height: 40, color: "action.active" }}
                      />
                    )}
                    <Box>
                      <Typography>{option.Name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.Designation} • {option.EmpId}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              fullWidth
              loading={employees.length === 0}
              loadingText="Loading employees..."
              noOptionsText="No employees found"
            />
            <TextField
              label="Target Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleReassignTask}
              disabled={!selectedEmployee || reassignLoading}
              sx={{ bgcolor: "#F69320" }}
              startIcon={
                reassignLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {reassignLoading ? "Reassigning..." : "Confirm Reassign"}
            </Button>
          </Box>
        </Dialog>
      </motion.div>

      {/* Toast Notification */}
      {toast.show && (
        <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
              sx={{ minWidth: 300, boxShadow: 3 }}
            >
              {toast.message}
            </Alert>
          </motion.div>
        </Box>
      )}
    </Container>
  );
}
