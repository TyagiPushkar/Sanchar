"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
} from "@mui/material"
import {
  ArrowBack,
  Visibility,
  Download,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  Category,
  DateRange,
  AttachFile,
  TextFields,
  QuestionAnswer,
  CheckCircle,
  Image as ImageIcon,
  CalendarToday,
} from "@mui/icons-material"
import { styled } from "@mui/material/styles"

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  borderRadius: theme.spacing(2),
}))

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}))

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}))

const ImageThumbnail = styled(Box)(({ theme }) => ({
  position: "relative",
  width: 80,
  height: 80,
  overflow: "hidden",
  borderRadius: theme.spacing(1),
  border: `2px solid ${theme.palette.primary.light}`,
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: theme.shadows[4],
  },
  "&:hover .overlay": {
    opacity: 1,
  },
}))

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.3s ease",
}))

const ZoomableImage = styled("img")(({ zoomLevel }) => ({
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  transform: `scale(${zoomLevel})`,
  transformOrigin: "center",
  transition: "transform 0.2s ease",
  cursor: zoomLevel > 1 ? "grab" : "default",
}))

const QuestionCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.blue?.[50] || "#e3f2fd",
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  fontWeight: 500,
  minWidth: 250,
  verticalAlign: "top",
}))

const AnswerCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.green?.[50] || "#e8f5e8",
  borderLeft: `4px solid ${theme.palette.success.main}`,
  verticalAlign: "top",
}))

