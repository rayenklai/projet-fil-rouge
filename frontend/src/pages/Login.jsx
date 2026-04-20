import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="card page-fade" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 800,
          fontSize: '28px',
          marginBottom: '4px',
          color: 'var(--accent)',
        }}>
          ProjetHub
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '14px' }}>
          Connectez-vous à votre espace
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          {error && (
            <p style={{ color: 'var(--accent2)', fontSize: '13px', background: '#ff658420', padding: '10px 14px', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text2)', textAlign: 'center' }}>
          Pas de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
