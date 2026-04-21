import { useState } from 'react'
import { updateTask, deleteTask, createTask } from '../services/api'

const COLUMNS = [
  { key: 'À faire',  color: '#8b8baa', bg: '#8b8baa15' },
  { key: 'En cours', color: '#fbbf24', bg: '#fbbf2415' },
  { key: 'Terminé',  color: '#34d399', bg: '#34d39915' },
]

export default function KanbanBoard({ tasks, members, projectId, onRefresh, userRole }) {
  const [showAdd, setShowAdd]   = useState(null)
  const [newTask, setNewTask]   = useState({ titre: '', description: '', assignee_id: '' })
  const [adding, setAdding]     = useState(false)

  const isTeacher = userRole === 'enseignant'

  async function handleStatusChange(taskId, newStatus) {
    try {
      await updateTask(taskId, { statut: newStatus })
      onRefresh()
    } catch (e) { console.error(e) }
  }

  async function handleDelete(taskId) {
    if (!confirm('Supprimer cette tâche ?')) return
    try {
      await deleteTask(taskId)
      onRefresh()
    } catch (e) { console.error(e) }
  }

  async function handleAddTask(e) {
    e.preventDefault()
    setAdding(true)
    try {
      await createTask({
        titre:       newTask.titre,
        description: newTask.description || null,
        project_id:  projectId,
        assignee_id: newTask.assignee_id || null,
      })
      setShowAdd(null)
      setNewTask({ titre: '', description: '', assignee_id: '' })
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="grid-kanban">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.statut === col.key)
        return (
          <div key={col.key} className="kanban-col">
            {/* Column header */}
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <span className="kanban-dot" style={{ background: col.color }} />
                <span>{col.key}</span>
              </div>
              <span className="badge" style={{ background: col.bg, color: col.color }}>
                {colTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {colTasks.map(task => {
                const assignee = members.find(m => m.id === task.assignee_id)
                return (
                  <div key={task.id} className="kanban-task">
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: 'var(--text)' }}>
                      {task.titre}
                    </p>
                    {task.description && (
                      <p style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '8px', lineHeight: '1.5' }}>
                        {task.description}
                      </p>
                    )}
                    {assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <div className="avatar avatar-sm" style={{ width: '20px', height: '20px', fontSize: '8px' }}>
                          {assignee.prenom[0]}{assignee.nom[0]}
                        </div>
                        <span style={{ color: 'var(--accent-h)', fontSize: '11px', fontWeight: 500 }}>
                          {assignee.prenom} {assignee.nom}
                        </span>
                      </div>
                    )}
                    {/* Action buttons — hidden for teachers */}
                    {!isTeacher && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key} onClick={() => handleStatusChange(task.id, c.key)}
                            style={{
                              background: c.bg, color: c.color,
                              border: 'none', borderRadius: '4px',
                              padding: '3px 8px', fontSize: '10px',
                              cursor: 'pointer', fontWeight: 600,
                              transition: 'all 0.2s',
                            }}>
                            → {c.key}
                          </button>
                        ))}
                        <button onClick={() => handleDelete(task.id)} className="btn-danger" style={{
                          background: 'var(--danger-bg)', color: 'var(--danger)',
                          border: 'none', borderRadius: '4px',
                          padding: '3px 8px', fontSize: '10px',
                          cursor: 'pointer', marginLeft: 'auto', fontWeight: 600,
                        }}>✕</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add task button — hidden for teachers */}
            {!isTeacher && (
              <>
                {showAdd === col.key ? (
                  <form onSubmit={handleAddTask} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input className="input" placeholder="Titre de la tâche *" style={{ fontSize: '13px' }}
                      value={newTask.titre} onChange={e => setNewTask({ ...newTask, titre: e.target.value })} required />
                    <input className="input" placeholder="Description (optionnel)" style={{ fontSize: '13px' }}
                      value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                    <select className="input" style={{ fontSize: '13px' }}
                      value={newTask.assignee_id} onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}>
                      <option value="">Assigner à... (optionnel)</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={adding} style={{ flex: 1 }}>
                        {adding ? '...' : 'Ajouter'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(null)}>
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAdd(col.key)} className="kanban-add-btn">
                    + Ajouter une tâche
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
