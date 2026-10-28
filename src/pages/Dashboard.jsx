import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent, deleteEvent, health, listEvents } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Reveal from '../components/Reveal'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [healthOk, setHealthOk] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = useCallback(async () => {
    try {
      setEvents(await listEvents())
    } catch (err) {
      toast.show(err.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
    health()
      .then((h) => setHealthOk(h.status === 'ok'))
      .catch(() => setHealthOk(false))
  }, [load])

  const create = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const ev = await createEvent(form)
      toast.show('Album created')
      navigate(`/events/${ev.id}`)
    } catch (err) {
      toast.show(err.message)
      setCreating(false)
    }
  }

  const remove = async (ev) => {
    if (!window.confirm(`Delete “${ev.name}”? Its photos are removed too.`)) return
    try {
      await deleteEvent(ev.id)
      setEvents((list) => list.filter((x) => x.id !== ev.id))
      toast.show('Album deleted')
    } catch (err) {
      toast.show(err.message)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <p className="kicker">Home</p>
            <h1>Your albums{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          </div>
          <span className={`health ${healthOk ? 'good' : ''}`}>
            <span className="dot" />
            {healthOk ? 'API online' : 'API unreachable'}
          </span>
        </div>

        <div className="grid-cards">
          <form className="new-album" onSubmit={create}>
            <strong>New album</strong>
            <div className="field" style={{ margin: 0 }}>
              <input
                required
                maxLength={200}
                placeholder="Album name — “Diwali 2026”"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <input
                maxLength={2000}
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button className="btn accent" disabled={creating}>
              {creating ? <span className="spinner" /> : 'Create'}
            </button>
          </form>

          {loading ? (
            <div className="event-card" style={{ placeItems: 'center', minHeight: 140 }}>
              <span className="spinner" />
            </div>
          ) : events.length === 0 ? (
            <div className="event-card" style={{ minHeight: 140, justifyContent: 'center' }}>
              <h3>No albums yet</h3>
              <p>Create one on the left — or open a link a friend shared with you.</p>
            </div>
          ) : (
            events.map((ev, i) => {
              const isOwner = ev.owner_id === user?.id
              return (
                <Reveal key={ev.id} className="event-card" delay={Math.min(i, 5) * 0.05}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <h3>{ev.name}</h3>
                    <span className={`chip ${isOwner ? 'owner' : ''}`}>
                      {isOwner ? 'owner' : 'member'}
                    </span>
                  </div>
                  <p>{ev.description || 'No description.'}</p>
                  <div className="meta">
                    <Link to={`/events/${ev.id}`} className="btn small ghost">
                      Open →
                    </Link>
                    {isOwner && (
                      <button className="icon-btn trash" onClick={() => remove(ev)} title="Delete album">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </Reveal>
              )
            })
          )}
        </div>

        <p style={{ marginTop: '1.6rem', color: 'var(--ink-soft)', fontSize: '.9rem' }}>
          Got a link? Open it directly — <code>/events/&lt;id&gt;</code> — and join from there.
        </p>
      </div>
      {toast.node}
    </div>
  )
}
