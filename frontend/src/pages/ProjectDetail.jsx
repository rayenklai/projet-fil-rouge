import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getTasks, getMembers, exportPdf, getUsers, addMember } from '../services/api'
import KanbanBoard from '../components/KanbanBoard'
import ProjectMessages from '../components/ProjectMessages'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks]     = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddMember, setShowAddMember] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [activeTab, setActiveTab] = useState('kanban')

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isTeacher = currentUser.role === 'enseignant'

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

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }} />
        <div className="skeleton" style={{ height: '20px', width: '350px' }} />
        <div className="grid-stats" style={{ marginTop: '12px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
        </div>
      </div>
    </div>
  )
  if (!project) return <p style={{ padding: '32px', color: 'var(--accent2)' }}>Projet introuvable.</p>

  const done    = tasks.filter(t => t.statut === 'Terminé').length
  const inProg  = tasks.filter(t => t.statut === 'En cours').length
  const todo    = tasks.filter(t => t.statut === 'À faire').length
  const total   = tasks.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  // My tasks (for student view)
  const myTasks = tasks.filter(t => t.assignee_id === currentUser.id)

  // Per-member task breakdown (for teacher view)
  const memberStats = members.map(m => {
    const memberTasks = tasks.filter(t => t.assignee_id === m.id)
    const mDone = memberTasks.filter(t => t.statut === 'Terminé').length
    return {
      ...m,
      total: memberTasks.length,
      done: mDone,
      percent: memberTasks.length > 0 ? Math.round((mDone / memberTasks.length) * 100) : 0,
    }
  })

  return (
    <div className="page page-fade">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '20px' }} id="back-btn">
        ← Retour
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h1 className="page-title">{project.titre}</h1>
            <button className="btn btn-ghost btn-sm" onClick={handleExportPdf} id="export-pdf-btn">
              📄 PDF
            </button>
          </div>
          {project.description && (
            <p className="page-subtitle" style={{ maxWidth: '600px' }}>
              {project.description}
            </p>
          )}
        </div>
        {project.date_fin && (
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text3)', fontSize: '10px', marginBottom: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date fin</p>
            <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '15px' }}>
              {new Date(project.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid-stats" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total tâches',  value: total, color: 'var(--text)' },
          { label: 'À faire',       value: todo,   color: 'var(--text2)' },
          { label: 'En cours',      value: inProg, color: 'var(--warning)' },
          { label: 'Terminées',     value: done,   color: 'var(--success)' },
          { label: 'Membres',       value: members.length, color: 'var(--accent-h)' },
        ].map(stat => (
          <div key={stat.label} className="card stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card" style={{ padding: '16px 22px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>Avancement global</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{percent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {/* ── Teacher: Member Progress Breakdown ─────────────────────── */}
      {isTeacher && memberStats.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '14px' }}>👥 Progression par membre</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {memberStats.map(m => (
              <div key={m.id} className="task-row" style={{ gap: '14px' }}>
                <div className="avatar avatar-sm">{m.prenom[0]}{m.nom[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{m.prenom} {m.nom}</p>
                  <div className="progress-bar" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${m.percent}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>{m.done}/{m.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Student: My Tasks in This Project ──────────────────────── */}
      {!isTeacher && myTasks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '14px' }}>🎯 Mes tâches dans ce projet ({myTasks.length})</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {myTasks.map(task => {
              const statusCfg = {
                'À faire':  { badge: 'badge-ghost', icon: '○' },
                'En cours': { badge: 'badge-warning', icon: '◐' },
                'Terminé':  { badge: 'badge-success', icon: '●' },
              }
              const cfg = statusCfg[task.statut] || statusCfg['À faire']
              return (
                <div key={task.id} className="task-row">
                  <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{task.titre}</p>
                    {task.description && <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{task.description}</p>}
                  </div>
                  <span className={`badge ${cfg.badge}`}>{task.statut}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Members */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <h2 className="section-title">Membres</h2>
          {!isTeacher && project.owner_id === currentUser.id && (
            <button className="btn btn-ghost btn-sm" onClick={openAddMemberModal} style={{ color: 'var(--accent)' }} id="add-member-btn">
              + Ajouter
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {members.map(m => (
            <div key={m.id} style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 0.2s',
            }}>
              <div className="avatar avatar-sm">{m.prenom[0]}{m.nom[0]}</div>
              {m.prenom} {m.nom}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Switcher (mobile-friendly) ─────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button className={`btn btn-sm ${activeTab === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('kanban')}>📋 Tâches</button>
        <button className={`btn btn-sm ${activeTab === 'messages' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('messages')}>💬 Messages</button>
      </div>

      {/* Kanban & Messages — Desktop: side by side, Mobile: tabs */}
      <div className="flex-layout" style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2, minWidth: '300px', display: activeTab === 'kanban' ? 'block' : 'none' }}
          className={activeTab === 'kanban' ? '' : 'mobile-hidden'}>
          <KanbanBoard
            tasks={tasks}
            members={members}
            projectId={id}
            onRefresh={fetchAll}
            userRole={currentUser.role}
          />
        </div>
        <div style={{ flex: 1, minWidth: '300px', display: activeTab === 'messages' ? 'block' : 'none' }}
          className={activeTab === 'messages' ? '' : 'mobile-hidden'}>
          <ProjectMessages projectId={id} />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '18px', marginBottom: '20px' }}>
              Ajouter un membre
            </h2>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Sélectionner un étudiant</label>
                <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required id="member-select">
                  <option value="" disabled>-- Choisir --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddMember(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={addingMember || !selectedUser} id="add-member-submit">
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
