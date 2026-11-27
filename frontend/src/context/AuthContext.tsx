import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi, clearTokens, decodeJwt, getTokens, setTokens } from '../api/client'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<unknown>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const { accessToken } = getTokens()
    if (accessToken) {
      const decoded = decodeJwt(accessToken)
      const exp = typeof decoded?.exp === 'number' ? decoded.exp : 0
      if (decoded && (!exp || exp * 1000 > Date.now())) {
        setUser({
          id: String(decoded.sub ?? ''),
          email: String(decoded.email ?? ''),
          isAdmin: Boolean(decoded.is_admin),
        })
      } else {
        clearTokens()
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await authApi.login({ email, password })
    setTokens(data.access_token, data.refresh_token)
    const decoded = decodeJwt(data.access_token)
    const nextUser: AuthUser = {
      id: String(decoded?.sub ?? ''),
      email: String(decoded?.email ?? email),
      isAdmin: Boolean(decoded?.is_admin),
    }
    setUser(nextUser)
    return nextUser
  }

  const register = async (name: string, email: string, password: string) => {
    return authApi.register({ name, email, password })
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore if token expired
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user?.isAdmin),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
