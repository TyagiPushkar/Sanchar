"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
} from "@mui/material"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Plus, Search } from 'lucide-react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material"



function BuyerList() {
  const [buyers, setBuyers] = useState([])
  const [filteredBuyers, setFilteredBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
const [selectedBuyer, setSelectedBuyer] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchBuyerData = async () => {
      setLoading(true)
      try {
        const response = await axios.get("https://namami-infotech.com/SANCHAR/src/buyer/buyer_list.php")
        if (response.data.success) {
          setBuyers(response.data.data)
          setFilteredBuyers(response.data.data)
        } else {
          setError("No buyer data found.")
        }
      } catch (err) {
        setError("Failed to fetch buyer data.")
      } finally {
        setLoading(false)
      }
    }
    fetchBuyerData()
  }, [])

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase()
    setSearchTerm(value)
    const filtered = buyers.filter((buyer) => {
      return (
        buyer.ZoneID?.toString().toLowerCase().includes(value) ||
        buyer.ZoneName?.toLowerCase().includes(value) ||
        buyer.DivisionID?.toString().toLowerCase().includes(value) ||
        buyer.DivisionName?.toLowerCase().includes(value) ||
        buyer.StationID?.toString().toLowerCase().includes(value) ||
        buyer.StationName?.toLowerCase().includes(value)
      )
    })
    setFilteredBuyers(filtered)
    setPage(0)
  }

  const handleChangePage = (event, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading) {
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
    <Box>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="md">
  <DialogTitle>Edit Buyer</DialogTitle>
  <DialogContent>
    {selectedBuyer && (
      <Box mt={2} display="flex" flexDirection="column" gap={2}>
        <TextField label="LOA" value={selectedBuyer.LOA} onChange={e => setSelectedBuyer({ ...selectedBuyer, LOA: e.target.value })} />
        <TextField label="Zone ID" value={selectedBuyer.ZoneID} onChange={e => setSelectedBuyer({ ...selectedBuyer, ZoneID: e.target.value })} />
        <TextField label="Zone Name" value={selectedBuyer.ZoneName} onChange={e => setSelectedBuyer({ ...selectedBuyer, ZoneName: e.target.value })} />
        <TextField label="Zone Address" value={selectedBuyer.ZoneAddress} onChange={e => setSelectedBuyer({ ...selectedBuyer, ZoneAddress: e.target.value })} />
        <TextField label="Division ID" value={selectedBuyer.DivisionID} onChange={e => setSelectedBuyer({ ...selectedBuyer, DivisionID: e.target.value })} />
        <TextField label="Division Name" value={selectedBuyer.DivisionName} onChange={e => setSelectedBuyer({ ...selectedBuyer, DivisionName: e.target.value })} />
        <TextField label="Division Address" value={selectedBuyer.DivisionAddress} onChange={e => setSelectedBuyer({ ...selectedBuyer, DivisionAddress: e.target.value })} />
        <TextField label="Station ID" value={selectedBuyer.StationID} onChange={e => setSelectedBuyer({ ...selectedBuyer, StationID: e.target.value })} />
        <TextField label="Station Name" value={selectedBuyer.StationName} onChange={e => setSelectedBuyer({ ...selectedBuyer, StationName: e.target.value })} />
        <TextField label="Station Address" value={selectedBuyer.StationAddress} onChange={e => setSelectedBuyer({ ...selectedBuyer, StationAddress: e.target.value })} />
        <TextField label="Section Name" value={selectedBuyer.SectionName} onChange={e => setSelectedBuyer({ ...selectedBuyer, SectionName: e.target.value })} />
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
    <Button
      variant="contained"
      sx={{ backgroundColor: "#F69320" }}
      onClick={async () => {
        try {
          const res = await axios.post("https://namami-infotech.com/SANCHAR/src/buyer/update_buyer.php", selectedBuyer)
          if (res.data.success) {
            alert("Buyer updated successfully")
            setEditDialogOpen(false)
            setBuyers(prev =>
              prev.map(b => (b.BuyerID === selectedBuyer.BuyerID ? selectedBuyer : b))
            )
            setFilteredBuyers(prev =>
              prev.map(b => (b.BuyerID === selectedBuyer.BuyerID ? selectedBuyer : b))
            )
            
          } else {
            alert("Update failed: " + res.data.message)
          }
        } catch (err) {
          alert("Error updating buyer.")
        }
      }}
    >
      Save
    </Button>
  </DialogActions>
</Dialog>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" color="#333">
            Buyer List
          </Typography>

          <Box display="flex" gap={2}>
            <TextField
              label="Search buyers"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search size={18} color="#666" style={{ marginRight: "8px" }} />,
              }}
              sx={{
                width: 300,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F69320",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#F69320",
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate("/new-buyer")}
              sx={{
                backgroundColor: "#F69320",
                "&:hover": {
                  backgroundColor: "#e08416",
                },
              }}
            >
              New Buyer
            </Button>
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer
              sx={{
                mb: 2,
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                width: "100%",
              }}
            >
              <Table size="medium">
                <TableHead sx={{ backgroundColor: "#F69320" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Zone ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Zone Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Division ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Division Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Section Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Station ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Station Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>LOA</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBuyers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">No buyers found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuyers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((buyer, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(246, 147, 32, 0.04)",
                          },
                        }}
                      >
                        <TableCell>{buyer.ZoneID}</TableCell>
                        <TableCell>{buyer.ZoneName}</TableCell>
                        <TableCell>{buyer.DivisionID}</TableCell>
                        <TableCell>{buyer.DivisionName}</TableCell>
                        <TableCell>{buyer.SectionName}</TableCell>
                        <TableCell>{buyer.StationID}</TableCell>
                        <TableCell>{buyer.StationName}</TableCell>
                        <TableCell>{buyer.LOA}</TableCell>
                        <TableCell>
  <Button size="small" onClick={() => { setSelectedBuyer(buyer); setEditDialogOpen(true); }}>
    Edit
  </Button>
</TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredBuyers.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 25]}
              sx={{
                ".MuiTablePagination-selectIcon": {
                  color: "#F69320",
                },
                ".MuiTablePagination-select": {
                  fontWeight: 500,
                },
                ".Mui-selected": {
                  backgroundColor: "#F69320 !important",
                  color: "white",
                },
              }}
            />
          </>
        )}       
    </Box>
  )
}

export default BuyerList
