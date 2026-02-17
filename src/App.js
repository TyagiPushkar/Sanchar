import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { AuthProvider } from "./components/auth/AuthContext";
import Login from "./pages/Login";
import theme from "./styles/theme";
import Employee from "./pages/Employee";
import Holiday from "./pages/Holiday";
import Policy from "./pages/Policy";
import Attendance from "./pages/Attendance";
import Notification from "./pages/Notification";
import Leave from "./pages/Leave";
import PrivateRoute from "./components/auth/PrivateRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import EmployeeProfile from "./pages/EmployeeProfile";
import Menus from "./pages/Menus";
import Checkpoints from "./pages/Checkpoints";
import Tender from "./pages/Tender";
import Buyer from "./pages/Buyer";
import ViewTender from "./pages/ViewTender";
import Participant from "./pages/Participant";
import User from "./pages/User";
import ViewLOA from "./pages/ViewLOA";
import Projects from "./pages/Projects";
import Ticket from "./pages/Ticket";
import Material from "./pages/Material";
import Invoices from "./pages/Invoices";
import AMCWork from "./pages/AMCWork";
import Report from "./pages/Report";
import SummaryReport from "./pages/Summary";
import Unauthorized from "./pages/Unauthorized";
import PMWork from "./pages/PMWork";

function App() {
  useEffect(() => {
    const handleRightClick = (event) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}

            {/* Admin Only Routes */}
            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Employee}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/:empId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={EmployeeProfile}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/holiday"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Holiday}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/policy"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Policy}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/menus"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Menus}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkpoints"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Checkpoints}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/report"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Report}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={SummaryReport}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />

            {/* Admin & Project Manager Routes */}
            <Route
              path="/tender"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Tender}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/draft"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Tender}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-tender"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Tender}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-draft/:ActivityId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Tender}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/tender/view/:activityId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={ViewTender}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/loa/view/:activityId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={ViewLOA}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            {/* Consignee/Directory - Admin & Project Manager */}
            <Route
              path="/consignee"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Buyer}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-consignee"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Buyer}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/directory"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Buyer}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Buyer}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            {/* Participants - Admin Only */}
            <Route
              path="/participant"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Participant}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-participant"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Participant}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            {/* Projects - Admin, Project Manager, Technician */}
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Projects}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/assign/task/:ActivityId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Projects}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/view/:TenderNo"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Projects}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Technician",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/task/view/:TaskId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Projects}
                    allowedRoles={["Admin", "Project Manager", "Technician"]}
                  />
                </PrivateRoute>
              }
            />

            {/* Support Tickets - Admin & Customer Support */}
            <Route
              path="/support-ticket"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Ticket}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/tickets/:ticketId"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Ticket}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/pm-work"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={PMWork}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            {/* Material & Invoices - Admin & Project Manager */}
            <Route
              path="/material-supplied"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Material}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-material"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Material}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-material"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Material}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Invoices}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-invoice"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Invoices}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-invoice"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Invoices}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            {/* AMC Work - Admin, Project Manager, Technician */}
            <Route
              path="/amc-work"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={AMCWork}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                      "Technician",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-amc-work"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={AMCWork}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/details"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={AMCWork}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                      "Technician",
                    ]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-amc-work"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={AMCWork}
                    allowedRoles={[
                      "Admin",
                      "Project Manager",
                      "Customer Support",
                    ]}
                  />
                </PrivateRoute>
              }
            />

            {/* Common Routes for All Authenticated Users */}
            <Route
              path="/attendance"
              element={
                <PrivateRoute>
                  <Attendance />
                </PrivateRoute>
              }
            />
            <Route
              path="/notification"
              element={
                <PrivateRoute>
                  <Notification />
                </PrivateRoute>
              }
            />
            <Route
              path="/leave"
              element={
                <PrivateRoute>
                  <Leave />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <User />
                </PrivateRoute>
              }
            />

            {/* Add Menu/Checkpoint Routes - Admin Only */}
            <Route
              path="/add-menu"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Menus}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-checkpoint"
              element={
                <PrivateRoute>
                  <RoleProtectedRoute
                    element={Checkpoints}
                    allowedRoles={["Admin"]}
                  />
                </PrivateRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
