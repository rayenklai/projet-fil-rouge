import { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage } from '../services/api'

export default function ProjectMessages({ projectId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const userSentRef = useRef(false)
  const initialLoadRef = useRef(true)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    initialLoadRef.current = true
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    // Only auto-scroll on initial load or when user sends a message
    if (messagesEndRef.current && (initialLoadRef.current || userSentRef.current)) {
      messagesEndRef.current.scrollIntoView({ behavior: initialLoadRef.current ? 'auto' : 'smooth' })
      initialLoadRef.current = false
      userSentRef.current = false
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
      userSentRef.current = true
      await sendMessage(projectId, { text })
      setText('')
      fetchMessages()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="card messages-panel">
      <div className="messages-header">
        💬 Discussion d'équipe
      </div>

      <div className="messages-body">
        {loading ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', fontSize: '13px' }}>Chargement...</p>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>💬</span>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Aucun message. Lancez la discussion !</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user.id
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 500 }}>
                  {m.sender_prenom} {m.sender_nom} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`message-bubble ${isMe ? 'message-mine' : 'message-other'}`}>
                  {m.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="messages-footer">
        <form onSubmit={handleSend}>
          <input
            className="input"
            style={{ flex: 1, padding: '9px 14px', fontSize: '13px' }}
            placeholder="Votre message..."
            value={text}
            onChange={e => setText(e.target.value)}
            id="message-input"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
