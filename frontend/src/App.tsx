import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import FlightsPage from './pages/FlightsPage'
import FlightDetailsPage from './pages/FlightDetailsPage'
import BookingFlowPage from './pages/BookingFlowPage'
import DashboardPage from './pages/DashboardPage'
import PrivateJetsPage from './pages/PrivateJetsPage'
import AdminPage from './pages/AdminPage'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return isAdmin ? <>{children}</> : <Navigate to="/flights" replace />
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/flights/:flightId" element={<FlightDetailsPage />} />
              <Route
                path="/book/:flightId"
                element={
                  <ProtectedRoute>
                    <BookingFlowPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/private-jets" element={<PrivateJetsPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </MotionConfig>
  )
}
