"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth/AuthContext"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tooltip,
  InputBase,
  alpha,
  Divider,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material"
import {
  Notifications,
  Menu as MenuIcon,
  Search as SearchIcon,
  Settings,
  Help,
  ChevronRight,
  Dashboard,
} from "@mui/icons-material"
import HRSmileLogo from "../assets/images (1).png"

function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationEl, setNotificationEl] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

  // Mock notifications for demo
  const notifications = [
    // { id: 1, text: "New tender application submitted", read: false, time: "10 min ago" },
    // { id: 2, text: "Your profile was updated", read: true, time: "1 hour ago" },
    // { id: 3, text: "New directory entry added", read: false, time: "3 hours ago" },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good Morning")
    } else if (hour < 18) {
      setGreeting("Good Afternoon")
    } else {
      setGreeting("Good Evening")
    }
  }, [])

  const handleMenu = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleProfile = () => {
    setAnchorEl(null)
    navigate("/profile")
  }
  const handleLogout = () => {
    logout()
    navigate("/")
  }
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const handleNotificationOpen = (event) => setNotificationEl(event.currentTarget)
  const handleNotificationClose = () => setNotificationEl(null)
  const handleNotificationClick = (id) => {
    // Handle notification click - mark as read, navigate, etc.
    handleNotificationClose()
    navigate("/notification")
  }

  const drawer = (
    <Box sx={{ width: 280, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src={HRSmileLogo || "/placeholder.svg"}
            alt="Logo"
            style={{ width: 40, height: "auto", marginRight: 12 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
            Dashboard
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: "#666" }}>
          <ChevronRight />
        </IconButton>
      </Box>

      <List sx={{ flexGrow: 1, px: 1 }}>
        <ListItem
          button
          component={Link}
          to="/dashboard"
          selected={location.pathname === "/dashboard"}
          sx={{
            borderRadius: "10px",
            mb: 1,
            color: location.pathname === "/dashboard" ? "#F69320" : "#666",
            backgroundColor: location.pathname === "/dashboard" ? "rgba(246, 147, 32, 0.08)" : "transparent",
            "&:hover": {
              backgroundColor: location.pathname === "/dashboard" ? "rgba(246, 147, 32, 0.12)" : "rgba(0, 0, 0, 0.04)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Dashboard
            sx={{
              mr: 2,
              color: "inherit",
              fontSize: "1.2rem",
            }}
          />
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              fontWeight: location.pathname === "/dashboard" ? 600 : 500,
            }}
          />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/notification"
          selected={location.pathname === "/notification"}
          sx={{
            borderRadius: "10px",
            mb: 1,
            color: location.pathname === "/notification" ? "#F69320" : "#666",
            backgroundColor: location.pathname === "/notification" ? "rgba(246, 147, 32, 0.08)" : "transparent",
            "&:hover": {
              backgroundColor:
                location.pathname === "/notification" ? "rgba(246, 147, 32, 0.12)" : "rgba(0, 0, 0, 0.04)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Notifications
            sx={{
              mr: 2,
              color: "inherit",
              fontSize: "1.2rem",
            }}
          />
          <ListItemText
            primary="Notifications"
            primaryTypographyProps={{
              fontWeight: location.pathname === "/notification" ? 600 : 500,
            }}
          />
          {unreadCount > 0 && (
            <Box
              sx={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#F69320",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: "bold",
                ml: 1,
              }}
            >
              {unreadCount}
            </Box>
          )}
        </ListItem>
      </List>

      {user && (
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Avatar
            src={user.image}
            sx={{
              width: 40,
              height: 40,
              bgcolor: user.image ? "transparent" : "rgba(246, 147, 32, 0.2)",
              color: "#F69320",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {!user.image && (user.username ? user.username.charAt(0).toUpperCase() : "U")}
          </Avatar>
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#333" }}>
              {user.username || "User"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              {user.role || "User Role"}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "#ffffff",
        //   borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          backdropFilter: "blur(20px)",
          transition: "all 0.3s ease",
          width: "100%",
          marginLeft: "auto",
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "flex-end", px: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: "auto" }}>
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                sx={{
                  mr: 1,
                  color: "#666",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: 500,
                fontSize: { xs: "0.9rem", sm: "1.1rem" },
                display: "flex",
                alignItems: "center",
                ml:30
              }}
            >
              <span style={{ fontWeight: 600 }}>{greeting}</span>
              <span style={{ marginLeft: 4 }}>{user ? user.username : "Guest"}!</span>
            </Typography>
          </Box>

          {!isMobile && (
            <Paper
              component="form"
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                width: { sm: 180, md: 220 },
                borderRadius: "20px",
                px: 2,
                py: 0.5,
                ml: 2,
                mr: 2,
                border: "1px solid",
                borderColor: searchFocused ? "#F69320" : "rgba(0, 0, 0, 0.08)",
                backgroundColor: searchFocused ? alpha("#F69320", 0.04) : "rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: alpha("#F69320", 0.02),
                },
              }}
            >
              <SearchIcon sx={{ color: searchFocused ? "#F69320" : "#999", mr: 1 }} />
              <InputBase
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                sx={{
                  flex: 1,
                  fontSize: "0.9rem",
                  "& .MuiInputBase-input": {
                    padding: "6px 0",
                  },
                }}
              />
            </Paper>
          )}

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {!isTablet && (
              <Tooltip title="Help">
                <IconButton
                  sx={{
                    color: "#666",
                    mx: 0.5,
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <Help />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Notifications">
              <IconButton
                onClick={handleNotificationOpen}
                sx={{
                  color: "#666",
                  mx: 0.5,
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Account">
              <IconButton
                onClick={handleMenu}
                sx={{
                  ml: 0.5,
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                <Avatar
                  src={user?.image}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: user?.image ? "transparent" : "rgba(246, 147, 32, 0.2)",
                    color: "#F69320",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  {!user?.image && (user?.username ? user.username.charAt(0).toUpperCase() : "U")}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: "10px",
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.08))",
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#333" }}>
            {user?.username || "User"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#666" }}>
            {user?.email || "user@example.com"}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={handleProfile}
          sx={{
            py: 1.5,
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <Settings fontSize="small" sx={{ mr: 1.5, color: "#666" }} />
          <Typography variant="body2">Profile Settings</Typography>
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: "#d32f2f",
            "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.04)" },
          }}
        >
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationEl}
        open={Boolean(notificationEl)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 380,
            borderRadius: "10px",
            overflow: "auto",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.08))",
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#F69320",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => {
              handleNotificationClose()
              navigate("/notification")
            }}
          >
            View All
          </Typography>
        </Box>
        <Divider />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: notification.read ? "none" : "3px solid #F69320",
                backgroundColor: notification.read ? "transparent" : "rgba(246, 147, 32, 0.04)",
                "&:hover": {
                  backgroundColor: notification.read ? "rgba(0, 0, 0, 0.04)" : "rgba(246, 147, 32, 0.08)",
                },
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 500 }}>
                  {notification.text}
                </Typography>
                <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              No notifications
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default Navbar
