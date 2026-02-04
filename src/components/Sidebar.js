"use client";

import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  Box,
  ListItemIcon,
  Typography,
  Tooltip,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Person,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

import { useAuth } from "./auth/AuthContext";

import MapIcon from "@mui/icons-material/Map";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import HRSmileLogo from "../assets/images (1).png";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsIcon from "@mui/icons-material/Settings";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(!isTablet);

  // Get user role from your user object structure
  const userRole = user?.Role || user?.role || "";

  // Define role-based access
  const ROLE_PERMISSIONS = {
    Admin: [
      "admin",
      "pm",
      "technician",
      "customer_support",
      "report",
      "tender",
      "directory",
      "projects",
      "support_ticket",
      "material",
      "invoices",
      "amc",
    ],
    "Project Manager": [
      "admin",
      "pm",
      "technician",
      "customer_support",
      "report",
      "tender",
      "directory",
      "projects",
      "support_ticket",
      "material",
      "invoices",
      "amc",
    ],
    Technician: ["technician", "projects", "amc"],
    "Customer Support": ["customer_support", "support_ticket", "projects"],
  };

  // Check if user has permission for a specific feature
  const hasPermission = (feature) => {
    if (!userRole) return false;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(feature);
  };

  // Directory sub routes
  const directoryRoutes = [
    {
      path: "/consignee",
      name: "Consignee",
      icon: <Person />,
      feature: "directory",
    },
    {
      path: "/directory",
      name: "Directory",
      icon: <ContactPhoneIcon />,
      feature: "directory",
    },
    {
      path: "/participant",
      name: "Participants",
      icon: <Person />,
      feature: "directory",
    },
    {
      path: "/employees",
      name: "Employees",
      icon: <BadgeIcon />,
      feature: "admin",
    },
  ];

  // Check if current location is a directory route
  const isDirectoryRoute = directoryRoutes.some(
    (route) =>
      (location.pathname === route.path ||
        location.pathname.startsWith(route.path + "/")) &&
      hasPermission(route.feature),
  );

  // Initialize directoryOpen based on current location
  const [directoryOpen, setDirectoryOpen] = useState(isDirectoryRoute);

  // Update directoryOpen when route changes
  useEffect(() => {
    setDirectoryOpen(isDirectoryRoute);
  }, [location.pathname]);

  const drawerWidth = expanded ? 240 : 80;

  // Filtered routes based on role
  const filteredRoutes = [
    {
      path: "/report",
      name: "Report",
      icon: <AssessmentIcon />,
      feature: "report",
    },
    {
      path: "/tender",
      name: "Tender",
      icon: <DynamicFormIcon />,
      feature: "tender",
    },
    {
      path: "/projects",
      name: "LOA Awarded",
      icon: <AccountTreeIcon />,
      feature: "projects",
    },
    {
      path: "/support-ticket",
      name: "Support Ticket",
      icon: <SupportAgentIcon />,
      feature: "support_ticket",
    },
    {
      path: "/material-supplied",
      name: "Material Supplied",
      icon: <InventoryIcon />,
      feature: "material",
    },
    {
      path: "/invoices",
      name: "Invoices",
      icon: <ReceiptIcon />,
      feature: "invoices",
    },
    {
      path: "/amc-work",
      name: "AMC Work",
      icon: <EngineeringIcon />,
      feature: "amc",
    },
    { path: "/menus", name: "Menus", icon: <SettingsIcon />, feature: "menus" },
    {
      path: "/checkpoints",
      name: "Checkpoints",
      icon: <SettingsIcon />,
      feature: "checkpoints",
    },
    {
      path: "/profile",
      name: "Profile",
      icon: <ManageAccountsIcon />,
      feature: "admin",
    },
  ].filter((route) => hasPermission(route.feature));

  // Check if directory has any accessible routes
  const hasDirectoryAccess = directoryRoutes.some((route) =>
    hasPermission(route.feature),
  );

  // If no user or loading, don't show sidebar
  if (!user) {
    return null;
  }

  return (
    <Box sx={{ height: "100%", position: "relative" }}>
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: "#ffffff",
              borderRight: "1px solid rgba(0,0,0,0.1)",
              transition: theme.transitions.create(["width"]),
              overflowX: "hidden",
            },
          }}
        >
          {/* LOGO */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 2,
              borderBottom: "1px solid #eee",
              position: "relative",
            }}
          >
            <img
              src={HRSmileLogo}
              alt="Logo"
              style={{
                width: expanded ? 40 : 50,
                transition: "all 0.3s",
              }}
            />
            {expanded && userRole && (
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: 4,
                  right: 8,
                  color: "#666",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                }}
              >
                {userRole}
              </Typography>
            )}
          </Box>

          {/* MAIN MENU */}
          <List sx={{ width: "100%", px: 1.5 }}>
            {filteredRoutes.map((route, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={expanded ? "" : route.name} placement="right">
                  <Box
                    component={Link}
                    to={route.path}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      py: 1.3,
                      borderRadius: "10px",
                      textDecoration: "none",
                      color:
                        location.pathname === route.path ? "#F69320" : "#555",
                      background:
                        location.pathname === route.path
                          ? "rgba(246,147,32,0.08)"
                          : "transparent",
                      "&:hover": { background: "rgba(0,0,0,0.05)" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: expanded ? 40 : "auto" }}>
                      {route.icon}
                    </ListItemIcon>

                    {expanded && (
                      <Typography sx={{ ml: 1, fontWeight: 500 }}>
                        {route.name}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              </ListItem>
            ))}
          </List>

          {/* 🔥 GROUPED DIRECTORY TAB - Only show if user has access to any directory item */}
          {hasDirectoryAccess && (
            <List sx={{ px: 1.5 }}>
              <ListItem disablePadding>
                <Box
                  onClick={() => setDirectoryOpen(!directoryOpen)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.3,
                    borderRadius: "10px",
                    cursor: "pointer",
                    width: "100%",
                    color: isDirectoryRoute ? "#F69320" : "#555",
                    background: isDirectoryRoute
                      ? "rgba(246,147,32,0.08)"
                      : "transparent",
                    "&:hover": { background: "rgba(0,0,0,0.05)" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: expanded ? 40 : "auto" }}>
                    <ContactPhoneIcon />
                  </ListItemIcon>

                  {expanded && (
                    <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                      Directory
                    </Typography>
                  )}

                  {expanded &&
                    (directoryOpen ? <ExpandLess /> : <ExpandMore />)}
                </Box>
              </ListItem>

              {/* Submenu items - Filtered based on role */}
              <Collapse in={directoryOpen} timeout="auto" unmountOnExit>
                <List
                  component="div"
                  disablePadding
                  sx={{ pl: expanded ? 4 : 0 }}
                >
                  {directoryRoutes
                    .filter((item) => hasPermission(item.feature))
                    .map((item, i) => {
                      const isActive =
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/");

                      return (
                        <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                          <Box
                            component={Link}
                            to={item.path}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              px: 2,
                              py: 1.2,
                              borderRadius: "10px",
                              textDecoration: "none",
                              color: isActive ? "#F69320" : "#777",
                              background: isActive
                                ? "rgba(246,147,32,0.08)"
                                : "transparent",
                              "&:hover": { background: "rgba(0,0,0,0.05)" },
                            }}
                          >
                            <ListItemIcon
                              sx={{ minWidth: expanded ? 35 : "auto" }}
                            >
                              {item.icon}
                            </ListItemIcon>

                            {expanded && (
                              <Typography sx={{ ml: 1 }}>
                                {item.name}
                              </Typography>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                </List>
              </Collapse>
            </List>
          )}

          {/* Admin Panel - Only for Admin role */}
          {userRole === "Admin" && (
            <List sx={{ px: 1.5, mt: 2, borderTop: "1px solid #eee", pt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  mb: 1,
                  color: "#999",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                ADMIN PANEL
              </Typography>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <Box
                  component={Link}
                  to="/admin"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.3,
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: location.pathname === "/admin" ? "#F69320" : "#555",
                    background:
                      location.pathname === "/admin"
                        ? "rgba(246,147,32,0.08)"
                        : "transparent",
                    "&:hover": { background: "rgba(0,0,0,0.05)" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: expanded ? 40 : "auto" }}>
                    <AdminPanelSettingsIcon />
                  </ListItemIcon>
                  {expanded && (
                    <Typography sx={{ ml: 1, fontWeight: 500 }}>
                      Admin Dashboard
                    </Typography>
                  )}
                </Box>
              </ListItem>
            </List>
          )}
        </Drawer>
      </Box>
    </Box>
  );
}

export default Sidebar;
