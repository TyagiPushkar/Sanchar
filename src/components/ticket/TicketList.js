import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Pagination,
  InputAdornment,
  Stack,
  Alert,
  IconButton
} from '@mui/material';
import { Search, Add, Visibility } from '@mui/icons-material';
import CreateTicketDialog from './CreateTicketDialog';
import { useNavigate } from 'react-router-dom';

const TicketList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const rowsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('https://namami-infotech.com/SANCHAR/src/support/get_tickets.php');
      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
        setFiltered(data.data);
      } else {
        setTickets([]);
        setFiltered([]);
        setError('Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Network error occurred while fetching tickets');
      setTickets([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
    // Navigate to ticket detail page with the ticket ID
    navigate(`/tickets/${ticketId}`);
  };

  const handleSearch = (event) => {
    const val = event.target.value.toLowerCase();
    setSearchTerm(val);
    const filteredList = tickets.filter(
      (ticket) =>
        ticket.Station?.toLowerCase().includes(val) ||
        ticket.EmpName?.toLowerCase().includes(val) ||
        ticket.ContactPerson?.toLowerCase().includes(val)
    );
    setFiltered(filteredList);
    setPage(1);
  };

  const handleTicketCreated = () => {
    fetchTickets();
    setIsCreateDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return 'primary';
      case 'in progress':
        return 'warning';
      case 'complete':
        return 'success';
      case 'wip':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTickets = filtered.slice(startIndex, endIndex);

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Support Tickets
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
          <TextField
            placeholder="Search by Station, Technician, or Contact Person"
            value={searchTerm}
            onChange={handleSearch}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ whiteSpace: 'nowrap', backgroundColor: '#F69320', color: '#fff', '&:hover': { backgroundColor: '#F69320' } }}
          >
            New Ticket
          </Button>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary">Loading tickets...</Typography>
        </Box>
      ) : (
        <>
          {/* Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F69320', color: '#fff' }}>
                    <TableCell sx={{ color: "#fff" }}><strong>ID</strong></TableCell>
                    <TableCell sx={{color:"#fff"}}><strong>LOA</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Technician</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Station</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Contact Person</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Contact Number</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Status</strong></TableCell>
                  <TableCell sx={{ color: "#fff" }}><strong>Assign Date</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Completion Date</strong></TableCell>
                  <TableCell sx={{color:"#fff"}}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.Id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {ticket.Id}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.LOA}</TableCell>
                      <TableCell>{ticket.EmpName}</TableCell>
                      <TableCell>{ticket.Station}</TableCell>
                      <TableCell>{ticket.ContactPerson}</TableCell>
                      <TableCell>{ticket.ContactNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.Status}
                          color={getStatusColor(ticket.Status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.Date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        {(ticket.UpdateDateTime)}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleViewTicket(ticket.Id)}
                          color="primary"
                          aria-label="view ticket"
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No tickets found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} tickets
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </Box>
  );
};

export default TicketList;