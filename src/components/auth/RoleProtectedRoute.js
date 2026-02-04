import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Unauthorized from "../../pages/Unauthorized";
import { CircularProgress, Box } from "@mui/material";

function RoleProtectedRoute({ element: Element, allowedRoles, ...rest }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  const userRole = user.Role || user.role || "";

  if (!allowedRoles.includes(userRole)) {
    return <Unauthorized />;
  }

  return <Element {...rest} />;
}

export default RoleProtectedRoute;
