import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="container">
        <Link to="/" className="logo" aria-label="SnapTrace home">
          <span className="mark" />
          SnapTrace
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <NavLink to="/dashboard" className="link">
                Albums
              </NavLink>
              <NavLink to="/profile" className="link">
                Profile
              </NavLink>
              <ThemeToggle />
              <button className="btn ghost small" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <a href="/#how" className="link">
                How it works
              </a>
              <a href="/#features" className="link">
                Features
              </a>
              <ThemeToggle />
              <Link to="/login" className="btn ghost small">
                Sign in
              </Link>
              <Link to="/register" className="btn accent small">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
