import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as endpoints from '../api/endpoints'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(() => Boolean(tokenStore.access))

  useEffect(() => {
    if (!tokenStore.access) return
    endpoints
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setBooting(false))
  }, [])

  const login = useCallback(async (email, password) => {
    await endpoints.login({ email, password })
    setUser(await endpoints.me())
  }, [])

  const register = useCallback(
    async (name, email, password) => {
      await endpoints.register({ name, email, password })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    await endpoints.logout()
    setUser(null)
  }, [])

  const patchUser = useCallback((partial) => setUser((u) => ({ ...u, ...partial })), [])

  // Memoized so consumers' effect deps stay stable across renders.
  const value = useMemo(
    () => ({ user, booting, login, register, logout, patchUser }),
    [user, booting, login, register, logout, patchUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
