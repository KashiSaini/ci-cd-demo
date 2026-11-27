import React, { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import FlightsPage from './pages/FlightsPage'
import BookingsPage from './pages/BookingsPage'
import PrivateJetsPage from './pages/PrivateJetsPage'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [activePage, setActivePage] = useState('flights')
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  return (
    <>
      <Navbar activePage={activePage} setActivePage={setActivePage} onNotify={notify} />
      <main className="container">
        {activePage === 'auth' && (
          <AuthPage onSuccess={() => setActivePage('flights')} onNotify={notify} />
        )}
        {activePage === 'flights' && (
          <FlightsPage
            onNotify={notify}
            onRequireAuth={() => setActivePage('auth')}
            onGoBookings={() => setActivePage('bookings')}
          />
        )}
        {activePage === 'jets' && (
          <PrivateJetsPage onNotify={notify} onRequireAuth={() => setActivePage('auth')} />
        )}
        {activePage === 'bookings' && isAuthenticated && <BookingsPage onNotify={notify} />}
        {activePage === 'admin' && isAdmin && <AdminPage onNotify={notify} />}
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
