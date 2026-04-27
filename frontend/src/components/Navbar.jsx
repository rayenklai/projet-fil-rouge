import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../services/api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const notifRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (user.id) fetchNotifications()
    const interval = setInterval(() => {
      if (user.id) fetchNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [location, user.id])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setShowNotifs(false)
  }, [location.pathname])

  // Close notif dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  async function fetchNotifications() {
    try {
      const res = await getNotifications()
      setNotifications(res.data)
    } catch (e) {}
  }

  async function handleRead(id) {
    try {
      await markNotificationRead(id)
      fetchNotifications()
    } catch (e) {}
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isTeacher = user.role === 'enseignant'

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">ProjetHub</Link>

        {/* Desktop right side */}
        <div className="nav-right">
          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="btn btn-ghost btn-sm desktop-only"
              onClick={() => setShowNotifs(!showNotifs)}
              style={{ position: 'relative', padding: '6px 10px' }}
              id="notif-toggle"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '1px', right: '1px',
                  background: 'var(--accent2)', color: '#fff', fontSize: '9px',
                  fontWeight: 'bold', borderRadius: '50%', width: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '14px' }}>
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', color: 'var(--text2)', textAlign: 'center', fontSize: '13px' }}>
                    Aucune notification
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : 'var(--bg3)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      gap: '10px', fontSize: '13px', transition: 'background 0.2s',
                    }}>
                      <span style={{ color: n.is_read ? 'var(--text2)' : 'var(--text)', lineHeight: '1.5' }}>
                        {n.message}
                      </span>
                      {!n.is_read && (
                        <button onClick={(e) => { e.stopPropagation(); handleRead(n.id) }} style={{
                          background: 'none', border: 'none', color: 'var(--accent)',
                          cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '2px',
                        }}>
                          ✓
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme toggle (desktop) */}
          <button 
            className="btn btn-ghost btn-sm desktop-only" 
            onClick={toggleTheme} 
            title="Changer le thème"
            style={{ fontSize: '16px', padding: '4px 8px' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User info (desktop) */}
          <div className="user-info desktop-only">
            <div className="avatar avatar-sm">
              {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <span>{user.prenom} {user.nom}</span>
            <span className="badge badge-accent">{isTeacher ? 'Enseignant' : 'Étudiant'}</span>
          </div>

          <button className="btn btn-ghost btn-sm desktop-only" onClick={logout} id="logout-btn">
            Déconnexion
          </button>

          {/* Burger (mobile) */}
          <button className={`burger ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} id="burger-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile slide-out menu */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 16px' }}>
          <div className="avatar">{user.prenom?.[0]}{user.nom?.[0]}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{user.prenom} {user.nom}</div>
            <span className="badge badge-accent" style={{ marginTop: '4px' }}>{isTeacher ? 'Enseignant' : 'Étudiant'}</span>
          </div>
        </div>

        <Link to="/">
          {isTeacher ? '📊 Dashboard' : '📂 Mes Projets'}
        </Link>

        {/* Mobile notification shortcut */}
        <button onClick={() => { setMobileOpen(false); setShowNotifs(true) }}>
          🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>

        {/* Mobile Theme toggle */}
        <button onClick={() => { setMobileOpen(false); toggleTheme() }}>
          {theme === 'dark' ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
        </button>

        <div style={{ flex: 1 }} />

        <button onClick={() => { setMobileOpen(false); logout() }} style={{ color: 'var(--danger)' }}>
          🚪 Déconnexion
        </button>
      </div>
    </>
  )
}
