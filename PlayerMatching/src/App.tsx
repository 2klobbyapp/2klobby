"use client"

import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import AddPlayerPage from "./pages/AddPlayerPage"
import SearchPage from "./pages/SearchPage"
import PlayerProfilePage from "./pages/PlayerProfilePage"
import MessagingPage from "./pages/MessagingPage"
import SettingsPage from "./pages/SettingsPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import { useAuth } from "./context/AuthContext" // Import useAuth
import type { JSX } from "react" // Declare JSX variable
import GettingStartedPage from "./pages/GettingStartedPage"

// PrivateRoute component
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    // You can render a loading spinner or a blank page here
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return isAuthenticated ? children : <Navigate to="/auth" />
}

// AdminRoute component
const AdminRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return user?.isAdmin ? children : <Navigate to="/" />
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />
          } />
          <Route path="/search" element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } />
          <Route path="/player/:id" element={
            <PrivateRoute>
              <PlayerProfilePage />
            </PrivateRoute>
          } />
          <Route path="/tutorial" element={
            <PrivateRoute>
              <GettingStartedPage />
            </PrivateRoute>
          } />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-player"
            element={
              <PrivateRoute>
                <AddPlayerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-player/:id"
            element={
              <PrivateRoute>
                <AddPlayerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MessagingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <PrivateRoute>
                <MessagingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              // <AdminRoute>
              <AdminDashboardPage />
              // </AdminRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
