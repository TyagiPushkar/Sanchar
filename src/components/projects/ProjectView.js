"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
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
} from "@mui/material"
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
} from "@mui/icons-material"
import { styled } from "@mui/material/styles"
import { motion } from "framer-motion"

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
}))

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  "& .MuiTableHead-root": {
    background: "linear-gradient(135deg, #F69320 0%, #F69320 100%)",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    color: "white",
    fontWeight: 600,
    fontSize: "0.95rem",
    padding: "16px",
  },
  "& .MuiTableRow-root:nth-of-type(even)": {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
}))

const PhaseCell = styled(TableCell)(({ theme, completed }) => ({
  position: "relative",
  padding: "16px",
  cursor: "pointer",
  backgroundColor: completed ? "rgba(76, 175, 80, 0.1)" : "transparent",
  border: completed ? "1px solid rgba(76, 175, 80, 0.3)" : "1px solid rgba(0, 0, 0, 0.12)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: completed ? "rgba(76, 175, 80, 0.2)" : "rgba(0, 0, 0, 0.04)",
    transform: "scale(1.02)",
  },
}))

const PhaseIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(1),
}))

const ClickableListItem = styled(ListItem)(({ theme }) => ({
  cursor: "pointer",
  borderRadius: "8px",
  margin: "4px 0",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    transform: "translateX(4px)",
  },
}))

