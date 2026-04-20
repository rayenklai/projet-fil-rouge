import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../services/api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (user.id) fetchNotifications()
    const interval = setInterval(() => {
      if (user.id) fetchNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [location, user.id])

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

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{
        fontFamily: 'var(--font-head)',
        fontWeight: 800,
        fontSize: '18px',
        color: 'var(--accent)',
        letterSpacing: '-0.5px',
      }}>
        ProjetHub
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost" onClick={() => setShowNotifs(!showNotifs)} style={{ padding: '6px 10px', position: 'relative' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: 'var(--accent)', color: '#fff', fontSize: '10px',
                fontWeight: 'bold', borderRadius: '50%', padding: '2px 5px'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '40px', right: '0',
              width: '300px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 200,
              maxHeight: '400px', overflowY: 'auto'
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text2)', textAlign: 'center', fontSize: '13px' }}>
                  Aucune notification
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px', borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'var(--bg3)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: '8px', fontSize: '13px'
                  }}>
                    <span style={{ color: n.is_read ? 'var(--text2)' : 'var(--text)' }}>
                      {n.message}
                    </span>
                    {!n.is_read && (
                      <button onClick={(e) => { e.stopPropagation(); handleRead(n.id) }} style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        cursor: 'pointer', fontSize: '11px', flexShrink: 0
                      }}>
                        ✅
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <span style={{ color: 'var(--text2)', fontSize: '13px' }}>
          {user.prenom} {user.nom}
          <span style={{
            marginLeft: '8px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '11px',
            color: 'var(--accent)',
          }}>
            {user.role}
          </span>
        </span>
        <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 14px', fontSize: '13px' }}>
          Déconnexion
        </button>
      </div>
    </nav>
  )
}

