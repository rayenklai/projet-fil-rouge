import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject, getEnseignants, getTasks } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState({ titre: '', description: '', date_debut: '', date_fin: '', enseignant_id: '' })
  const [creating, setCreating]       = useState(false)
  const [teachers, setTeachers]       = useState([])
  const [myTasks, setMyTasks]         = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    try {
      const res = await getProjects()
      setProjects(res.data)
      // Fetch tasks for all projects to build "My Tasks"
      fetchMyTasks(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyTasks(projectsList) {
    try {
      const allTasks = []
      for (const p of projectsList) {
        const res = await getTasks(p.id)
        res.data.forEach(t => {
          allTasks.push({ ...t, projectTitle: p.titre, projectDateFin: p.date_fin })
        })
      }
      // Filter tasks assigned to current user
      const mine = allTasks.filter(t => t.assignee_id === user.id)
      setMyTasks(mine)
    } catch (e) {
      console.error(e)
    } finally {
      setTasksLoading(false)
    }
  }

  async function openCreateModal() {
    setShowModal(true)
    try {
      const res = await getEnseignants()
      setTeachers(res.data)
    } catch (e) {}
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await createProject({
        titre:         form.titre,
        description:   form.description,
        date_debut:    form.date_debut || null,
        date_fin:      form.date_fin || null,
        enseignant_id: form.enseignant_id || null,
      })
      setShowModal(false)
      setForm({ titre: '', description: '', date_debut: '', date_fin: '', enseignant_id: '' })
      fetchProjects()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const statusConfig = {
    'À faire':  { badge: 'badge-ghost',   icon: '○' },
    'En cours': { badge: 'badge-warning', icon: '◐' },
    'Terminé':  { badge: 'badge-success', icon: '●' },
  }

  const pendingTasks = myTasks.filter(t => t.statut !== 'Terminé')

  return (
    <div className="page page-fade">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Mes Projets</h1>
          <p className="page-subtitle">
            Bonjour {user.prenom} — {projects.length} projet{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} id="new-project-btn">
          + Nouveau projet
        </button>
      </div>

      {/* ── My Tasks Section ─────────────────────────────────────────── */}
      {!tasksLoading && pendingTasks.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div className="section-header">
            <h2 className="section-title">📋 Mes tâches en attente ({pendingTasks.length})</h2>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {pendingTasks.slice(0, 8).map(task => {
              const cfg = statusConfig[task.statut] || statusConfig['À faire']
              return (
                <div key={task.id} className="task-row">
                  <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.titre}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
                      {task.projectTitle}
                      {task.projectDateFin && (
                        <span style={{ marginLeft: '8px', color: 'var(--text3)' }}>
                          📅 {new Date(task.projectDateFin).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`badge ${cfg.badge}`}>{task.statut}</span>
                </div>
              )
            })}
            {pendingTasks.length > 8 && (
              <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text2)', textAlign: 'center' }}>
                +{pendingTasks.length - 8} autres tâches
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Projects Grid ────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid-projects">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '160px' }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text2)' }}>
          <p style={{ fontSize: '48px', marginBottom: '14px' }}>📂</p>
          <p style={{ fontSize: '15px', marginBottom: '16px' }}>Aucun projet pour l'instant.</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Créer mon premier projet
          </button>
        </div>
      ) : (
        <div className="grid-projects">
          {projects.map(p => {
            // Compute progress from myTasks
            const projectTasks = myTasks.filter(t => t.project_id === p.id)
            // We don't have full task list per project here; just show member count
            return (
              <div key={p.id} className="card card-clickable" onClick={() => navigate(`/projects/${p.id}`)}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px', lineHeight: '1.3' }}>
                    {p.titre}
                  </h2>
                  <span className="badge badge-accent" style={{ flexShrink: 0 }}>
                    {p.member_ids.length} membre{p.member_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '14px', flex: 1, lineHeight: '1.5' }}>
                  {p.description || 'Aucune description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  {p.date_fin ? (
                    <span style={{ fontSize: '12px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📅 Fin : {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                    </span>
                  ) : <span />}
                  <span style={{ fontSize: '18px' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create Project Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: '500px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '20px', marginBottom: '24px' }}>
              ✨ Nouveau projet
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Titre *</label>
                <input className="input" placeholder="Mon super projet"
                  value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required id="project-title" />
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
              <div>
                <label className="label">Enseignant responsable</label>
                <select className="input" value={form.enseignant_id}
                  onChange={e => setForm({ ...form, enseignant_id: e.target.value })}
                  id="teacher-select"
                >
                  <option value="">-- Choisir un enseignant (optionnel) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={creating} id="create-project-submit">
                  {creating ? 'Création...' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
