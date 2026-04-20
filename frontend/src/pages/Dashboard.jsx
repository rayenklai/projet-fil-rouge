import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject, getDashboardStats } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ titre: '', description: '', date_debut: '', date_fin: '' })
  const [creating, setCreating]     = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [dashboardStats, setDashboardStats] = useState([])

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    try {
      if (user.role === 'enseignant') {
        const res = await getDashboardStats()
        setDashboardStats(res.data)
      } else {
        const res = await getProjects()
        setProjects(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await createProject({
        titre:       form.titre,
        description: form.description,
        date_debut:  form.date_debut || null,
        date_fin:    form.date_fin   || null,
      })
      setShowModal(false)
      setForm({ titre: '', description: '', date_debut: '', date_fin: '' })
      fetchProjects()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-fade" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '32px', lineHeight: 1.1 }}>
            Mes Projets
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px', fontSize: '14px' }}>
            Bonjour {user.prenom} — {projects.length} projet{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user.role !== 'enseignant' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouveau projet
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <p style={{ color: 'var(--text2)' }}>Chargement...</p>
      ) : user.role === 'enseignant' ? (
        dashboardStats.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text2)' }}>
            <p>Aucun projet à évaluer pour l'instant.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {dashboardStats.map(ds => {
              const p = ds.project;
              const s = ds.stats;
              const percent = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <div key={p.id} className="card" onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '17px' }}>{p.titre}</h2>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', background: 'var(--success)22', padding: '2px 8px', borderRadius: '4px' }}>
                      {percent}% achevé
                    </span>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '14px', minHeight: '36px' }}>
                    {p.description || 'Aucune description'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '4px' }}>Total: {s.total}</span>
                    <span style={{ background: 'var(--warning)22', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px' }}>En cours: {s.in_progress}</span>
                    <span style={{ background: 'var(--success)22', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px' }}>Terminées: {s.done}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text2)' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📂</p>
          <p>Aucun projet pour l'instant.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '16px' }}>
            Créer mon premier projet
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {projects.map(p => (
            <div key={p.id} className="card" onClick={() => navigate(`/projects/${p.id}`)}
              style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '17px' }}>{p.titre}</h2>
                <span style={{
                  background: 'var(--accent)22',
                  color: 'var(--accent)',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  {p.member_ids.length} membre{p.member_ids.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '14px', minHeight: '36px' }}>
                {p.description || 'Aucune description'}
              </p>
              {p.date_fin && (
                <p style={{ color: 'var(--text2)', fontSize: '12px' }}>
                  📅 Fin : {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '20px', marginBottom: '20px' }}>
              Nouveau projet
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Titre *</label>
                <input className="input" placeholder="Mon super projet"
                  value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" placeholder="Description du projet..." rows={3}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Date début</label>
                  <input className="input" type="date"
                    value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                </div>
                <div>
                  <label className="label">Date fin</label>
                  <input className="input" type="date"
                    value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
