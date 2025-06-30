"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import {
  Grid,
  Box,
  Button,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  CircularProgress,
  Container,
  InputAdornment
} from "@mui/material"
import { useNavigate } from "react-router-dom"

function AdmissionFormLogic() {
  const [pages, setPages] = useState([])
  const [checkpoints, setCheckpoints] = useState([])
  const [types, setTypes] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [visibleDependents, setVisibleDependents] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const navigate = useNavigate()

  // Amount fields configuration
  const amountFieldIds = [62, 64, 66, 70];
  const totalFieldId = 72 // Field to display total

  // Format currency helper
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  // Calculate sum whenever any amount field changes
 // Calculate total bid value whenever any amount field changes
useEffect(() => {
  // Get all the required field values
  const field61 = parseFloat(formData[61]) || 0;  // Quantity 1
  const field62 = parseFloat(formData[62]) || 0;  // Rate 1
  const field63 = parseFloat(formData[63]) || 0;  // Quantity 2
  const field64 = parseFloat(formData[64]) || 0;  // Rate 2
  const field65 = parseFloat(formData[65]) || 0;  // Quantity 3
  const field66 = parseFloat(formData[66]) || 0;  // Rate 3
  const field69 = parseFloat(formData[69]) || 0;  // Quantity 4
  const field70 = parseFloat(formData[70]) || 0;  // Rate 4

  // Calculate the total using the formula
  const total = (field61 * field62) + 
                (field63 * field64) + 
                (field65 * field66) + 
                (field69 * field70);

  // Update total field if sum has changed
  if (formData[totalFieldId] !== total.toString()) {
    handleChange(totalFieldId, total.toFixed(2));
  }
}, [formData[61], formData[62], formData[63], formData[64], 
    formData[65], formData[66], formData[69], formData[70]]);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: false }))

    // Handle dependencies when value changes
    updateDependentFields(id, value)
  }

  // Function to update dependent fields based on parent field value
  const updateDependentFields = (parentId, value) => {
    const parentCheckpoint = checkpoints.find((cp) => cp.CheckpointId === parentId)

    if (!parentCheckpoint || !parentCheckpoint.Dependent || parentCheckpoint.Dependent.trim() === "") {
      return
    }

    if (parentCheckpoint.Dependent.trim() === "6") {
      const newVisibleDependents = { ...visibleDependents }
      newVisibleDependents[parentId] = [6]
      setVisibleDependents(newVisibleDependents)
      return
    }

    if ([5, 6, 9].includes(parentCheckpoint.TypeId)) {
      const options = parentCheckpoint.Options ? parentCheckpoint.Options.split(",").map((opt) => opt.trim()) : []
      const dependentMapping = parentCheckpoint.Dependent.split(":").map((dep) => dep.trim())

      const newVisibleDependents = { ...visibleDependents }

      if (parentCheckpoint.TypeId === 5 || (parentCheckpoint.TypeId === 9 && parentCheckpoint.Correct !== "1")) {
        const selectedIndex = options.findIndex((opt) => opt.trim() === value)

        if (selectedIndex !== -1 && selectedIndex < dependentMapping.length) {
          const dependentIds = dependentMapping[selectedIndex]
            .split(",")
            .filter((id) => id !== "0")
            .map((id) => Number.parseInt(id))

          newVisibleDependents[parentId] = dependentIds
        } else {
          newVisibleDependents[parentId] = []
        }
      }
      else if (parentCheckpoint.TypeId === 6 || (parentCheckpoint.TypeId === 9 && parentCheckpoint.Correct === "1")) {
        const selectedValues = Array.isArray(value) ? value : value ? value.split(",").map((v) => v.trim()) : []
        const dependentIds = []
        selectedValues.forEach((val) => {
          const optionIndex = options.findIndex((opt) => opt.trim() === val)
          if (optionIndex !== -1 && optionIndex < dependentMapping.length) {
            const ids = dependentMapping[optionIndex]
              .split(",")
              .filter((id) => id !== "0")
              .map((id) => Number.parseInt(id))
            dependentIds.push(...ids)
          }
        })

        newVisibleDependents[parentId] = dependentIds
      }

      setVisibleDependents(newVisibleDependents)
    }
  }

  const isVisibleDependent = (checkpointId) => {
    for (const parentId in visibleDependents) {
      if (visibleDependents[parentId].includes(checkpointId)) {
        return true
      }
    }
    return false
  }

  const getParentId = (checkpointId) => {
    for (const parentId in visibleDependents) {
      if (visibleDependents[parentId].includes(checkpointId)) {
        return Number.parseInt(parentId)
      }
    }
    return null
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const menuRes = await axios.get("https://namami-infotech.com/SANCHAR/src/menu/get_menu.php")
        const checkpointRes = await axios.get("https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php")
        const typeRes = await axios.get("https://namami-infotech.com/SANCHAR/src/menu/get_types.php")

        const checkpointIds = menuRes.data.data[0].CheckpointId.split(";").map((p) =>
          p.split(",").map((id) => Number.parseInt(id)),
        )

        setPages(checkpointIds)
        setCheckpoints(checkpointRes.data.data)
        setTypes(typeRes.data.data)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoadingError("Failed to load form data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    Object.entries(formData).forEach(([id, value]) => {
      updateDependentFields(Number.parseInt(id), value)
    })
  }, [checkpoints])

  const getType = (typeId) => {
    const type = types.find((t) => t.TypeId === typeId)
    return type ? type.Type.trim() : "Unknown"
  }

  const renderField = (cp) => {
    const type = getType(cp.TypeId).trim()
    const options = cp.Options ? cp.Options.split(",").map((opt) => opt.trim()) : []
    const value = formData[cp.CheckpointId] || ""
    const error = errors[cp.CheckpointId]
    const editable = cp.Editable === 1
    const isMandatory = cp.Mandatory === 1

    // Special case for total amount field (72)
    if (cp.CheckpointId === totalFieldId) {
      return (
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Typography sx={{ fontWeight: 500, color: "#555" }}>
              {cp.Description}
              {isMandatory && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              value={formatCurrency(value || "0")}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f5f5f5",
                  "& input": {
                    fontWeight: "bold",
                    color: "#2e7d32",
                  }
                },
              }}
            />
          </Grid>
        </Grid>
      )
    }

    // Special case for amount fields (62, 64, 66, 70)
    if (amountFieldIds.includes(cp.CheckpointId)) {
      return (
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Typography sx={{ fontWeight: 500, color: "#555" }}>
              {cp.Description}
              {isMandatory && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              type="number"
              value={value}
              onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
              error={error}
              helperText={error ? "This field is required" : ""}
              disabled={!editable}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              inputProps={{
                step: "0.01",
                min: "0"
              }}
              sx={{
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value) || 0
                handleChange(cp.CheckpointId, num.toFixed(2))
              }}
            />
          </Grid>
        </Grid>
      )
    }

    if (type.toLowerCase().includes("header")) {
      return (
        <Typography variant="h6" sx={{ mt: 3, mb: 1, textAlign: "center", color: "#F69320", fontWeight: "bold" }}>
          {cp.Description}
        </Typography>
      )
    }

    if (type.toLowerCase().includes("description")) {
      return (
        <Typography sx={{ mb: 2, fontStyle: "italic", color: "#666", textAlign: "center" }}>
          {cp.Description}
        </Typography>
      )
    }

    return (
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={4}>
          <Typography sx={{ fontWeight: 500, color: "#555" }}>
            {cp.Description}
            {isMandatory && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
          </Typography>
        </Grid>
        <Grid item xs={8}>
          {(() => {
            switch (type) {
              case "Text":
                return (
                  <TextField
                    fullWidth
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                    }}
                  />
                )

              case "Email":
                return (
                  <TextField
                    fullWidth
                    type="email"
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                    }}
                  />
                )
              case "Number":
              case "Digit":
                return (
                  <TextField
                    fullWidth
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                    }}
                  />
                )

              case "Long Text":
                return (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                    }}
                  />
                )

              case "Date":
                return (
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                    }}
                  />
                )

              case "Dropdown":
                const isMultiSelect = cp.Correct === "1"

                return (
                  <Autocomplete
                    fullWidth
                    multiple={isMultiSelect}
                    options={options}
                    value={
                      isMultiSelect ? (value ? (Array.isArray(value) ? value : value.split(",")) : []) : value || null
                    }
                    onChange={(event, newValue) => {
                      const finalValue = isMultiSelect ? newValue.join(",") : newValue
                      handleChange(cp.CheckpointId, finalValue)
                    }}
                    disabled={!editable}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label=""
                        error={error}
                        helperText={error ? "This field is required" : ""}
                        sx={{
                          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#F69320",
                          },
                        }}
                      />
                    )}
                  />
                )

              case "Radio":
                return (
                  <>
                    <RadioGroup row value={value} onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}>
                      {options.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={
                            <Radio
                              disabled={!editable}
                              sx={{
                                "&.Mui-checked": {
                                  color: "#F69320",
                                },
                              }}
                            />
                          }
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                    {error && (
                      <Typography color="error" variant="body2">
                        This field is required
                      </Typography>
                    )}
                  </>
                )

              case "Checkbox":
                return (
                  <FormGroup row>
                    {options.map((opt) => (
                      <FormControlLabel
                        key={opt}
                        control={
                          <Checkbox
                            checked={value?.includes(opt)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              let updated = []

                              if (typeof value === "string") {
                                updated = value ? value.split(",").map((v) => v.trim()) : []
                              } else if (Array.isArray(value)) {
                                updated = [...value]
                              }

                              if (checked && !updated.includes(opt)) {
                                updated.push(opt)
                              } else if (!checked) {
                                updated = updated.filter((v) => v !== opt)
                              }

                              handleChange(cp.CheckpointId, updated)
                            }}
                            disabled={!editable}
                            sx={{
                              "&.Mui-checked": {
                                color: "#F69320",
                              },
                            }}
                          />
                        }
                        label={opt}
                      />
                    ))}
                  </FormGroup>
                )

              case "Pic/Camera":
                return (
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        borderColor: error ? "#d32f2f" : "#ddd",
                        color: error ? "#d32f2f" : "#666",
                        "&:hover": {
                          borderColor: "#F69320",
                          backgroundColor: "rgba(246, 147, 32, 0.04)",
                        },
                      }}
                      disabled={!editable}
                    >
                      {value ? "Change File" : "Upload File"}
                      <input
                        type="file"
                        hidden
                        accept="image/png, image/jpeg, application/pdf"
                        onChange={(e) => handleChange(cp.CheckpointId, e.target.files[0])}
                      />
                    </Button>
                    {value && (
                      <Typography variant="body2" sx={{ mt: 1, color: "#666" }}>
                        Selected: {value.name}
                      </Typography>
                    )}
                    {error && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        This field is required
                      </Typography>
                    )}
                  </Box>
                )

              default:
                return <TextField size="small" disabled />
            }
          })()}
        </Grid>
      </Grid>
    )
  }

  const renderCheckpointWithDependents = (cp, pageData) => {
    const isEven = pageData.indexOf(cp.CheckpointId) % 2 === 0
    const bgColor = isEven ? "#f8f8f8" : "#ffffff"

    const dependentIds = visibleDependents[cp.CheckpointId] || []
    const dependentCheckpoints = checkpoints.filter((c) => dependentIds.includes(c.CheckpointId))

    return (
      <Paper
        key={cp.CheckpointId}
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 1,
          maxWidth: "85%",
          mx: "auto",
          mb: 2,
          backgroundColor: bgColor,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box sx={{ flexGrow: 1 }}>{renderField(cp)}</Box>
        </Box>

        {dependentCheckpoints.length > 0 && (
          <Box
            sx={{
              pl: 4,
              mt: 2,
              borderLeft: "2px solid #F69320",
            }}
          >
            {dependentCheckpoints.map((depCp) => (
              <Box key={depCp.CheckpointId} sx={{ mb: 1 }}>
                {renderField(depCp)}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    )
  }

  const pageData = pages[currentPage] || []

  const handleNext = () => {
    setCurrentPage((prev) => prev + 1)
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      const newErrors = {}
      let hasErrors = false

      pages.forEach((pageCheckpoints) => {
        pageCheckpoints.forEach((id) => {
          const cp = checkpoints.find((c) => c.CheckpointId === id)
          const value = formData[id]
          if (!cp) return

          const type = getType(cp.TypeId).toLowerCase()
          if (type.includes("header") || type.includes("description")) return

          if (
            cp.Mandatory === 1 &&
            (value === undefined ||
              value === null ||
              (typeof value === "string" && value.trim() === "") ||
              (Array.isArray(value) && value.length === 0))
          ) {
            newErrors[id] = true
            hasErrors = true
          }
        })
      })

      if (hasErrors) {
        setErrors(newErrors)
        Swal.fire({
          icon: "error",
          title: "Missing Required Fields",
          text: "Please fill all mandatory fields before submitting.",
        })
        return
      }
    }

    setErrors({})

    const menuId = 1
    const date = new Date()
    const dateTime = date.toISOString().slice(0, 19).replace("T", " ")

    Swal.fire({
      title: isDraft ? "Saving draft..." : "Submitting form...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLong = `${pos.coords.latitude}, ${pos.coords.longitude}`
        const activityId = `${dateTime.replace(/\D/g, "")}_${latLong.replace(/[^0-9]/g, "")}`

        const submitData = async () => {
          const textData = {}
          const imageData = {}

          for (const cp of checkpoints) {
            const id = cp.CheckpointId.toString()
            const type = getType(cp.TypeId).toLowerCase()
            const value = formData[id]

            const parentId = getParentId(cp.CheckpointId)

            if (parentId) {
              const combinedId = `${parentId}_${cp.CheckpointId}`

              if (type === "pic/camera") {
                if (value) {
                  const base64 = await convertToBase64(value)
                  imageData[combinedId] = base64
                }
              } else if (
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0)
              ) {
                textData[combinedId] = null
              } else {
                textData[combinedId] = Array.isArray(value) ? value.join(",") : value
              }

              continue
            }

            if (type === "pic/camera") {
              if (value) {
                const base64 = await convertToBase64(value)
                imageData[id] = base64
              }
              continue
            }

            if (
              value === undefined ||
              value === null ||
              (typeof value === "string" && value.trim() === "") ||
              (Array.isArray(value) && value.length === 0)
            ) {
              textData[id] = null
            } else {
              textData[id] = Array.isArray(value) ? value.join(",") : value
            }
          }

          try {
            await axios.post("https://namami-infotech.com/SANCHAR/src/menu/add_transaction.php", {
              menuId,
              ActivityId: activityId,
              LatLong: latLong,
              Draft: isDraft ? 1 : 0,
              data: textData,
            })

            if (Object.keys(imageData).length > 0) {
              await axios.post("https://namami-infotech.com/SANCHAR/src/menu/add_image.php", {
                menuId,
                ActivityId: activityId,
                LatLong: latLong,
                data: imageData,
              })
            }

            Swal.fire({
              icon: "success",
              title: isDraft ? "Draft Saved" : "Form Submitted",
              text: isDraft ? "Your draft has been saved successfully!" : "Your form has been submitted successfully!",
              confirmButtonColor: "#F69320",
            }).then(() => {
              navigate("/tender")
            })
          } catch (error) {
            console.error("Submission error", error)
            Swal.fire({
              icon: "error",
              title: "Submission Failed",
              text: "There was an error processing your request. Please try again.",
              confirmButtonColor: "#F69320",
            })
          }
        }

        submitData()
      },
      (error) => {
        Swal.fire({
          icon: "error",
          title: "Location Access Denied",
          text: "Please allow location access to submit the form.",
          confirmButtonColor: "#F69320",
        })
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
        <CircularProgress sx={{ color: "#F69320" }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading form...
        </Typography>
      </Box>
    )
  }

  if (loadingError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Box sx={{ maxWidth: 500, textAlign: "center", p: 3, bgcolor: "#ffebee", borderRadius: 1 }}>
          <Typography color="error" variant="h6">
            {loadingError}
          </Typography>
          <Button
            sx={{ mt: 2, color: "#F69320", borderColor: "#F69320" }}
            onClick={() => window.location.reload()}
            variant="outlined"
          >
            Retry
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box
        sx={{
          background: "linear-gradient(to right, #F69320, #FFC107)",
          color: "white",
          p: 2,
          borderRadius: 1,
          textAlign: "center",
          mb: 3,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {currentPage >= 3 ? "Letter Of Allotment" : "Tender Application Form"}
        </Typography>
        <Typography variant="body2">
          {currentPage >= 3 ? "Please complete the Letter Of Allotment details" : "Please complete all sections"}
        </Typography>
      </Box>

      <Stepper
        activeStep={currentPage}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepIcon-root.Mui-active": {
            color: "#F69320",
          },
          "& .MuiStepIcon-root.Mui-completed": {
            color: "#4caf50",
          },
        }}
      >
        {pages.map((_, index) => (
          <Step key={index}>
            <StepLabel>Step {index + 1}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Step {currentPage + 1} of {pages.length}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        {pageData.map((id) => {
          const cp = checkpoints.find((c) => c.CheckpointId === id)
          if (!cp) return null

          if (isVisibleDependent(cp.CheckpointId)) {
            return null
          }

          return renderCheckpointWithDependents(cp, pageData)
        })}
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
        {currentPage > 0 && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              minWidth: "120px",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
            onClick={handlePrevious}
          >
            Previous
          </Button>
        )}

        {currentPage === pages.length - 1 ? (
          <>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#757575",
                color: "white",
                minWidth: "120px",
                "&:hover": {
                  backgroundColor: "#616161",
                },
              }}
              onClick={() => handleSubmit(true)}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#F69320",
                color: "white",
                minWidth: "120px",
                "&:hover": {
                  backgroundColor: "#e08416",
                },
              }}
              onClick={() => handleSubmit(false)}
            >
              Submit
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#F69320",
              color: "white",
              minWidth: "120px",
              "&:hover": {
                backgroundColor: "#e08416",
              },
            }}
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Fields marked with <span style={{ color: "red" }}>*</span> are mandatory
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your progress is saved as you navigate between steps
        </Typography>
      </Box>
    </Container>
  )
}

export default AdmissionFormLogic