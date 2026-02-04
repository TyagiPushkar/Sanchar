"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Button,
  TextField,
  Snackbar,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Visibility,
  Download,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  DateRange,
  AttachFile,
  TextFields,
  QuestionAnswer,
  Image as ImageIcon,
  CalendarToday,
  Edit,
  Save,
  Cancel,
  Delete,
  CloudUpload,
  PictureAsPdf,
  Description,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../auth/AuthContext";

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  borderRadius: theme.spacing(2),
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

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
}));

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
}));

const ZoomableImage = styled("img")(({ zoomLevel }) => ({
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  transform: `scale(${zoomLevel})`,
  transformOrigin: "center",
  transition: "transform 0.2s ease",
  cursor: zoomLevel > 1 ? "grab" : "default",
}));

const QuestionCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.blue?.[50] || "#e3f2fd",
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  fontWeight: 500,
  minWidth: 250,
  verticalAlign: "top",
}));

const AnswerCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.green?.[50] || "#e8f5e8",
  borderLeft: `4px solid ${theme.palette.success.main}`,
  verticalAlign: "top",
}));

const EditButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.warning.main,
  },
  marginRight: theme.spacing(1),
}));

const CancelButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.error.main,
  },
}));

const TaskView = () => {
  const {user} = useAuth();
  const { TaskId } = useParams();
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [dateValues, setDateValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch task details
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://namami-infotech.com/SANCHAR/src/task/get_task_detail.php?taskId=${TaskId}`,
      );
      const data = await response.json();
      if (data.success) setTaskDetails(data.data);
    } catch (err) {
      console.error("Error fetching task details:", err);
      showSnackbar("Error loading task details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (TaskId) fetchTaskDetails();
  }, [TaskId]);

  // Fetch menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch(
          "https://namami-infotech.com/SANCHAR/src/menu/get_menu.php",
        );
        const data = await response.json();
        if (data.success) setMenus(data.data);
      } catch (err) {
        console.error("Error fetching menus:", err);
      }
    };

    fetchMenus();
  }, []);

  // Fetch checkpoints
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch(
          "https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php",
        );
        const data = await response.json();
        if (data.success) setCheckpoints(data.data);
      } catch (err) {
        console.error("Error fetching checkpoints:", err);
      }
    };

    fetchCheckpoints();
  }, []);

  const isImageUrl = (value) => {
    if (!value) return false;
    return (
      value.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) !== null ||
      value.startsWith("data:image/")
    );
  };

  const getFullImageUrl = (value) => {
    if (!value) return "/placeholder.svg";
    if (value.startsWith("http") || value.startsWith("data:")) return value;
    const baseUrl = "https://namami-infotech.com";
    const cleanValue = value.startsWith("/") ? value : `/${value}`;
    return `${baseUrl}${cleanValue}`;
  };

  const extractMainCheckpointId = (chkId) => {
    const match = chkId.match(/^(\d+)/);
    return match ? Number.parseInt(match[1]) : null;
  };

  const hasSubPoint = (chkId) => {
    return chkId.includes(".") && !chkId.includes(".meta");
  };

  const getSubPointNumber = (chkId) => {
    const match = chkId.match(/\.(\d+)$/);
    return match ? Number.parseInt(match[1]) : null;
  };

  const getCheckpointById = (checkpointId) => {
    return checkpoints.find((cp) => cp.CheckpointId === checkpointId);
  };

  const getMenuCategoryForCheckpoint = (checkpointId) => {
    for (const menu of menus) {
      if (menu.CheckpointId) {
        const ids = menu.CheckpointId.split(/[,;]/).map((id) =>
          Number.parseInt(id.trim()),
        );
        if (ids.includes(checkpointId)) {
          return menu.Cat;
        }
      }
    }
    return null;
  };

  const getTypeIcon = (typeId) => {
    switch (typeId) {
      case 4:
        return <DateRange color="primary" />;
      case 8:
        return <AttachFile color="primary" />;
      case 26:
        return <TextFields color="primary" />;
      default:
        return <QuestionAnswer color="primary" />;
    }
  };

  const getTypeLabel = (typeId) => {
    switch (typeId) {
      case 4:
        return "Date";
      case 8:
        return "File";
      case 26:
        return "Text";
      default:
        return "Question";
    }
  };

  const isDateField = (checkpointId) => {
    return getCheckpointById(checkpointId)?.TypeId === 4;
  };

  const isFileField = (checkpointId) => {
    return getCheckpointById(checkpointId)?.TypeId === 8;
  };

  const isTextField = (checkpointId) => {
    const cp = getCheckpointById(checkpointId);
    return (
      cp?.TypeId === 26 || !cp?.TypeId || (cp.TypeId !== 4 && cp.TypeId !== 8)
    );
  };

  // Helper function to get file icon
  const getFileIcon = (fileName) => {
    if (!fileName) return <AttachFile color="action" />;

    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
      return <ImageIcon color="primary" />;
    } else if (ext === "pdf") {
      return <PictureAsPdf color="error" />;
    } else if (["doc", "docx"].includes(ext)) {
      return <Description color="info" />;
    } else {
      return <AttachFile color="action" />;
    }
  };

  // Editing functions
  const handleEditClick = (item) => {
    setEditingId(item.taskDetail.SRNo);
    setEditedValues({
      ...editedValues,
      [item.taskDetail.SRNo]: item.taskDetail.Value,
    });

    // If it's a date field, parse the date
    const mainCheckpointId = extractMainCheckpointId(item.taskDetail.ChkId);
    if (isDateField(mainCheckpointId) && item.taskDetail.Value) {
      try {
        const date = new Date(item.taskDetail.Value);
        if (!isNaN(date.getTime())) {
          setDateValues({
            ...dateValues,
            [item.taskDetail.SRNo]: date,
          });
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedValues({});
    setFileUploads({});
    setDateValues({});
  };

  const handleValueChange = (srNo, value) => {
    setEditedValues({
      ...editedValues,
      [srNo]: value,
    });
  };

  const handleDateChange = (srNo, date) => {
    setDateValues({
      ...dateValues,
      [srNo]: date,
    });

    // Format date for API
    const formattedDate = date ? formatDateForAPI(date) : "";
    setEditedValues({
      ...editedValues,
      [srNo]: formattedDate,
    });
  };

  const handleFileChange = (srNo, event) => {
    const file = event.target.files[0];
    if (file) {
      setFileUploads({
        ...fileUploads,
        [srNo]: file,
      });
      // For file fields, store a placeholder value
      setEditedValues({
        ...editedValues,
        [srNo]: `[FILE:${file.name}]`,
      });
    }
  };

  const formatDateForAPI = (date) => {
    if (!date || isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-GB");
    } catch (error) {
      return dateString;
    }
  };

  // Convert file to base64 for API

  const handleSaveEdit = async (item) => {
    const mainCheckpointId = extractMainCheckpointId(item.taskDetail.ChkId);

    // Validation - skip for file fields (they can be empty)
    if (
      !isFileField(mainCheckpointId) &&
      !editedValues[item.taskDetail.SRNo]?.toString().trim()
    ) {
      showSnackbar("Value cannot be empty", "error");
      return;
    }

    setSaving(true);
    try {
      const activityId = item.taskDetail.ActivityId;
      const latLong = item.taskDetail.LatLong || null;

      // Handle different field types
      if (isFileField(mainCheckpointId) && fileUploads[item.taskDetail.SRNo]) {
        // Handle file upload
        await handleFileUpload(item, fileUploads[item.taskDetail.SRNo]);
      } else if (
        isDateField(mainCheckpointId) ||
        isTextField(mainCheckpointId)
      ) {
        // Handle text and date fields
        const dataArray = {};
        dataArray[item.taskDetail.ChkId] =
          editedValues[item.taskDetail.SRNo] || "";

        console.log("Saving text/date data:", {
          ActivityId: activityId,
          data: dataArray,
          LatLong: latLong,
        });

        const textResponse = await fetch(
          "https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ActivityId: activityId,
              data: dataArray,
              LatLong: latLong,
            }),
          },
        );

        const textResult = await textResponse.json();
        console.log("Edit response:", textResult);

        if (!textResult.success) {
          throw new Error(textResult.message || "Failed to update data");
        }
      }

      // Refresh task details
      await fetchTaskDetails();
      setEditingId(null);
      setEditedValues({});
      setFileUploads({});
      setDateValues({});
      showSnackbar("Successfully updated", "success");
    } catch (error) {
      console.error("Error saving:", error);
      showSnackbar(error.message || "Error saving changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (item, file) => {
    try {
      // Convert file to base64 with proper data URL format
      const base64String = await convertFileToBase64WithMime(file);

      // Create image data object
      const imageData = {};
      imageData[item.taskDetail.ChkId] = base64String;

      const payload = {
        menuId: 10,
        ActivityId: item.taskDetail.ActivityId,
        LatLong: item.taskDetail.LatLong || null,
        TaskId: TaskId, // Add TaskId from URL params
        DateTime: new Date().toISOString(),
        data: imageData,
      };

      console.log("Uploading file payload:", {
        ...payload,
        data: { [item.taskDetail.ChkId]: `[BASE64_DATA_URL:${file.type}]` },
      });

      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/menu/add_image.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      console.log("File upload API response:", result);

      if (!result.success) {
        throw new Error(result.message || "File upload failed");
      }
      return result;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  };

  // Helper function to convert file to base64 with proper data URL format
  const convertFileToBase64WithMime = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Return the full data URL including mime type
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Update the convertFileToBase64 function to also support data URLs
  const convertFileToBase64 = (file) => {
    return convertFileToBase64WithMime(file);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setSaving(true);
    try {
      // Set empty value to delete
      const dataArray = {};
      dataArray[itemToDelete.taskDetail.ChkId] = "";

      const response = await fetch(
        "https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ActivityId: itemToDelete.taskDetail.ActivityId,
            data: dataArray,
            LatLong: itemToDelete.taskDetail.LatLong || null,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        await fetchTaskDetails();
        showSnackbar("Successfully deleted", "success");
      } else {
        throw new Error(result.message || "Failed to delete");
      }
    } catch (error) {
      showSnackbar(error.message || "Error deleting item", "error");
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const getGroupedCheckpoints = () => {
    const grouped = {};

    taskDetails.forEach((detail) => {
      if (!detail.ChkId.includes(".meta")) {
        const mainCheckpointId = extractMainCheckpointId(detail.ChkId);
        if (!grouped[mainCheckpointId]) {
          grouped[mainCheckpointId] = {
            mainCheckpointId,
            checkpoint: getCheckpointById(mainCheckpointId),
            menuCategory: getMenuCategoryForCheckpoint(mainCheckpointId),
            items: [],
          };
        }

        grouped[mainCheckpointId].items.push({
          taskDetail: detail,
          isSubPoint: hasSubPoint(detail.ChkId),
          subPointNumber: getSubPointNumber(detail.ChkId),
          isImage: isImageUrl(detail.Value),
        });
      }
    });

    return Object.values(grouped);
  };

  const handleImageClick = (imageValue) => {
    const fullImageUrl = getFullImageUrl(imageValue);
    setSelectedImage(fullImageUrl);
    setImageDialogOpen(true);
    setZoomLevel(1);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
    setZoomLevel(1);
  };

  const downloadImage = (imageValue, checkpointId, subPoint = null) => {
    const fullImageUrl = getFullImageUrl(imageValue);
    const link = document.createElement("a");
    link.href = fullImageUrl;
    link.download = `task-${TaskId}-checkpoint-${checkpointId}${subPoint ? `-subpoint-${subPoint}` : ""}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev - 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const renderAnswerContent = (item, group) => {
    const isEditing = editingId === item.taskDetail.SRNo;
    const mainCheckpointId = extractMainCheckpointId(item.taskDetail.ChkId);
    const checkpoint = getCheckpointById(mainCheckpointId);

    if (isEditing) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Date Field */}
          {isDateField(mainCheckpointId) && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={dateValues[item.taskDetail.SRNo] || null}
                onChange={(date) =>
                  handleDateChange(item.taskDetail.SRNo, date)
                }
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          )}

          {/* File Field */}
          {isFileField(mainCheckpointId) && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <input
                type="file"
                id={`file-upload-${item.taskDetail.SRNo}`}
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(item.taskDetail.SRNo, e)}
                accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <label htmlFor={`file-upload-${item.taskDetail.SRNo}`}>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Choose File
                </Button>
              </label>

              {fileUploads[item.taskDetail.SRNo] && (
                <Box sx={{ p: 1, border: "1px solid #ddd", borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Selected File:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    {getFileIcon(fileUploads[item.taskDetail.SRNo].name)}
                    <Box>
                      <Typography variant="body2">
                        {fileUploads[item.taskDetail.SRNo].name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(
                          fileUploads[item.taskDetail.SRNo].size / 1024
                        ).toFixed(2)}{" "}
                        KB
                      </Typography>
                    </Box>
                  </Box>

                  {fileUploads[item.taskDetail.SRNo].type.startsWith(
                    "image/",
                  ) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block">
                        Preview:
                      </Typography>
                      <img
                        src={URL.createObjectURL(
                          fileUploads[item.taskDetail.SRNo],
                        )}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          borderRadius: "4px",
                          marginTop: "8px",
                          border: "1px solid #eee",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {!fileUploads[item.taskDetail.SRNo] && item.taskDetail.Value && (
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                    bgcolor: "#f9f9f9",
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Current File:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    {getFileIcon(item.taskDetail.Value)}
                    <Typography variant="body2">
                      {item.taskDetail.Value.split("/").pop()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Text/Other Field */}
          {isTextField(mainCheckpointId) && (
            <TextField
              fullWidth
              multiline
              rows={3}
              value={
                editedValues[item.taskDetail.SRNo] ||
                item.taskDetail.Value ||
                ""
              }
              onChange={(e) =>
                handleValueChange(item.taskDetail.SRNo, e.target.value)
              }
              variant="outlined"
            />
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="success"
              startIcon={
                saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Save />
                )
              }
              onClick={() => handleSaveEdit(item)}
              disabled={saving}
              size="small"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCancelEdit}
              disabled={saving}
              size="small"
            >
              Cancel
            </Button>
          </Box>
        </Box>
      );
    }

    // View mode
    if (item.isImage) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ImageThumbnail
            onClick={() => handleImageClick(item.taskDetail.Value)}
          >
            <img
              src={getFullImageUrl(item.taskDetail.Value) || "/placeholder.svg"}
              alt={`Checkpoint ${group.mainCheckpointId}`}
              onError={(e) => {
                e.target.src = "/placeholder.svg";
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
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {getFileIcon(item.taskDetail.Value)}
              <Typography variant="body2" color="text.secondary">
                {item.taskDetail.Value.split("/").pop()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleImageClick(item.taskDetail.Value)}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
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
              {user.role === "Project Manager" && (
                <Tooltip title="Edit">
                  <EditButton
                    size="small"
                    onClick={() => handleEditClick(item)}
                  >
                    <Edit fontSize="small" />
                  </EditButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      );
    }

    // Text/Date field view mode
    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {item.taskDetail.Value || "No answer provided"}
              {isDateField(mainCheckpointId) && item.taskDetail.Value && (
                <Typography
                  variant="caption"
                  sx={{ ml: 1, color: "text.secondary" }}
                >
                  ({formatDateForDisplay(item.taskDetail.Value)})
                </Typography>
              )}
            </Typography>
            {item.taskDetail.Datetime && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <CalendarToday fontSize="inherit" />
                Recorded: {new Date(item.taskDetail.Datetime).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {user.role === "Project Manager" && (
              <Tooltip title="Edit">
                <EditButton size="small" onClick={() => handleEditClick(item)}>
                  <Edit fontSize="small" />
                </EditButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

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
    );
  }

  const groupedCheckpoints = getGroupedCheckpoints();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Task Details #{TaskId}
            </Typography>
          </Box>
          <Chip
            icon={<Edit />}
            label="Edit Mode"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Main Content */}
        <StyledCard>
          <CardContent sx={{ p: 0 }}>
            {groupedCheckpoints.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">
                  No checkpoint data found for this task.
                </Alert>
              </Box>
            ) : (
              <StyledTableContainer component={Paper} elevation={0}>
                <Table>
                  <StyledTableHead>
                    <TableRow>
                      <StyledTableCell sx={{ width: "40%" }}>
                        Question
                      </StyledTableCell>
                      <StyledTableCell sx={{ width: "40%" }}>
                        Answer
                      </StyledTableCell>
                      
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
                              itemIndex === group.items.length - 1 &&
                              groupIndex < groupedCheckpoints.length - 1
                                ? "2px solid"
                                : "1px solid",
                            borderBottomColor:
                              itemIndex === group.items.length - 1 &&
                              groupIndex < groupedCheckpoints.length - 1
                                ? "divider"
                                : "divider",
                          }}
                        >
                          <QuestionCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1,
                              }}
                            >
                              {group.checkpoint &&
                                getTypeIcon(group.checkpoint.TypeId)}
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {group.checkpoint?.Description ||
                                    `Checkpoint ${group.mainCheckpointId}`}
                                </Typography>
                                {item.isSubPoint && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                  >
                                    Sub-point: {item.taskDetail.ChkId}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </QuestionCell>

                          <AnswerCell>
                            {renderAnswerContent(item, group)}
                          </AnswerCell>

                         
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </StyledTableContainer>
            )}
          </CardContent>
        </StyledCard>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this entry? This action cannot be
              undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

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
            <IconButton
              onClick={handleCloseImageDialog}
              sx={{ color: "white" }}
            >
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
                    e.target.src = "/placeholder.svg";
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
              <IconButton
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                sx={{ color: "white" }}
              >
                <ZoomOut />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset Zoom">
              <IconButton onClick={handleResetZoom} sx={{ color: "white" }}>
                <ZoomOutMap />
              </IconButton>
            </Tooltip>

            <Tooltip title="Zoom In">
              <IconButton
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                sx={{ color: "white" }}
              >
                <ZoomIn />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download">
              <IconButton
                onClick={() =>
                  selectedImage && downloadImage(selectedImage, "fullscreen")
                }
                sx={{ color: "white" }}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default TaskView;
