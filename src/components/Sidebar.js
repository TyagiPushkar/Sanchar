"use client"

import React, { useState } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  Drawer,
  List,
  ListItem,
  Box,
  ListItemIcon,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { Person, ChevronLeft, ChevronRight } from "@mui/icons-material"
import { useAuth } from "./auth/AuthContext"
import MapIcon from "@mui/icons-material/Map"
import DynamicFormIcon from "@mui/icons-material/DynamicForm"
import ContactPhoneIcon from "@mui/icons-material/ContactPhone"
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HRSmileLogo from "../assets/images (1).png"

function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const [expanded, setExpanded] = useState(!isTablet)

  // Module Mapping
  const moduleMapping = {
    // Keeping the commented mappings for reference
  }

  // Default routes visible to everyone
  const defaultRoutes = [
    { path: "/tender", name: "Tender", icon: <DynamicFormIcon /> },
    { path: "/buyer", name: "Buyers", icon: <Person /> },
    { path: "/directory", name: "Directory", icon: <ContactPhoneIcon /> },
    { path: "/participant", name: "Participants", icon: <Person /> },
    { path: "/projects", name: "Projects", icon: <AccountTreeIcon /> },
    { path: "/employees", name: "Employees", icon: <BadgeIcon /> },
    { path: "/support-ticket", name: "Support Ticket", icon: <SupportAgentIcon /> },
  ]

  const userModules = user?.modules || []
  const allowedRoutes = userModules.map((moduleId) => moduleMapping[moduleId]).filter(Boolean)

  // HR-specific routes
  if (user?.role === "HR") {
    allowedRoutes.push(
      // Keeping the commented routes for reference
    )
  }

  // If module 5 (Visit) exists, also add Maps
  if (userModules.includes(5)) {
    allowedRoutes.push({ path: "/maps", name: "Maps", icon: <MapIcon /> })
  }

  // Combine all available routes
  const routes = [...defaultRoutes, ...allowedRoutes]

  // Group routes by category (for demonstration - you can customize this)
  const mainRoutes = routes.slice(0, 2)
  const secondaryRoutes = routes.slice(2)

  const drawerWidth = expanded ? 240 : 80

  return (
    <Box
      sx={{
        height: "100%",
        position: "relative",
      }}
    >
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: "#ffffff",
              boxSizing: "border-box",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              transition: theme.transitions.create(["width"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: "hidden",
              overflowY: "auto",
              position: "fixed", // Fix the position
              height: "100%",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: expanded ? "center" : "center",
              p: 2,
              borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                transition: "opacity 0.3s ease",
                opacity: expanded ? 1 : 0.9,
              }}
            >
              <img
                src={HRSmileLogo || "/placeholder.svg"}
                alt="Logo"
                style={{
                  width: expanded ? 40 : 50,
                  height: "auto",
                  transition: "all 0.3s ease",
                }}
              />
              
            </Box>

            
          </Box>

          <Box
            sx={{
              height: "calc(100% - 140px)", // Adjust based on header and footer heights
              display: "flex",
              flexDirection: "column",
              py: 2,
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            {/* Main Navigation */}
            <List sx={{ width: "100%", px: 1.5 }}>
              {mainRoutes.map((route, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  sx={{
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  <Tooltip title={expanded ? "" : route.name} placement="right" arrow>
                    <Box
                      component={Link}
                      to={route.path}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                        px: 2,
                        py: 1.5,
                        borderRadius: "10px",
                        color: location.pathname === route.path ? "#F69320" : "#666",
                        backgroundColor: location.pathname === route.path ? "rgba(246, 147, 32, 0.08)" : "transparent",
                        "&:hover": {
                          backgroundColor:
                            location.pathname === route.path ? "rgba(246, 147, 32, 0.12)" : "rgba(0, 0, 0, 0.04)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: expanded ? 40 : "auto",
                          color: "inherit",
                          fontSize: "1.2rem",
                          display: "flex",
                          justifyContent: expanded ? "flex-start" : "center",
                        }}
                      >
                        {React.cloneElement(route.icon, {
                          style: {
                            fontSize: "1.4rem",
                            transition: "transform 0.2s ease",
                            transform: location.pathname === route.path ? "scale(1.1)" : "scale(1)",
                          },
                        })}
                      </ListItemIcon>

                      {expanded && (
                        <Typography
                          sx={{
                            ml: 1,
                            fontWeight: location.pathname === route.path ? 600 : 500,
                            fontSize: "0.95rem",
                            opacity: expanded ? 1 : 0,
                            transition: "opacity 0.3s ease",
                            whiteSpace: "nowrap",
                        
                          }}
                        >
                          {route.name}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                </ListItem>
              ))}
            </List>

            {secondaryRoutes.length > 0 && (
              <>
                <Divider
                  sx={{
                    my: 2,
                    mx: 2,
                    opacity: 0.6,
                  }}
                />

                {/* Secondary Navigation */}
                <List sx={{ width: "100%", px: 1.5 }}>
                  {secondaryRoutes.map((route, index) => (
                    <ListItem
                      key={index}
                      disablePadding
                      sx={{
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      <Tooltip title={expanded ? "" : route.name} placement="right" arrow>
                        <Box
                          component={Link}
                          to={route.path}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            px: 2,
                            py: 1.5,
                            borderRadius: "10px",
                            color: location.pathname === route.path ? "#F69320" : "#666",
                            backgroundColor:
                              location.pathname === route.path ? "rgba(246, 147, 32, 0.08)" : "transparent",
                            "&:hover": {
                              backgroundColor:
                                location.pathname === route.path ? "rgba(246, 147, 32, 0.12)" : "rgba(0, 0, 0, 0.04)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: expanded ? 40 : "auto",
                              color: "inherit",
                              fontSize: "1.2rem",
                              display: "flex",
                              justifyContent: expanded ? "flex-start" : "center",
                            }}
                          >
                            {React.cloneElement(route.icon, {
                              style: {
                                fontSize: "1.4rem",
                                transition: "transform 0.2s ease",
                                transform: location.pathname === route.path ? "scale(1.1)" : "scale(1)",
                              },
                            })}
                          </ListItemIcon>

                          {expanded && (
                            <Typography
                              sx={{
                                ml: 1,
                                fontWeight: location.pathname === route.path ? 600 : 500,
                                fontSize: "0.95rem",
                                opacity: expanded ? 1 : 0,
                                transition: "opacity 0.3s ease",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {route.name}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Spacer to push user info to bottom */}
            <Box sx={{ flexGrow: 1 }} />

            {/* User Info Section */}
            {user && expanded && (
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: expanded ? "flex-start" : "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: "rgba(246, 147, 32, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F69320",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </Box>

                {expanded && (
                  <Box sx={{ ml: 1.5, overflow: "hidden" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: "#333",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 150,
                      }}
                    >
                      {user.username || "User"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#666",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 150,
                        display: "block",
                      }}
                    >
                      {user.role || "User Role"}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Drawer>
      </Box>
    </Box>
  )
}

export default Sidebar
