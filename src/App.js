import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './components/auth/AuthContext';
import Login from './pages/Login';
import theme from './styles/theme';
import Employee from './pages/Employee';
import Holiday from './pages/Holiday';
import Policy from './pages/Policy';
import Attendance from './pages/Attendance';
import Notification from './pages/Notification';
import Leave from './pages/Leave';
import PrivateRoute from './components/auth/PrivateRoute';
import EmployeeProfile from './pages/EmployeeProfile';
import Menus from './pages/Menus';
import Checkpoints from './pages/Checkpoints';
import Tender from './pages/Tender';
import Buyer from './pages/Buyer';
import ViewTender from './pages/ViewTender';
import Participant from './pages/Participant';
import User from './pages/User';
import ViewLOA from './pages/ViewLOA';
import Projects from './pages/Projects';
import Ticket from './pages/Ticket';
import Material from './pages/Material';
import Invoices from './pages/Invoices';
import AMCWork from './pages/AMCWork';
import Report from './pages/Report';
import SummaryReport from './pages/Summary';
function App() {
   useEffect(() => {
        const handleRightClick = (event) => {
            event.preventDefault();
        };

        document.addEventListener('contextmenu', handleRightClick);

        return () => {
            document.removeEventListener('contextmenu', handleRightClick);
        };
     
   }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/employees" element={<PrivateRoute element={Employee} />} />
            <Route path="/employees/:empId" element={<PrivateRoute element={EmployeeProfile} requiredRole="HR" />} />
            <Route path="/holiday" element={<PrivateRoute element={Holiday} />} />
            <Route path="/policy" element={<PrivateRoute element={Policy} />} />
            <Route path="/attendance" element={<PrivateRoute element={Attendance} />} />
            <Route path="/notification" element={<PrivateRoute element={Notification} />} />
            <Route path="/leave" element={<PrivateRoute element={Leave} />} />
            <Route path="/profile" element={<PrivateRoute element={User} />} />

            <Route path="/summary" element={<PrivateRoute element={SummaryReport} />} />
            <Route path="/report" element={<PrivateRoute element={Report} />} />


            <Route path="/tender" element={<PrivateRoute element={Tender} />} />
            <Route path="/draft" element={<PrivateRoute element={Tender} />} />
            <Route path="/create-tender" element={<PrivateRoute element={Tender} />} />
            <Route path="/edit-draft/:ActivityId" element={<PrivateRoute element={Tender} />} />
            <Route path="/tender/view/:activityId" element={<PrivateRoute element={ViewTender} />} />
            <Route path="/loa/view/:activityId" element={<PrivateRoute element={ViewLOA} />} />


            <Route path="/consignee" element={<PrivateRoute element={Buyer} />} />
            <Route path="/new-consignee" element={<PrivateRoute element={Buyer} />} />
            <Route path="/contact" element={<PrivateRoute element={Buyer} />} />
            <Route path="/directory" element={<PrivateRoute element={Buyer} />} />
            
            <Route path="/participant" element={<PrivateRoute element={Participant} />} />
            <Route path="/new-participant" element={<PrivateRoute element={Participant} />} />
            
            
            <Route path="/projects" element={<PrivateRoute element={Projects} />} />
            <Route path="/assign/task/:ActivityId" element={<PrivateRoute element={Projects} />} />
            <Route path="/project/view/:TenderNo" element={<PrivateRoute element={Projects} />} />
            <Route path="/task/view/:TaskId" element={<PrivateRoute element={Projects} />} />


            <Route path="/support-ticket" element={<PrivateRoute element={Ticket} />} />
            <Route path="/tickets/:ticketId" element={<PrivateRoute element={Ticket} />} />


            <Route path="/material-supplied" element={<PrivateRoute element={Material} />} />
            <Route path="/add-material" element={<PrivateRoute element={Material} />} />
            <Route path="/edit-material" element={<PrivateRoute element={Material} />} />

            <Route path="/invoices" element={<PrivateRoute element={Invoices} />} />
            <Route path="/add-invoice" element={<PrivateRoute element={Invoices} />} />
            <Route path="/edit-invoice" element={<PrivateRoute element={Invoices} />} />

            <Route path="/amc-work" element={<PrivateRoute element={AMCWork} />} />
            <Route path="/add-amc-work" element={<PrivateRoute element={AMCWork} />} />
            <Route path="/details" element={<PrivateRoute element={AMCWork} />} />
            <Route path="/edit-amc-work" element={<PrivateRoute element={AMCWork} />} />

            <Route path="/menus" element={<PrivateRoute element={Menus} />} />
            <Route path="/add-menu" element={<PrivateRoute element={Menus} />} />

            <Route path="/checkpoints" element={<PrivateRoute element={Checkpoints} />} />
            <Route path="/add-checkpoint" element={<PrivateRoute element={Checkpoints} />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
