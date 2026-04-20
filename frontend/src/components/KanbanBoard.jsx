import { useState } from 'react'
import { updateTask, deleteTask } from '../services/api'

const COLUMNS = [
  { key: 'À faire',   color: '#8888aa', bg: '#8888aa15' },
  { key: 'En cours',  color: '#fbbf24', bg: '#fbbf2415' },
  { key: 'Terminé',   color: '#4ade80', bg: '#4ade8015' },
]

export default function KanbanBoard({ tasks, members, projectId, onRefresh }) {
  const [showAdd, setShowAdd]   = useState(null)   // column key or null
  const [newTask, setNewTask]   = useState({ titre: '', description: '', assignee_id: '' })
  const [adding, setAdding]     = useState(false)

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
      const { createTask } = await import('../services/api')
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.statut === col.key)
        return (
          <div key={col.key} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            minHeight: '300px',
          }}>
            {/* Column header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px' }}>{col.key}</span>
              </div>
              <span style={{
                background: col.bg,
                color: col.color,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {colTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {colTasks.map(task => {
                const assignee = members.find(m => m.id === task.assignee_id)
                return (
                  <div key={task.id} style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{task.titre}</p>
                    {task.description && (
                      <p style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '8px' }}>{task.description}</p>
                    )}
                    {assignee && (
                      <p style={{ color: 'var(--accent)', fontSize: '11px', marginBottom: '8px' }}>
                        👤 {assignee.prenom} {assignee.nom}
                      </p>
                    )}
                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {COLUMNS.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => handleStatusChange(task.id, c.key)}
                          style={{
                            background: c.bg,
                            color: c.color,
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 7px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}>
                          → {c.key}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(task.id)} style={{
                        background: '#ff658415',
                        color: '#ff6584',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                      }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add task button */}
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
                  <button type="submit" className="btn btn-primary" disabled={adding}
                    style={{ fontSize: '12px', padding: '6px 12px', flex: 1, justifyContent: 'center' }}>
                    {adding ? '...' : 'Ajouter'}
                  </button>
                  <button type="button" className="btn btn-ghost"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => setShowAdd(null)}>
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowAdd(col.key)} style={{
                marginTop: '10px',
                width: '100%',
                background: 'transparent',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text2)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.target.style.borderColor = col.color; e.target.style.color = col.color }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}>
                + Ajouter une tâche
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
