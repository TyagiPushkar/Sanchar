import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import WarningIcon from "@mui/icons-material/Warning";

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          p: 3,
        }}
      >
        <WarningIcon sx={{ fontSize: 80, color: "warning.main", mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </Typography>
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Unauthorized;
