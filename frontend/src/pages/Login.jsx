import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
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
    <div className="auth-page">
      <div className="auth-card card page-fade">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚀</div>
          <h1 id="login-heading">ProjetHub</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
            Connectez-vous à votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required id="login-email" />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required id="login-password" />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '14px' }} id="login-submit">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text2)', textAlign: 'center' }}>
          Pas de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--accent-h)', fontWeight: 600 }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
