import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi, clearTokens, decodeJwt, getTokens, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { accessToken } = getTokens()
    if (accessToken) {
      const decoded = decodeJwt(accessToken)
      if (decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
        setUser({
          id: decoded.sub,
          email: decoded.email,
          isAdmin: Boolean(decoded.is_admin),
        })
      } else {
        clearTokens()
      }
    }
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    setTokens(data.access_token, data.refresh_token)
    const decoded = decodeJwt(data.access_token)
    const nextUser = {
      id: decoded?.sub,
      email: decoded?.email || email,
      isAdmin: Boolean(decoded?.is_admin),
    }
    setUser(nextUser)
    return nextUser
  }

  const register = async (name, email, password) => {
    return authApi.register({ name, email, password })
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore if token already expired
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isAdmin: Boolean(user?.isAdmin), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
