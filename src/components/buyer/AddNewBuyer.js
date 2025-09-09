"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  CircularProgress,
  Container,
} from "@mui/material"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function AddNewBuyer() {
  const [form, setForm] = useState({
    ZoneID: "",
    ZoneName: "",
    ZoneAddress: "",
    DivisionID: "",
    DivisionName: "",
    DivisionAddress: "",
    SectionName: "",
    StationID: "",
    StationName: "",
    StationAddress: "",
    LOA:""
  })

  const [buyerData, setBuyerData] = useState([])
  const [zoneMode, setZoneMode] = useState("existing")
  const [divisionMode, setDivisionMode] = useState("existing")
  const [sectionMode, setSectionMode] = useState("existing")

  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBuyerData = async () => {
      setDataLoading(true)
      try {
        const res = await axios.get("https://namami-infotech.com/SANCHAR/src/buyer/buyer_list.php")
        if (res.data.success) {
          setBuyerData(res.data.data)
        } else {
          setErrorMsg("Failed to load buyer data.")
        }
      } catch (error) {
        setErrorMsg("Failed to load buyer data.")
      } finally {
        setDataLoading(false)
      }
    }

    fetchBuyerData()
  }, [])

  // Unique Zones with full info including address
  const uniqueZones = [
    ...new Map(
      buyerData.map((b) => [
        b.ZoneID,
        {
          id: b.ZoneID,
          name: b.ZoneName,
          address: b.ZoneAddress || "",
        },
      ]),
    ).values(),
  ]

  // Unique Divisions with full info including address
  const uniqueDivisions = [
    ...new Map(
      buyerData.map((b) => [
        b.DivisionID,
        {
          id: b.DivisionID,
          name: b.DivisionName,
          address: b.DivisionAddress || "",
        },
      ]),
    ).values(),
  ]

  // Unique Sections with only name
  const uniqueSections = [
    ...new Set(
      buyerData
        .map((b) => b.SectionName)
        .filter((name) => name && name.trim() !== ""), // Filter out empty/null section names
    ),
  ]

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // When selecting existing Zone, fill ZoneID, ZoneName, ZoneAddress
  const handleZoneChange = (_e, value) => {
    if (value) {
      setForm({
        ...form,
        ZoneID: value.id,
        ZoneName: value.name,
        ZoneAddress: value.address,
      })
    } else {
      setForm({ ...form, ZoneID: "", ZoneName: "", ZoneAddress: "" })
    }
  }

  // When selecting existing Division, fill DivisionID, DivisionName, DivisionAddress
  const handleDivisionChange = (_e, value) => {
    if (value) {
      setForm({
        ...form,
        DivisionID: value.id,
        DivisionName: value.name,
        DivisionAddress: value.address,
      })
    } else {
      setForm({ ...form, DivisionID: "", DivisionName: "", DivisionAddress: "" })
    }
  }

  // When selecting existing Section, fill only SectionName
  const handleSectionChange = (_e, value) => {
    if (value) {
      setForm({
        ...form,
        SectionName: value,
      })
    } else {
      setForm({ ...form, SectionName: "" })
    }
  }

  const handleZoneModeChange = (_e, newMode) => {
    if (newMode !== null) {
      setZoneMode(newMode)
      if (newMode === "new") {
        setForm({ ...form, ZoneID: "", ZoneName: "", ZoneAddress: "" })
      }
    }
  }

  const handleDivisionModeChange = (_e, newMode) => {
    if (newMode !== null) {
      setDivisionMode(newMode)
      if (newMode === "new") {
        setForm({ ...form, DivisionID: "", DivisionName: "", DivisionAddress: "" })
      }
    }
  }

  const handleSectionModeChange = (_e, newMode) => {
    if (newMode !== null) {
      setSectionMode(newMode)
      if (newMode === "new") {
        setForm({ ...form, SectionName: "" })
      }
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setSuccessMsg("")
    setErrorMsg("")

    // Simple validation example for required fields
    if (
      !form.ZoneID ||
      !form.ZoneName ||
      !form.DivisionID ||
      !form.DivisionName ||
      !form.SectionName ||
      !form.StationID ||
      !form.StationName ||
      !form.LOA
    ) {
      setErrorMsg("Please fill all required fields.")
      setLoading(false)
      return
    }

    try {
      const response = await axios.post("https://namami-infotech.com/SANCHAR/src/buyer/add_buyer.php", form)

      if (response.data.success) {
        setSuccessMsg("Buyer added successfully!")
        setTimeout(() => navigate("/consignee"), 1000)
      } else {
        setErrorMsg(response.data.message || "Failed to add buyer.")
      }
    } catch (error) {
      setErrorMsg("API error: Failed to add buyer.")
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
        <CircularProgress sx={{ color: "#F69320" }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading buyer data...
        </Typography>
      </Box>
    )
  }

  return (
    <Container sx={{ mt: 0, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Typography variant="h5" mb={3} fontWeight="bold" color="#333">
          Add New Buyer
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              name="LOA"
              label="LOA"
              value={form.LOA}
              onChange={handleChange}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#F69320",
                },
              }}
            />
          </Grid>
          {/* ZONE MODE TOGGLE */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" mb={1} fontWeight={500} color="#555">
              Zone Information
            </Typography>
            <ToggleButtonGroup
              value={zoneMode}
              exclusive
              onChange={handleZoneModeChange}
              aria-label="zone mode"
              sx={{
                mb: 2,
                "& .MuiToggleButton-root.Mui-selected": {
                  backgroundColor: "#F69320",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#e08416",
                  },
                },
              }}
            >
              <ToggleButton value="existing">Existing Zone</ToggleButton>
              <ToggleButton value="new">New Zone</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* ZONE FIELDS */}
          {zoneMode === "existing" ? (
            <>
              <Grid item xs={12}>
                <Autocomplete
                  options={uniqueZones}
                  getOptionLabel={(option) => `${option.name} (${option.id})`}
                  value={form.ZoneID ? uniqueZones.find((z) => z.id === form.ZoneID) || null : null}
                  onChange={handleZoneChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Zone"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#F69320",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#F69320",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Zone Address"
                  value={form.ZoneAddress}
                  InputProps={{ readOnly: true }}
                  multiline
                  rows={2}
                  fullWidth
                  sx={{
                    backgroundColor: "#f9f9f9",
                  }}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  name="ZoneID"
                  label="Zone ID"
                  value={form.ZoneID}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  name="ZoneName"
                  label="Zone Name"
                  value={form.ZoneName}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="ZoneAddress"
                  label="Zone Address"
                  value={form.ZoneAddress}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
            </>
          )}

          {/* DIVISION MODE TOGGLE */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" mb={1} fontWeight={500} color="#555" sx={{ mt: 2 }}>
              Division Information
            </Typography>
            <ToggleButtonGroup
              value={divisionMode}
              exclusive
              onChange={handleDivisionModeChange}
              aria-label="division mode"
              sx={{
                mb: 2,
                "& .MuiToggleButton-root.Mui-selected": {
                  backgroundColor: "#F69320",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#e08416",
                  },
                },
              }}
            >
              <ToggleButton value="existing">Existing Division</ToggleButton>
              <ToggleButton value="new">New Division</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* DIVISION FIELDS */}
          {divisionMode === "existing" ? (
            <>
              <Grid item xs={12}>
                <Autocomplete
                  options={uniqueDivisions}
                  getOptionLabel={(option) => `${option.name} (${option.id})`}
                  value={form.DivisionID ? uniqueDivisions.find((d) => d.id === form.DivisionID) || null : null}
                  onChange={handleDivisionChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Division"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#F69320",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#F69320",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Division Address"
                  value={form.DivisionAddress}
                  InputProps={{ readOnly: true }}
                  multiline
                  rows={2}
                  fullWidth
                  sx={{
                    backgroundColor: "#f9f9f9",
                  }}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  name="DivisionID"
                  label="Division ID"
                  value={form.DivisionID}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  name="DivisionName"
                  label="Division Name"
                  value={form.DivisionName}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="DivisionAddress"
                  label="Division Address"
                  value={form.DivisionAddress}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F69320",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#F69320",
                    },
                  }}
                />
              </Grid>
            </>
          )}

          {/* SECTION MODE TOGGLE */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" mb={1} fontWeight={500} color="#555" sx={{ mt: 2 }}>
              Section Information
            </Typography>
            <ToggleButtonGroup
              value={sectionMode}
              exclusive
              onChange={handleSectionModeChange}
              aria-label="section mode"
              sx={{
                mb: 2,
                "& .MuiToggleButton-root.Mui-selected": {
                  backgroundColor: "#F69320",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#e08416",
                  },
                },
              }}
            >
              <ToggleButton value="existing">Existing Section</ToggleButton>
              <ToggleButton value="new">New Section</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* SECTION FIELDS */}
          {sectionMode === "existing" ? (
            <Grid item xs={12}>
              <Autocomplete
                options={uniqueSections}
                getOptionLabel={(option) => option}
                value={form.SectionName || null}
                onChange={handleSectionChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Section"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F69320",
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#F69320",
                      },
                    }}
                  />
                )}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField
                name="SectionName"
                label="Section Name"
                value={form.SectionName}
                onChange={handleChange}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#F69320",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#F69320",
                  },
                }}
              />
            </Grid>
          )}

          {/* STATION FIELDS (always new) */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" mb={1} fontWeight={500} color="#555" sx={{ mt: 2 }}>
              Station Information
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              name="StationID"
              label="Station ID"
              value={form.StationID}
              onChange={handleChange}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#F69320",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              name="StationName"
              label="Station Name"
              value={form.StationName}
              onChange={handleChange}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#F69320",
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="StationAddress"
              label="Station Address"
              value={form.StationAddress}
              onChange={handleChange}
              multiline
              rows={2}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#F69320",
                },
              }}
            />
          </Grid>
        </Grid>

        {/* MESSAGES */}
        {errorMsg && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {successMsg}
          </Alert>
        )}

        <Box mt={4} display="flex" gap={2}>
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#F69320",
              "&:hover": {
                backgroundColor: "#e08416",
              },
              minWidth: "120px",
            }}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/buyer")}
            sx={{
              borderColor: "#ddd",
              color: "#666",
              "&:hover": {
                borderColor: "#F69320",
                backgroundColor: "rgba(246, 147, 32, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default AddNewBuyer
