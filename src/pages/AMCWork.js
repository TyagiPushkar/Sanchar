"use client"

import React from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import { Box, useMediaQuery, useTheme, Container } from "@mui/material"
import InvoicesList from "../components/invoices/InvoicesList"
import AddInvoices from "../components/invoices/AddInvoices"
import AMCWorkList from "../components/amc/AMCWorkList"
import AddAMC from "../components/amc/AddAMC"
import AMCWorkDetails from "../components/amc/AMCWorkDetails"
import EditAMCWork from "../components/amc/EditAMCWork"


function AMCWork() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  
  // Get the current path for conditional rendering
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  
  // Determine which component to render based on the URL
  const renderContent = () => {
      if (currentPath.includes("/amc-work")) {
          return <AMCWorkList />
      } else if (currentPath.includes("/add-amc-work")) {
          return <AddAMC />
      }
      else if (currentPath.includes("/details")) {
        return <AMCWorkDetails />
    }
    else if (currentPath.includes("/edit-amc-work")) {
      return <EditAMCWork />
  }
    return <AMCWorkList /> // Default fallback
  }

  // Calculate sidebar width based on state and screen size
  const sidebarWidth = isMobile ? 0 : isTablet ? 80 : 240

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Navbar - Full width at the top */}
      <Navbar />
      
      {/* Main content area with sidebar and content */}
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Sidebar - fixed width, full height below navbar */}
        {!isMobile && (
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              height: "100%",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <Sidebar />
          </Box>
        )}
        
        {/* Main content - flexible width, scrollable */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100%",
            overflow: "auto",
            bgcolor: "#f5f7fa",
            transition: theme.transitions.create("margin", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Container 
            maxWidth={false}
            sx={{ 
              py: 3,
              px: { xs: 1, sm: 2, md: 3 },
              height: "100%",
            }}
          >
            {renderContent()}
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default AMCWork
