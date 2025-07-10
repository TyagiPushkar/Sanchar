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
  Divider,
  Grid,
  Stack,
  CircularProgress,
} from "@mui/material"
import {
  ArrowBack,
  Visibility,
  Download,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  DateRange,
  AttachFile,
  Image as ImageIcon,
  CalendarToday,
  Person,
  Phone,
  LocationOn,
  Description,
  CheckCircle,
  Warning,
} from "@mui/icons-material"
import { styled } from "@mui/material/styles"

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  borderRadius: theme.spacing(2),
}))

const StatusChip = styled(Chip)(({ status, theme }) => ({
  fontWeight: 600,
  backgroundColor:
    status === 'Closed' ? theme.palette.success.light :
    status === 'In Progress' ? theme.palette.warning.light :
    status === 'Assigned' ? theme.palette.info.light :
    theme.palette.error.light,
  color:
    status === 'Closed' ? theme.palette.success.dark :
    status === 'In Progress' ? theme.palette.warning.dark :
    status === 'Assigned' ? theme.palette.info.dark :
    theme.palette.error.dark,
}))

const TicketView = () => {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [ticketData, setTicketData] = useState([])
  const [checkpoints, setCheckpoints] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isWIP, setIsWIP] = useState(false)

  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://namami-infotech.com/SANCHAR/src/task/get_task_detail.php?taskId=${ticketId}`,
        )
        const data = await response.json()
        
        if (data.success) {
          setTicketData(data.data)
          // Check if checkpoint 133 has value "No" (WIP state)
          const wipCheck = data.data.find(item => item.ChkId === "133" && item.Value === "No")
          setIsWIP(!!wipCheck)
        } else {
          setError(data.message || 'Failed to fetch ticket details')
        }
      } catch (err) {
        console.error("Error fetching ticket details:", err)
        setError('Network error occurred while fetching ticket details')
      } finally {
        setLoading(false)
      }
    }

    // Fetch menus
    const fetchMenus = async () => {
      try {
        const response = await fetch("https://namami-infotech.com/SANCHAR/src/menu/get_menu.php")
        const data = await response.json()
        if (data.success) setMenus(data.data)
      } catch (err) {
        console.error("Error fetching menus:", err)
      }
    }

    // Fetch checkpoints
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch("https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php")
        const data = await response.json()
        if (data.success) setCheckpoints(data.data)
      } catch (err) {
        console.error("Error fetching checkpoints:", err)
      }
    }

    if (ticketId) {
      fetchTicketDetails()
      fetchMenus()
      fetchCheckpoints()
    }
  }, [ticketId])

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageDialogOpen(true)
    setZoomLevel(1)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedImage(null)
    setZoomLevel(1)
  }

  const downloadImage = (imageUrl, fileName) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = fileName || `ticket-${ticketId}-attachment.jpg`
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


  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|ico)$/i.test(url) || url.startsWith("data:image");
  };
  
  const isSupportedFile = (url) => {
    if (!url) return false;
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|zip|rar|7z|tar|gz|mp3|wav|ogg|mp4|mov|avi|mkv|webm)$/i.test(url);
  };
  
  
  const getCheckpointById = (checkpointId) => {
    return checkpoints.find((cp) => cp.CheckpointId === parseInt(checkpointId))
  }

  const getMenuCategoryForCheckpoint = (checkpointId) => {
    for (const menu of menus) {
      if (menu.CheckpointId) {
        const ids = menu.CheckpointId.split(/[,;]/).map((id) => parseInt(id.trim()))
        if (ids.includes(checkpointId)) {
          return menu.Cat
        }
      }
    }
    return null
  }

  const groupDataByActivity = () => {
    const grouped = {}
    
    ticketData.forEach(item => {
      if (!grouped[item.ActivityId]) {
        grouped[item.ActivityId] = {
          activityId: item.ActivityId,
          datetime: item.Datetime,
          latLong: item.LatLong,
          items: []
        }
      }
      grouped[item.ActivityId].items.push(item)
    })
    
    return Object.values(grouped)
  }

  const renderCheckpointData = () => {
    if (!ticketData || !Array.isArray(ticketData)) {
      return <Alert severity="info">No checkpoint data available</Alert>
    }

    const activityGroups = groupDataByActivity()

    return (
      <Box>
        {isWIP && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            This ticket is in Work In Progress (WIP) state. More entries are expected.
          </Alert>
        )}

        {activityGroups.map((group, groupIndex) => (
          <Box key={groupIndex} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Activity {groupIndex + 1}
              </Typography>
              
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.items.filter(item => !item.ChkId.includes('.meta')).map((item) => {
                    const checkpoint = getCheckpointById(item.ChkId)
                    return (
                      <TableRow key={item.SRNo}>
                        <TableCell>
                          {checkpoint?.Description || `Checkpoint ${item.ChkId}`}
                          {item.ChkId === "133" && (
                            <Chip 
                              label={item.Value === "Yes" ? "Complete" : "WIP"} 
                              size="small" 
                              color={item.Value === "Yes" ? "success" : "warning"} 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isImageUrl(item.Value) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <ImageThumbnail onClick={() => handleImageClick(item.Value)}>
                                <img
                                  src={item.Value}
                                  alt={`Checkpoint ${item.ChkId}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = '/placeholder.svg'
                                  }}
                                />
                                <ImageOverlay className="overlay">
                                  <Visibility sx={{ color: 'white', fontSize: 20 }} />
                                </ImageOverlay>
                              </ImageThumbnail>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ImageIcon fontSize="small" /> Image Attachment
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                  <Tooltip title="View Image">
                                    <IconButton size="small" color="primary" onClick={() => handleImageClick(item.Value)}>
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download Image">
                                    <IconButton size="small" color="primary" onClick={() => downloadImage(item.Value, `checkpoint-${item.ChkId}`)}>
                                      <Download fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          ) : (
                            <Typography>{item.Value || 'No value provided'}</Typography>
                                )}
                                
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Ticket Details
          </Typography>
        </Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!ticketData || ticketData.length === 0) {
    return (
      <Box sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Ticket Details
          </Typography>
        </Box>
        <Alert severity="info">Ticket not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Ticket #{ticketId}
        </Typography>
      </Box>

      {/* Ticket Details */}
      <StyledCard>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" /> Ticket Fields
            </Typography>
            {renderCheckpointData()}
          </Box>
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
          <Typography variant="h6">Ticket Attachment</Typography>
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
                alt="Ticket attachment"
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
              onClick={() => selectedImage && downloadImage(selectedImage, `ticket-${ticketId}-attachment-full`)}
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

export default TicketView

// Styled components
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