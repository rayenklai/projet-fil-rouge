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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div className="card page-fade" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '24px', marginBottom: '4px' }}>
          Créer un compte
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '14px' }}>
          Rejoignez la plateforme ProjetHub
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Prénom</label>
              <input className="input" placeholder="Rayen"
                value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" placeholder="Kouki"
                value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
          </div>

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

          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="etudiant">Étudiant</option>
              <option value="enseignant">Enseignant</option>
            </select>
          </div>

          {error && (
            <p style={{ color: 'var(--accent2)', fontSize: '13px', background: '#ff658420', padding: '10px 14px', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
            {loading ? 'Inscription...' : "Créer mon compte"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text2)', textAlign: 'center' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
