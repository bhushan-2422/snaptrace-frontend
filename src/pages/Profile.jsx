import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Profile() {
  const { user, patchUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then((p) => {
        setForm({ name: p.name, email: p.email })
        patchUser(p)
      })
      .catch((err) => toast.show(err.message))
      .finally(() => setLoading(false))
  }, [patchUser, toast])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      setForm({ name: updated.name, email: updated.email })
      patchUser(updated)
      toast.show('Profile updated')
    } catch (err) {
      toast.show(err.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <p className="kicker">Account</p>
            <h1>Profile</h1>
          </div>
        </div>

        <div className="profile-grid">
          <aside className="profile-side">
            <div className="avatar">{initials}</div>
            <strong>{form.name || '—'}</strong>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.86rem', margin: '0.3rem 0 0' }}>
              {form.email}
            </p>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.8rem', marginTop: '1rem' }}>
              {user ? `Member since ${new Date(user.created_at).toLocaleDateString()}` : ''}
            </p>
          </aside>

          <form className="card" onSubmit={save}>
            <h3 style={{ marginBottom: '1.2rem' }}>Edit details</h3>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <div className="field">
                  <label htmlFor="pname">Name</label>
                  <input
                    id="pname"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pemail">Email</label>
                  <input
                    id="pemail"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <button className="btn accent" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Save changes'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
      {toast.node}
    </div>
  )
}
