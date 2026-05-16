import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login/index.jsx";
import Dashboard from "./pages/Dashboard";
import MotionStudio from "./pages/MotionStudio";
import APIVault from "./pages/APIVault";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";
import SupportDonation from "./pages/SupportDonation";
import UserManagement from "./pages/UserManagement";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="motion-studio" element={<MotionStudio />} />
          <Route path="api-vault" element={<APIVault />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="support-donasi" element={<SupportDonation />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
