"use client"

import React from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import { Box, useMediaQuery, useTheme, Container } from "@mui/material"
import TenderList from "../components/tender/TenderList"
import AdmissionFormLogic from "../components/form/AdmissionFormLogic"
import DraftList from "../components/tender/DraftList"
import EditDraft from "../components/form/EditDraft"

function Tender() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  
  // Get the current path for conditional rendering
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  
  // Determine which component to render based on the URL
  const renderContent = () => {
    if (currentPath.includes("/tender") && !currentPath.includes("/create-tender")) {
      return <DraftList />
    } else if (currentPath.includes("/draft")) {
      return <DraftList />
    } else if (currentPath.includes("/create-tender")) {
      return <AdmissionFormLogic />
    } else if (currentPath.includes("/edit-draft")) {
      return <EditDraft />
    }
    return <TenderList /> // Default fallback
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

export default Tender