const TaskView = () => {
  const { TaskId } = useParams()
  const navigate = useNavigate()
  const [taskDetails, setTaskDetails] = useState([])
  const [checkpoints, setCheckpoints] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Fetch task details
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://namami-infotech.com/SANCHAR/src/task/get_task_detail.php?taskId=${TaskId}`,
        )
        const data = await response.json()
        if (data.success) setTaskDetails(data.data)
      } catch (err) {
        console.error("Error fetching task details:", err)
      } finally {
        setLoading(false)
      }
    }

    if (TaskId) fetchTaskDetails()
  }, [TaskId])

  // Fetch menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch("https://namami-infotech.com/SANCHAR/src/menu/get_menu.php")
        const data = await response.json()
        if (data.success) setMenus(data.data)
      } catch (err) {
        console.error("Error fetching menus:", err)
      }
    }

    fetchMenus()
  }, [])

  // Fetch checkpoints
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch("https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php")
        const data = await response.json()
        if (data.success) setCheckpoints(data.data)
      } catch (err) {
        console.error("Error fetching checkpoints:", err)
      }
    }

    fetchCheckpoints()
  }, [])

  const isImageUrl = (value) => {
    if (!value) return false
    return value.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) !== null || value.startsWith("data:image/")
  }

  const getFullImageUrl = (value) => {
    if (!value) return "/placeholder.svg"
    if (value.startsWith("http") || value.startsWith("data:")) return value
    const baseUrl = "https://namami-infotech.com"
    const cleanValue = value.startsWith("/") ? value : `/${value}`
    return `${baseUrl}${cleanValue}`
  }

  const extractMainCheckpointId = (chkId) => {
    const match = chkId.match(/^(\d+)/)
    return match ? Number.parseInt(match[1]) : null
  }

  const hasSubPoint = (chkId) => {
    return chkId.includes(".") && !chkId.includes(".meta")
  }

  const getSubPointNumber = (chkId) => {
    const match = chkId.match(/\.(\d+)$/)
    return match ? Number.parseInt(match[1]) : null
  }

  const getCheckpointById = (checkpointId) => {
    return checkpoints.find((cp) => cp.CheckpointId === checkpointId)
  }

  const getMenuCategoryForCheckpoint = (checkpointId) => {
    for (const menu of menus) {
      if (menu.CheckpointId) {
        const ids = menu.CheckpointId.split(/[,;]/).map((id) => Number.parseInt(id.trim()))
        if (ids.includes(checkpointId)) {
          return menu.Cat
        }
      }
    }
    return null
  }

  const getTypeIcon = (typeId) => {
    switch (typeId) {
      case 4:
        return <DateRange color="primary" />
      case 8:
        return <AttachFile color="primary" />
      case 26:
        return <TextFields color="primary" />
      default:
        return <QuestionAnswer color="primary" />
    }
  }

  const getTypeLabel = (typeId) => {
    switch (typeId) {
      case 4:
        return "Date"
      case 8:
        return "File"
      case 26:
        return "Text"
      default:
        return "Question"
    }
  }

  const getGroupedCheckpoints = () => {
    const grouped = {}

    taskDetails.forEach((detail) => {
      if (!detail.ChkId.includes(".meta")) {
        const mainCheckpointId = extractMainCheckpointId(detail.ChkId)
        if (!grouped[mainCheckpointId]) {
          grouped[mainCheckpointId] = {
            mainCheckpointId,
            checkpoint: getCheckpointById(mainCheckpointId),
            menuCategory: getMenuCategoryForCheckpoint(mainCheckpointId),
            items: [],
          }
        }

        grouped[mainCheckpointId].items.push({
          taskDetail: detail,
          isSubPoint: hasSubPoint(detail.ChkId),
          subPointNumber: getSubPointNumber(detail.ChkId),
          isImage: isImageUrl(detail.Value),
        })
      }
    })

    return Object.values(grouped)
  }

  const handleImageClick = (imageValue) => {
    const fullImageUrl = getFullImageUrl(imageValue)
    setSelectedImage(fullImageUrl)
    setImageDialogOpen(true)
    setZoomLevel(1)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedImage(null)
    setZoomLevel(1)
  }

  const downloadImage = (imageValue, checkpointId, subPoint = null) => {
    const fullImageUrl = getFullImageUrl(imageValue)
    const link = document.createElement("a")
    link.href = fullImageUrl
    link.download = `task-${TaskId}-checkpoint-${checkpointId}${subPoint ? `-subpoint-${subPoint}` : ""}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, prev + 0.5))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev - 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  const renderAnswerContent = (item, group) => {
    if (item.isImage) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ImageThumbnail onClick={() => handleImageClick(item.taskDetail.Value)}>
            <img
              src={getFullImageUrl(item.taskDetail.Value) || "/placeholder.svg"}
              alt={`Checkpoint ${group.mainCheckpointId} image`}
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <ImageOverlay className="overlay">
              <Visibility sx={{ color: "white", fontSize: 20 }} />
            </ImageOverlay>
          </ImageThumbnail>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ImageIcon fontSize="small" />
              Image Attachment
            </Typography>
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Tooltip title="View Image">
                <IconButton size="small" color="primary" onClick={() => handleImageClick(item.taskDetail.Value)}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Image">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() =>
                    downloadImage(
                      item.taskDetail.Value,
                      group.mainCheckpointId,
                      item.isSubPoint ? item.subPointNumber : null,
                    )
                  }
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {item.taskDetail.Value || "No answer provided"}
        </Typography>
        {item.taskDetail.Datetime && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday fontSize="inherit" />
            Recorded: {new Date(item.taskDetail.Datetime).toLocaleString()}
          </Typography>
        )}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  const groupedCheckpoints = getGroupedCheckpoints()

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Task Details #{TaskId}
        </Typography>
      </Box>

      {/* Task Summary Card */}
      
      {/* Main Content */}
      <StyledCard>
        <CardContent sx={{ p: 0 }}>
          {groupedCheckpoints.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">No checkpoint data found for this task.</Alert>
            </Box>
          ) : (
            <StyledTableContainer component={Paper} elevation={0}>
              <Table>
                <StyledTableHead>
                  <TableRow>
                    {/* <StyledTableCell sx={{ width: "15%" }}>Checkpoint</StyledTableCell> */}
                    <StyledTableCell sx={{ width: "40%" }}>Question</StyledTableCell>
                    <StyledTableCell sx={{ width: "40%" }}>Answer</StyledTableCell>
                    {/* <StyledTableCell sx={{ width: "5%" }}>Type</StyledTableCell> */}
                  </TableRow>
                </StyledTableHead>
                <TableBody>
                  {groupedCheckpoints.map((group, groupIndex) =>
                    group.items.map((item, itemIndex) => (
                      <TableRow
                        key={`${group.mainCheckpointId}-${item.taskDetail.SRNo}`}
                        sx={{
                          "&:hover": { backgroundColor: "action.hover" },
                          borderBottom:
                            itemIndex === group.items.length - 1 && groupIndex < groupedCheckpoints.length - 1
                              ? "2px solid"
                              : "1px solid",
                          borderBottomColor:
                            itemIndex === group.items.length - 1 && groupIndex < groupedCheckpoints.length - 1
                              ? "divider"
                              : "divider",
                        }}
                      >
                        {/* Checkpoint Column */}
                      

                        {/* Question Column */}
                        <QuestionCell>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            {group.checkpoint && getTypeIcon(group.checkpoint.TypeId)}
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {group.checkpoint?.Description || `Checkpoint ${group.mainCheckpointId}`}
                              </Typography>
                              {item.isSubPoint && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Sub-question: {item.taskDetail.ChkId}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </QuestionCell>

                        {/* Answer Column */}
                        <AnswerCell>{renderAnswerContent(item, group)}</AnswerCell>

                        {/* Type Column */}
                       
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}
        </CardContent>
      </StyledCard>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImageDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.9)",
            maxHeight: "90vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Image Viewer</Typography>
          <IconButton onClick={handleCloseImageDialog} sx={{ color: "white" }}>
            <ArrowBack />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            height: "80vh",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {selectedImage && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                overflow: "auto",
              }}
            >
              <ZoomableImage
                src={selectedImage}
                alt="Full size"
                zoomLevel={zoomLevel}
                onError={(e) => {
                  e.target.src = "/placeholder.svg"
                }}
              />
            </Box>
          )}
        </DialogContent>

        {/* Zoom Controls */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
            zIndex: 2,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 2,
            padding: 1,
          }}
        >
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5} sx={{ color: "white" }}>
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset Zoom">
            <IconButton onClick={handleResetZoom} sx={{ color: "white" }}>
              <ZoomOutMap />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 4} sx={{ color: "white" }}>
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download">
            <IconButton
              onClick={() => selectedImage && downloadImage(selectedImage, "fullscreen")}
              sx={{ color: "white" }}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Dialog>
    </Box>
  )
}

export default TaskView
