import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getTasks, getMembers, exportPdf, getUsers, addMember } from '../services/api'
import KanbanBoard from '../components/KanbanBoard'
import ProjectMessages from '../components/ProjectMessages'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks,   setTasks]   = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddMember, setShowAddMember] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    try {
      const [pRes, tRes, mRes] = await Promise.all([
        getProject(id),
        getTasks(id),
        getMembers(id),
      ])
      setProject(pRes.data)
      setTasks(tRes.data)
      setMembers(mRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleExportPdf() {
    try {
      const res = await exportPdf(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `rapport_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch (e) {
      alert("Erreur lors de l'export PDF")
    }
  }

  async function openAddMemberModal() {
    setShowAddMember(true)
    try {
      const res = await getUsers()
      const existingIds = members.map(m => m.id)
      const available = res.data.filter(u => !existingIds.includes(u.id))
      setAllUsers(available)
      if (available.length > 0) setSelectedUser(available[0].id)
    } catch (e) {}
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!selectedUser) return
    setAddingMember(true)
    try {
      await addMember(id, selectedUser)
      setShowAddMember(false)
      fetchAll()
    } catch (e) {
      alert(e.response?.data?.detail || "Erreur lors de l'ajout")
    } finally {
      setAddingMember(false)
    }
  }

  if (loading) return <p style={{ padding: '32px', color: 'var(--text2)' }}>Chargement...</p>
  if (!project) return <p style={{ padding: '32px', color: 'var(--accent2)' }}>Projet introuvable.</p>

  const done    = tasks.filter(t => t.statut === 'Terminé').length
  const total   = tasks.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="page-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Back + Header */}
      <button className="btn btn-ghost" onClick={() => navigate('/')}
        style={{ marginBottom: '20px', fontSize: '13px', padding: '6px 12px' }}>
        ← Retour
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '30px', lineHeight: 1.1 }}>
              {project.titre}
            </h1>
            <button className="btn btn-ghost" onClick={handleExportPdf} style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid var(--border)' }}>
              📄 Exporter PDF
            </button>
          </div>
          {project.description && (
            <p style={{ color: 'var(--text2)', marginTop: '6px', fontSize: '14px', maxWidth: '600px' }}>
              {project.description}
            </p>
          )}
        </div>
        {project.date_fin && (
          <div className="card" style={{ padding: '12px 18px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '2px' }}>DATE FIN</p>
            <p style={{ fontWeight: 700, fontSize: '15px' }}>
              {new Date(project.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      {/* Progress + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total tâches',  value: total,                color: 'var(--text)' },
          { label: 'À faire',       value: tasks.filter(t => t.statut === 'À faire').length,  color: 'var(--text2)' },
          { label: 'En cours',      value: tasks.filter(t => t.statut === 'En cours').length, color: 'var(--warning)' },
          { label: 'Terminées',     value: done,                 color: 'var(--success)' },
          { label: 'Membres',       value: members.length,       color: 'var(--accent)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 18px' }}>
            <p style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '24px', color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Avancement global</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{percent}%</span>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--success))',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Members */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px' }}>
            Membres
          </h2>
          {currentUser.role !== 'enseignant' && project.owner_id === currentUser.id && (
            <button className="btn btn-ghost" onClick={openAddMemberModal} style={{ fontSize: '13px', padding: '4px 10px', color: 'var(--accent)' }}>
              + Ajouter membre
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {members.map(m => (
            <div key={m.id} style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '26px', height: '26px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff',
              }}>
                {m.prenom[0]}{m.nom[0]}
              </span>
              {m.prenom} {m.nom}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban & Messages */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '300px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
            Tableau des tâches
          </h2>
          <KanbanBoard
            tasks={tasks}
            members={members}
            projectId={id}
            onRefresh={fetchAll}
          />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
            Messages
          </h2>
          <ProjectMessages projectId={id} />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowAddMember(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '18px', marginBottom: '20px' }}>
              Ajouter un membre
            </h2>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Sélectionner un étudiant</label>
                <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                  <option value="" disabled>-- Choisir --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddMember(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={addingMember || !selectedUser}>
                  {addingMember ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
