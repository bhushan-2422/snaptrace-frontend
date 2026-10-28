import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteEvent,
  deleteImage,
  downloadImage,
  eventStatus,
  getImage,
  getEvent,
  imageFaces,
  joinEvent,
  leaveEvent,
  listImages,
  searchEvent,
  updateEvent,
  uploadImages,
} from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const MAX_MB = 10
const MAX_FILES = 50

export default function EventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [event, setEvent] = useState(null)
  const [gate, setGate] = useState(false) // true when 403 → show join gate
  const [missing, setMissing] = useState(false)
  const [status, setStatus] = useState(null)
  const [images, setImages] = useState([])
  const [joining, setJoining] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [facesOf, setFacesOf] = useState(null)
  const [faces, setFaces] = useState([])
  const [dims, setDims] = useState({})
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const [selfie, setSelfie] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [threshold, setThreshold] = useState(0.45)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const fileRef = useRef(null)
  const selfieRef = useRef(null)
  const cameraRef = useRef(null)

  const isOwner = event && user && event.owner_id === user.id

  const loadEvent = useCallback(async () => {
    try {
      setEvent(await getEvent(id))
      setGate(false)
    } catch (err) {
      if (err.status === 403) setGate(true)
      else if (err.status === 404) setMissing(true)
      else toast.show(err.message)
    }
  }, [id, toast.show])

  const loadAll = useCallback(async () => {
    const [list, st] = await Promise.all([listImages(id), eventStatus(id)])
    setImages(list)
    setStatus(st)
  }, [id])

  useEffect(() => {
    let alive = true
    const init = async () => {
      try {
        await loadEvent()
        if (alive) await loadAll()
      } catch {
        /* handled in loadEvent */
      }
    }
    init()
    return () => {
      alive = false
    }
  }, [loadEvent, loadAll])

  // Poll while something is still being processed (worker is chewing).
  useEffect(() => {
    if (!images.some((im) => im.status === 'uploaded' || im.status === 'processing')) return
    const t = setInterval(async () => {
      const pending = images.filter((im) => im.status === 'uploaded' || im.status === 'processing')
      try {
        const fresh = await Promise.all(pending.map((im) => getImage(im.id)))
        setImages((prev) => prev.map((im) => fresh.find((f) => f.id === im.id) || im))
        setStatus(await eventStatus(id))
      } catch {
        /* transient poll error */
      }
    }, 3500)
    return () => clearInterval(t)
  }, [images, id])

  const join = async () => {
    setJoining(true)
    try {
      await joinEvent(id)
      toast.show('Joined the album')
      await loadEvent()
      await loadAll()
    } catch (err) {
      if (err.status !== 409) toast.show(err.message)
      else await loadEvent()
    } finally {
      setJoining(false)
    }
  }

  const leave = async () => {
    if (!window.confirm('Leave this album? You can rejoin with the link.')) return
    try {
      await leaveEvent(id)
      toast.show('You left the album')
      navigate('/dashboard')
    } catch (err) {
      toast.show(err.message)
    }
  }

  const removeEvent = async () => {
    if (!window.confirm(`Delete “${event.name}” and all its photos?`)) return
    try {
      await deleteEvent(event.id)
      toast.show('Album deleted')
      navigate('/dashboard')
    } catch (err) {
      toast.show(err.message)
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateEvent(id, editForm)
      setEvent(updated)
      setEditing(false)
      toast.show('Album updated')
    } catch (err) {
      toast.show(err.message)
    }
  }

  const onFiles = async (files) => {
    const arr = Array.from(files)
    if (!arr.length) return
    if (arr.length > MAX_FILES) return toast.show(`At most ${MAX_FILES} files per upload`)
    const tooBig = arr.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (tooBig) return toast.show(`“${tooBig.name}” exceeds ${MAX_MB} MB`)
    setUploading(true)
    try {
      const res = await uploadImages(id, arr)
      toast.show(`${res.accepted} photo${res.accepted === 1 ? '' : 's'} queued`)
      await loadAll()
    } catch (err) {
      toast.show(err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (im) => {
    try {
      await deleteImage(im.id)
      setImages((prev) => prev.filter((x) => x.id !== im.id))
      setStatus(await eventStatus(id))
      toast.show('Photo deleted')
    } catch (err) {
      toast.show(err.message)
    }
  }

  const toggleFaces = async (im) => {
    if (facesOf === im.id) return setFacesOf(null)
    try {
      setFaces(await imageFaces(im.id))
      setFacesOf(im.id)
    } catch (err) {
      toast.show(err.message)
    }
  }

  const download = async (im) => {
    try {
      await downloadImage(im)
    } catch (err) {
      toast.show(err.message)
    }
  }

  const onSelfie = (file) => {
    if (!file) return
    setSelfie(file)
    setSelfiePreview(URL.createObjectURL(file))
    setResults(null)
  }

  const runSearch = async () => {
    if (!selfie) return toast.show('Pick a selfie first')
    setSearching(true)
    setResults(null)
    try {
      setResults(await searchEvent(id, selfie, { threshold }))
    } catch (err) {
      toast.show(err.message)
    } finally {
      setSearching(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.show('Link copied — send it to friends')
    } catch {
      toast.show('Copy the URL from the address bar')
    }
  }

  if (missing) {
    return (
      <div className="page">
        <div className="container join-gate">
          <h1>Album not found</h1>
          <p className="lede" style={{ margin: '0 auto 1.4rem' }}>
            It may have been deleted by its owner.
          </p>
          <Link to="/dashboard" className="btn ghost">
            Back to your albums
          </Link>
        </div>
      </div>
    )
  }

  if (gate) {
    return (
      <div className="page">
        <div className="container join-gate">
          <p className="kicker">You’ve been invited</p>
          <h1>This album is shared with you</h1>
          <p className="lede" style={{ margin: '0 auto 1.4rem' }}>
            Join to see the photos, add your own, and search the album with a selfie.
          </p>
          <button className="btn accent" onClick={join} disabled={joining}>
            {joining ? <span className="spinner" /> : 'Join album'}
          </button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <div className="detail-top">
          <div>
            <Link to="/dashboard" className="back">
              ← All albums
            </Link>
            {editing ? (
              <form onSubmit={saveEdit} style={{ display: 'grid', gap: 8, maxWidth: 460 }}>
                <input
                  className="inline-edit"
                  value={editForm.name}
                  required
                  maxLength={200}
                  style={{
                    font: 'inherit',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.7rem',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '4px 10px',
                  }}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  value={editForm.description}
                  maxLength={2000}
                  placeholder="Description"
                  style={{
                    font: 'inherit',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 8,
                    padding: '6px 10px',
                  }}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn small accent">Save</button>
                  <button type="button" className="btn small ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <h1>{event.name}</h1>
                  <span className={`chip ${isOwner ? 'owner' : ''}`}>
                    {isOwner ? 'owner' : 'member'}
                  </span>
                </div>
                <p className="lede" style={{ margin: '0.4rem 0 0' }}>
                  {event.description || 'No description.'}
                </p>
              </>
            )}
          </div>

          <div className="detail-actions">
            <button className="btn ghost small" onClick={copyLink}>
              Share link
            </button>
            {!isOwner && (
              <button className="btn ghost small" onClick={leave}>
                Leave
              </button>
            )}
            {isOwner && !editing && (
              <button
                className="btn ghost small"
                onClick={() => {
                  setEditForm({ name: event.name, description: event.description || '' })
                  setEditing(true)
                }}
              >
                Edit
              </button>
            )}
            {isOwner && (
              <button className="btn danger small" onClick={removeEvent}>
                Delete
              </button>
            )}
          </div>
        </div>

        {status && (
          <div className="status-strip">
            <div>
              <strong>{status.total}</strong>
              <span>photos</span>
            </div>
            <div>
              <strong>{status.uploaded}</strong>
              <span>queued</span>
            </div>
            <div>
              <strong>{status.processing}</strong>
              <span>processing</span>
            </div>
            <div>
              <strong>{status.completed}</strong>
              <span>ready</span>
            </div>
            <div>
              <strong>{status.failed}</strong>
              <span>failed</span>
            </div>
          </div>
        )}

        {/* upload */}
        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            onFiles(e.dataTransfer.files)
          }}
        >
          {uploading ? (
            <span className="spinner" style={{ color: 'var(--accent)' }} />
          ) : (
            <>
              <strong>Drop photos here or click to browse</strong>
              <span>
                up to {MAX_FILES} files · {MAX_MB} MB each · they queue for face processing
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              onFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {/* search */}
        <div className="search-panel">
          <h2>Search this album</h2>
          <p className="hint">
            Pick a clear, front-facing selfie. It’s embedded, compared, then deleted from
            the server.
          </p>
          <div className="search-row">
            <input
              ref={selfieRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => onSelfie(e.target.files[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              hidden
              onChange={(e) => onSelfie(e.target.files[0])}
            />
            <button className="btn ghost small" onClick={() => selfieRef.current?.click()}>
              {selfie ? 'Change selfie' : 'Choose selfie'}
            </button>
            <button
              className="btn ghost small"
              onClick={() => cameraRef.current?.click()}
              title="Use the camera right now"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.7h6.4L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
                <circle cx="12" cy="12.4" r="3.4" />
              </svg>
              Take a photo
            </button>
            {selfiePreview && <img className="thumb-preview" src={selfiePreview} alt="selfie preview" />}
            <label style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
              threshold <b style={{ color: 'var(--accent)' }}>{threshold.toFixed(2)}</b>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ display: 'block', width: 170 }}
              />
            </label>
            <button className="btn accent" onClick={runSearch} disabled={searching || !selfie}>
              {searching ? <span className="spinner" /> : 'Search'}
            </button>
          </div>

          {results && (
            <>
              <p style={{ margin: '1.2rem 0 0', fontSize: '.92rem', color: 'var(--ink-soft)' }}>
                {results.match_count} match{results.match_count === 1 ? '' : 'es'} at
                threshold {results.threshold}
              </p>
              {results.matches.length === 0 ? (
                <div className="notice">No face matched at this threshold — try lowering it.</div>
              ) : (
                <div className="results">
                  {results.matches.map((m, i) => (
                    <div className="result" key={m.image_id} style={{ animationDelay: `${i * 0.06}s` }}>
                      <img src={m.s3_url} alt={`match ${m.image_id}`} loading="lazy" />
                      <div className="score-bar">
                        <span>
                          {(m.score * 100).toFixed(1)}% match
                          <button
                            className="icon-btn"
                            style={{ float: 'right' }}
                            title="Download"
                            onClick={() =>
                              download({ id: m.image_id, original_filename: `match-${m.image_id}.jpg` })
                            }
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                              <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14" />
                            </svg>
                          </button>
                        </span>
                        <div className="track">
                          <div
                            className="fill"
                            style={{ width: `${Math.max(0, m.score) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* photos */}
        <div className="page-head" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Photos</h2>
          <span style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>
            {images.length} shown · click the eye to see detected faces
          </span>
        </div>

        {images.length === 0 ? (
          <div className="notice good">No photos yet — drop some above to get started.</div>
        ) : (
          <div className="photo-grid">
            {images.map((im) => (
              <figure className="photo" key={im.id} style={{ margin: 0 }}>
                <div style={{ position: 'relative' }}>
                  <img
                    className="thumb"
                    src={im.s3_url}
                    alt={im.original_filename}
                    loading="lazy"
                    onLoad={(e) =>
                      setDims((d) => ({
                        ...d,
                        [im.id]: { w: e.target.naturalWidth, h: e.target.naturalHeight },
                      }))
                    }
                  />
                  {facesOf === im.id &&
                    dims[im.id] &&
                    faces.map((f) => (
                      <span
                        key={f.id}
                        className="face-frame"
                        title={`confidence ${f.confidence?.toFixed(3)}`}
                        style={{
                          left: `${(f.bounding_box.x1 / dims[im.id].w) * 100}%`,
                          top: `${(f.bounding_box.y1 / dims[im.id].h) * 100}%`,
                          width: `${((f.bounding_box.x2 - f.bounding_box.x1) / dims[im.id].w) * 100}%`,
                          height: `${((f.bounding_box.y2 - f.bounding_box.y1) / dims[im.id].h) * 100}%`,
                        }}
                      />
                    ))}
                  <span className={`chip ${im.status === 'completed' ? 'ok' : im.status === 'failed' ? 'failed' : 'working'}`} style={{ position: 'absolute', top: 8, left: 8, background: 'var(--bg-raise)' }}>
                    <span className="dot" />
                    {im.status}
                  </span>
                </div>
                <figcaption className="bar">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {im.original_filename}
                  </span>
                  <span className="acts">
                    <button className="icon-btn" title="Show faces" onClick={() => toggleFaces(im)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                        <circle cx="12" cy="12" r="2.6" />
                      </svg>
                    </button>
                    <button className="icon-btn" title="Download" onClick={() => download(im)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14" />
                      </svg>
                    </button>
                    <button className="icon-btn trash" title="Delete" onClick={() => removeImage(im)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
                      </svg>
                    </button>
                  </span>
                </figcaption>
                {facesOf === im.id && (
                  <div style={{ padding: '0.6rem 0.75rem', fontSize: '.78rem', color: 'var(--ink-soft)', borderTop: '1px dashed var(--line)' }}>
                    {faces.length === 0
                      ? 'No faces stored for this photo.'
                      : faces.map((f) => (
                          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>face #{f.id}</span>
                            <span>
                              conf {f.confidence?.toFixed(2)} · sharp {Math.round(f.quality_score || 0)}
                            </span>
                          </div>
                        ))}
                  </div>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
      {toast.node}
    </div>
  )
}
