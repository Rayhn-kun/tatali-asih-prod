import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { useStore } from '@/store/useStore'
import Catalog from '@/pages/Catalog'
import Cart from '@/pages/Cart'
import Orders from '@/pages/Orders'
import Admin from '@/pages/Admin'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user } = useStore()

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && (!isAuthenticated || user?.role !== 'ADMIN')) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}



function App() {
  const { isAuthenticated, token } = useStore()

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken && !token) {
      // Token exists but not in store, this means page was refreshed
      // The store will automatically load from localStorage via persist middleware
    }
  }, [token])

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route 
            path="login" 
            element={
              isAuthenticated ? <Navigate to="/catalog" replace /> : <Login />
            } 
          />
          <Route 
            path="register" 
            element={
              isAuthenticated ? <Navigate to="/catalog" replace /> : <Register />
            } 
          />
          
          {/* Protected routes - require authentication */}
          <Route 
            path="catalog" 
            element={
              <ProtectedRoute requireAuth>
                <Catalog />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="cart" 
            element={
              <ProtectedRoute requireAuth>
                <Cart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="orders" 
            element={
              <ProtectedRoute requireAuth>
                <Orders />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes - require admin role */}
          <Route 
            path="admin/*" 
            element={
              <ProtectedRoute requireAuth requireAdmin>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App