export default function StationPhaseTable() {
  const location = useLocation()
  const { tenderNo, ActivityId } = location.state || {}
  const navigate = useNavigate()

  const [stations, setStations] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)
  const [phaseTasks, setPhaseTasks] = useState([])

  // Define the 4 phases
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
  ]

  // Fetch stations and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch stations
        const stationsResponse = await axios.get(
          `https://namami-infotech.com/SANCHAR/src/tender/tender_stations.php?ActivityId=${ActivityId}`,
        )

        if (stationsResponse.data.success) {
          const stationsList = stationsResponse.data.stations
          setStations(stationsList)

          // Fetch tasks for the tender
          const tasksResponse = await axios.get(
            `https://namami-infotech.com/SANCHAR/src/task/project_task.php?TenderNo=${tenderNo}`,
          )

          if (tasksResponse.data.success) {
            const tasksData = tasksResponse.data.data
            setTasks(tasksData)
          }
        } else {
          throw new Error(stationsResponse.data.message || "Failed to fetch stations")
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (ActivityId) {
      fetchData()
    }
  }, [ActivityId, tenderNo])

  // Check if a phase is completed for a station
  const isPhaseCompleted = (station, phase) => {
    return tasks.some(
      (task) =>
        task.Station === station &&
        phase.milestones.some((milestone) => task.Milestone?.toLowerCase().includes(milestone.toLowerCase())) &&
        task.Status?.toLowerCase() === "complete",
    )
  }

  // Get tasks for a specific phase and station
  const getPhaseTasksForStation = (station, phase) => {
    return tasks.filter(
      (task) =>
        task.Station === station &&
        phase.milestones.some((milestone) => task.Milestone?.toLowerCase().includes(milestone.toLowerCase())),
    )
  }

  // Handle phase cell click
  const handlePhaseClick = (station, phase) => {
    const filteredTasks = getPhaseTasksForStation(station, phase)
    setSelectedPhase(phase)
    setSelectedStation(station)
    setPhaseTasks(filteredTasks)
    setDialogOpen(true)
  }

  // Handle task click - redirect to task view
  const handleTaskClick = (taskId) => {
    navigate(`/task/view/${taskId}`)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return isNaN(date) ? dateString : date.toLocaleDateString("en-GB")
  }

  // Get project stats
  const getProjectStats = () => {
    const totalStations = stations.length
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.Status?.toLowerCase() === "complete").length

    // Calculate completed phases
    let totalPhases = 0
    let completedPhases = 0

    stations.forEach((station) => {
      totalPhases += phases.length
      phases.forEach((phase) => {
        if (isPhaseCompleted(station, phase)) {
          completedPhases++
        }
      })
    })

    const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

    return {
      totalStations,
      totalTasks,
      completedTasks,
      totalPhases,
      completedPhases,
      overallProgress,
    }
  }

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
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Data
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    )
  }

  const stats = getProjectStats()

  return (
    <Container maxWidth="xl" sx={{ py: 0 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: "#F69320" }}>
              Tender No: {tenderNo || "N/A"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            sx={{ bgcolor: "#F69320" }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Project Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Stations
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: "#1976d2" }}>
                        {stats.totalStations}
                      </Typography>
                    </Box>
                    <LocationOn sx={{ fontSize: 40, color: "#1976d2", opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Completed Phases
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                        {stats.completedPhases}/{stats.totalPhases}
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 40, color: "#2e7d32", opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Tasks
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: "#f57c00" }}>
                        {stats.totalTasks}
                      </Typography>
                    </Box>
                    <Assignment sx={{ fontSize: 40, color: "#f57c00", opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Overall Progress
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: "#1565c0" }}>
                        {Math.round(stats.overallProgress)}%
                      </Typography>
                    </Box>
                    <Dashboard sx={{ fontSize: 40, color: "#1565c0", opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          </Grid>
        </Grid>

        {stations.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body1">No stations found for this tender.</Typography>
          </Alert>
        ) : (
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Station</TableCell>
                  {phases.map((phase) => (
                    <TableCell key={phase.id} align="center" width="20%">
                      {phase.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stations.map((station) => (
                  <TableRow key={station} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {/* <LocationOn sx={{ mr: 1, color: "#F69320" }} /> */}
                        <Typography variant="body2" fontWeight="medium">
                          {station}
                        </Typography>
                      </Box>
                    </TableCell>
                    {phases.map((phase) => {
                      const completed = isPhaseCompleted(station, phase)
                      const phaseTasks = getPhaseTasksForStation(station, phase)
                      const hasTask = phaseTasks.length > 0

                      return (
                        <PhaseCell
                          key={phase.id}
                          align="center"
                          completed={completed}
                          onClick={() => handlePhaseClick(station, phase)}
                        >
                          {/* <PhaseIcon>{phase.icon}</PhaseIcon> */}

                          {completed ? (
                            <CheckCircle sx={{ color: "success.main", fontSize: 28 }} />
                          ) : hasTask ? (
                            <Info sx={{ color: "warning.main", fontSize: 28 }} />
                          ) : (
                            <Cancel sx={{ color: "text.disabled", fontSize: 28 }} />
                          )}

                          <Typography variant="body2" sx={{ mt: 0 }}>
                            {completed ? "Completed" : hasTask ? "In Progress" : "Not Started"}
                          </Typography>

                          {/* {hasTask && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {phaseTasks.length} task{phaseTasks.length !== 1 ? "s" : ""}
                            </Typography>
                          )} */}
                        </PhaseCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}

        {/* Task Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6">
                {selectedPhase?.name} Tasks - {selectedStation}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phaseTasks.length} task{phaseTasks.length !== 1 ? "s" : ""} found
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {phaseTasks.length === 0 ? (
              <Alert severity="info">
                <Typography variant="body1">No tasks found for this phase and station.</Typography>
              </Alert>
            ) : (
              <List>
                {phaseTasks.map((task) => (
                  <Box key={task.Id}>
                    <ClickableListItem alignItems="flex-start" onClick={() => handleTaskClick(task.Id)}>
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
                                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                  <Person sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Assigned to: {task.EmpName || "N/A"}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Target Date: {formatDate(task.TargetDate)}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={task.Status || "Unknown"}
                                size="small"
                                color={task.Status?.toLowerCase() === "complete" ? "success" : "warning"}
                                variant="outlined"
                              />
                            </Box>
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
      </motion.div>
    </Container>
  )
}
