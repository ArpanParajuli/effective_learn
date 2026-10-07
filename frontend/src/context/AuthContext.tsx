import * as React from 'react'

export interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password?: string) => Promise<void>
  register: (name: string, email: string, password?: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'effectivelearn_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    // Default demo user so the user can see features immediately or switch
    return {
      id: 'usr_demo',
      name: 'Arpan Parajuli',
      email: 'arpan@effectivelearn.dev',
      role: 'Software Architect',
    }
  })

  const login = async (email: string, _password?: string) => {
    // Frontend mock auth flow
    await new Promise((r) => setTimeout(r, 400))
    const userName = email.split('@')[0]
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1)
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: formattedName || 'Learner',
      email,
      role: 'Engineer & Author',
    }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  const register = async (name: string, email: string, _password?: string) => {
    // Frontend mock registration flow
    await new Promise((r) => setTimeout(r, 400))
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim() || 'Learner',
      email,
      role: 'Student & Creator',
    }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
