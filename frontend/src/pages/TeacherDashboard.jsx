import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../services/api'

function DonutChart({ percent, size = 80 }) {
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg3)" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke={percent >= 75 ? 'var(--success)' : percent >= 40 ? 'var(--warning)' : 'var(--accent)'}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="donut-label" style={{
        color: percent >= 75 ? 'var(--success)' : percent >= 40 ? 'var(--warning)' : 'var(--accent)',
        fontSize: size < 70 ? '13px' : '16px',
      }}>
        {percent}%
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const res = await getDashboardStats()
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Compute global stats
  const totalProjects = data.length
  const totalTasks = data.reduce((s, d) => s + d.stats.total, 0)
  const totalDone = data.reduce((s, d) => s + d.stats.done, 0)
  const totalStudents = new Set(data.flatMap(d => d.project.member_ids)).size
  const globalPercent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  // Sort
  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'progress') {
      const pa = a.stats.total > 0 ? a.stats.done / a.stats.total : 0
      const pb = b.stats.total > 0 ? b.stats.done / b.stats.total : 0
      return pb - pa
    }
    if (sortBy === 'date') {
      return new Date(b.project.created_at) - new Date(a.project.created_at)
    }
    return a.project.titre.localeCompare(b.project.titre)
  })

  return (
    <div className="page page-fade">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Dashboard Enseignant</h1>
        <p className="page-subtitle">Bonjour {user.prenom} — Vue d'ensemble de tous les projets</p>
      </div>

      {/* Global Stats */}
      <div className="grid-stats" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Projets', value: totalProjects, color: 'var(--accent-h)', icon: '📁' },
          { label: 'Tâches totales', value: totalTasks, color: 'var(--text)', icon: '📋' },
          { label: 'Achèvement', value: `${globalPercent}%`, color: 'var(--success)', icon: '✅' },
          { label: 'Étudiants', value: totalStudents, color: 'var(--info)', icon: '👥' },
        ].map(stat => (
          <div key={stat.label} className="card stat-card">
            <div className="stat-label">{stat.icon} {stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      {totalTasks > 0 && (
        <div className="card" style={{ padding: '18px 22px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>Avancement global</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{globalPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${globalPercent}%` }} />
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">Projets ({totalProjects})</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'name', label: 'Nom' },
            { key: 'progress', label: 'Progression' },
            { key: 'date', label: 'Date' },
          ].map(s => (
            <button key={s.key}
              className={`btn btn-sm ${sortBy === s.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSortBy(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text2)' }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>📊</p>
          <p>Aucun projet à évaluer pour l'instant.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sorted.map(ds => {
            const p = ds.project
            const s = ds.stats
            const percent = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
            const todoW = s.total > 0 ? (s.todo / s.total) * 100 : 0
            const inpW = s.total > 0 ? (s.in_progress / s.total) * 100 : 0
            const doneW = s.total > 0 ? (s.done / s.total) * 100 : 0

            return (
              <div key={p.id} className="card card-clickable"
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ padding: '20px 24px' }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Donut */}
                  <DonutChart percent={percent} size={72} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px' }}>{p.titre}</h3>
                      {p.date_fin && (
                        <span className="badge badge-ghost" style={{ fontSize: '10px' }}>
                          📅 {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '10px', lineHeight: '1.5' }}>
                      {p.description || 'Aucune description'}
                    </p>

                    {/* Task breakdown bar */}
                    {s.total > 0 && (
                      <div className="task-bar" style={{ marginBottom: '10px' }}>
                        <div style={{ width: `${doneW}%`, background: 'var(--success)' }} />
                        <div style={{ width: `${inpW}%`, background: 'var(--warning)' }} />
                        <div style={{ width: `${todoW}%`, background: 'var(--text3)' }} />
                      </div>
                    )}

                    {/* Stats badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
                      <span className="badge badge-ghost">📋 {s.total} tâches</span>
                      <span className="badge badge-success">✓ {s.done} terminées</span>
                      <span className="badge badge-warning">⏳ {s.in_progress} en cours</span>
                      <span className="badge badge-info">👥 {p.member_ids.length} membres</span>
                    </div>
                  </div>

                  {/* Evaluate button */}
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}
                    style={{ alignSelf: 'center' }}>
                    Évaluer →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
