import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "../styles.css";
import CreateJobEmpty from "./components/CreateJobEmpty";
import EditJobForm from "./components/EditJobForm";
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';



function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />

        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            token ? (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Route per creazione nuova commessa */}
        <Route
          path="/jobs/create"
          element={
            token ? (
              <ProtectedRoute>
                <CreateJobEmpty />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Route per modifica commessa con id */}
        <Route
          path="/jobs/edit/:id"
          element={
            token ? (
              <ProtectedRoute>
                <EditJobForm />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
