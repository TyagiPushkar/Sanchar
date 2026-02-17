"use client";

import React, { useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Container,
  Grid,
  IconButton,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../components/auth/AuthContext";
import logo from "../assets/images (1).png";
import banner from "../assets/about-image.png";
import playstore from "../assets/playstore.png";
import appstore from "../assets/appstore.png";

const API_URL = "https://namami-infotech.com/SANCHAR/src/auth";

export default function LoginPage() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Check if the screen is mobile

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/login.php`, {
        EmpId: empId,
        password: password,
      });

      if (response.data.success) {
        const userData = response.data.data;

        // 🚫 Block Technician role
        if (userData.role === "Technician") {
          // Clear any existing auth data
          localStorage.clear();
          sessionStorage.clear();

          setError("Technician users are not allowed to login.");
          setLoading(false);
          return;
        }
        login(response.data.data);
        setTimeout(() => {
          navigate("/report");
        }, 1000);
        setLoading(false);
      } else {
        setLoading(false);
        setError(response.data.message);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    try {
      const response = await axios.post(`${API_URL}/forget_password.php`, {
        email: forgotEmail,
      });

      if (response.data.success) {
        setForgotPasswordSuccess("An email with a new password has been sent.");
        setOpenDialog(false);
      } else {
        setForgotPasswordError(response.data.message || "Error sending email");
      }
    } catch (error) {
      setForgotPasswordError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <Container
  maxWidth={false}
  disableGutters
  sx={{
    width: '100vw',
    height: '100vh',
    backgroundImage: `url(${banner})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  }}
>
  {/* Centered Login Box with semi-transparent background */}
  <Paper
    elevation={10}
    sx={{
      width: { xs: '90%', sm: '400px' },
      padding: 4,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      mt: 20,
      mr:40
    }}
  >
   {/* <img
  src={logo}
  alt="Logo"
  style={{
    position: 'absolute',
    top: 80,
    left: 180,
    
    zIndex: 1000,
  }}
/> */}
 <img
      src={logo}
      alt="Logo"
      
      
    />
    <Typography variant="h5" sx={{ color: 'black', mb: 2,fontWeight: 'bold' }}>
      WELCOME TO SANCHAR
    </Typography>
    {error && <Typography color="error">{error}</Typography>}
    <form onSubmit={handleLogin} style={{ width: '100%' }}>
      <TextField
        fullWidth
        label="Username"
        variant="outlined"
        margin="normal"
        value={empId}
        onChange={(e) => setEmpId(e.target.value)}
      />
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <IconButton onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          ),
        }}
      />
      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={loading}
        sx={{ mt: 2, backgroundColor: '#F69320', color: 'white' }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
    <Button onClick={() => setOpenDialog(true)} sx={{ mt: 1 }}>
      Forgot Password?
    </Button>
    {/* <Box display="flex" justifyContent="center" mt={3}>
      <Link to="https://play.google.com/store/apps/details?id=com.nanami.hrsmile" target="_blank">
        <img src={playstore} alt="Google Play Store" width={140} style={{ marginRight: 10 }} />
      </Link>
      
    </Box> */}
  </Paper>

  {/* Forgot Password Dialog */}
  <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
    <DialogTitle>Forgot Password</DialogTitle>
    <DialogContent>
      <Typography>
        Enter your email address and we'll send you a new password.
      </Typography>
      {forgotPasswordError && <Typography color="error">{forgotPasswordError}</Typography>}
      {forgotPasswordSuccess && <Typography color="success">{forgotPasswordSuccess}</Typography>}
      <TextField
        fullWidth
        label="Email"
        variant="outlined"
        margin="normal"
        value={forgotEmail}
        onChange={(e) => setForgotEmail(e.target.value)}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setOpenDialog(false)} color="secondary">
        Cancel
      </Button>
      <Button onClick={handleForgotPassword} color="primary" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </DialogActions>
  </Dialog>
</Container>

  );
}
