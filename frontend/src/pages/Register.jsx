import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', password: '', role: 'etudiant' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card page-fade" style={{ maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
          <h1 id="register-heading">Créer un compte</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
            Rejoignez la plateforme ProjetHub
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Prénom</label>
              <input className="input" placeholder="Prenom"
                value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required id="register-prenom" />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" placeholder="Nom"
                value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required id="register-nom" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required id="register-email" />
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required id="register-password" />
          </div>

          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} id="register-role">
              <option value="etudiant">Étudiant</option>
              <option value="enseignant">Enseignant</option>
            </select>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '14px' }} id="register-submit">
            {loading ? 'Inscription...' : "Créer mon compte"}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text2)', textAlign: 'center' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: 'var(--accent-h)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
