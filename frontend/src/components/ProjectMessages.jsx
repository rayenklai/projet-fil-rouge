import { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage } from '../services/api'

export default function ProjectMessages({ projectId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await getMessages(projectId)
      setMessages(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    
    try {
      await sendMessage(projectId, { text })
      setText('')
      fetchMessages()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: '0' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px' }}>Discussion d'équipe</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', fontSize: '13px' }}>Chargement...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', fontSize: '13px' }}>Aucun message pour l'instant. Lancez la discussion !</p>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user.id
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>
                  {m.sender_prenom} {m.sender_nom} — {new Date(m.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                </span>
                <div style={{
                  background: isMe ? 'var(--accent)' : 'var(--bg3)',
                  color: isMe ? '#fff' : 'var(--text)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '0' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '0',
                  fontSize: '14px',
                  maxWidth: '80%',
                  wordBreak: 'break-word',
                }}>
                  {m.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input 
            className="input" 
            style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }} 
            placeholder="Votre message..." 
            value={text} 
            onChange={e => setText(e.target.value)} 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={!text.trim()}>
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
