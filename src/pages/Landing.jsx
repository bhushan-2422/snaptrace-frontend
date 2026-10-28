import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { health } from '../api/endpoints'
import Reveal from '../components/Reveal'

const HERO_WORDS = ['Find', 'the', 'face.', 'Not', 'the', 'folder.']

const STEPS = [
  {
    t: 'Create an album',
    d: 'Start an event — a birthday, a trip, a wedding — and drop in the photos from the day.',
  },
  {
    t: 'Share the link',
    d: 'One URL is the invite. Friends open it, join, and can add their own shots to the same album.',
  },
  {
    t: 'Let it digest',
    d: 'A background worker detects and embeds every face while you keep using the app — nothing blocks.',
  },
  {
    t: 'Search with a selfie',
    d: 'Upload one face. SnapTrace ranks every photo in the album by similarity and hands you the matches.',
  },
]

const FEATURES = [
  {
    t: 'Face-similarity search',
    d: 'Cosine-ranked embeddings in Postgres/pgvector — every result comes with a score you can tune.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    t: 'Shared albums',
    d: 'Send the event link, friends join in one click, everyone contributes — and can leave anytime.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.9 2.8 2.6 3 5.2" />
      </svg>
    ),
  },
  {
    t: 'True background work',
    d: 'Uploads answer in under a second. Detection and embeddings happen on a Redis queue, off the request path.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
      </svg>
    ),
  },
  {
    t: 'Private by design',
    d: 'Photos live in your own bucket behind short-lived signed links. No public URLs, ever.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="4" y="10" width="16" height="10.5" rx="2.2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    t: 'JWT sessions',
    d: 'Short-lived access tokens with refresh rotation — sign in once, stay in, sign out cleanly.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
        <path d="m9 12 2.2 2.2L15.5 10" />
      </svg>
    ),
  },
  {
    t: 'Download anything',
    d: 'Every photo — matched or not — downloads in one click, with its original filename intact.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 4v11" />
        <path d="m7.5 11 4.5 4.5L16.5 11" />
        <path d="M4.5 19.5h15" />
      </svg>
    ),
  },
]

export default function Landing() {
  const [up, setUp] = useState(null)

  useEffect(() => {
    health()
      .then((h) => setUp(h.status === 'ok'))
      .catch(() => setUp(false))
  }, [])

  return (
    <main>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-orb a" />
        <div className="hero-orb b" />

        <div className="container">
          <p className="kicker">Personal photo retrieval, powered by faces</p>
          <h1>
            {HERO_WORDS.map((w, i) => (
              <span
                key={i}
                className="word"
                style={{ animationDelay: `${0.45 + i * 0.09}s` }}
              >
                {w}
                {i < HERO_WORDS.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </h1>
          <p className="lede">
            Upload the album, share one link with friends, then search the whole thing
            with a single selfie. SnapTrace finds every photo your face appears in —
            scored, ranked, and ready to download.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn accent">
              Start an album
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a href="#how" className="btn ghost">
              See how it works
            </a>
          </div>

          <div className="hero-meta">
            <div>
              <strong>&lt; 1 s</strong>
              <span>upload response, always</span>
            </div>
            <div>
              <strong>0</strong>
              <span>public photo links</span>
            </div>
            <div>
              <strong>1</strong>
              <span>selfie to search an album</span>
            </div>
            <div>
              <strong>
                {up === null ? '· · ·' : up ? 'online' : 'offline'}
              </strong>
              <span className={up ? '' : ''}>api status</span>
            </div>
          </div>
        </div>

        <div className="scroll-cue">scroll</div>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <span key={dup} style={{ display: 'flex', gap: '3rem' }}>
                <span>face search</span>
                <b>✳</b>
                <span>shared albums</span>
                <b>✳</b>
                <span>background processing</span>
                <b>✳</b>
                <span>signed links</span>
                <b>✳</b>
                <span>cosine-ranked results</span>
                <b>✳</b>
                <span>download everything</span>
                <b>✳</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="block" id="how">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <p className="kicker">How it works</p>
              <h2>From camera roll to “here they are” in four steps.</h2>
            </div>
            <span className="index">01 — 04</span>
          </Reveal>

          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} className="step" delay={i * 0.08}>
                <span className="num">0{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section className="block" id="features">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <p className="kicker">What’s inside</p>
              <h2>Built like a product, not a demo.</h2>
            </div>
            <span className="index">Features</span>
          </Reveal>

          <div className="features">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} className="card" delay={(i % 3) * 0.08}>
                <div className="glyph">{f.icon}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- split: search preview ---------- */}
      <section className="block">
        <div className="container split">
          <Reveal>
            <p className="kicker">The search</p>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)' }}>
              Every match, scored and ranked — no black box.
            </h2>
            <ul>
              <li>Cosine similarity from −1 to 1; raise the threshold to be stricter.</li>
              <li>One photo appears once — its best face wins, not every face.</li>
              <li>Bounding boxes, confidence and sharpness stored per detected face.</li>
              <li>Works on your own album only — the query selfie is discarded after embedding.</li>
            </ul>
            <div style={{ marginTop: '1.8rem' }}>
              <Link to="/register" className="btn">
                Try it with your photos
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="preview">
            <div className="bar">
              <i />
              <i />
              <i />
            </div>
            <div className="body">
              <div className="row">
                <span>IMG_2041.jpeg</span>
                <span className="score">0.81</span>
              </div>
              <div className="row">
                <span>beach-sunset.png</span>
                <span className="score">0.74</span>
              </div>
              <div className="row">
                <span>group_final(2).jpg</span>
                <span className="score">0.68</span>
              </div>
              <div className="row">
                <span>night_market.heic</span>
                <span className="score">0.61</span>
              </div>
              <div className="row">
                <span>threshold 0.45 · top 50</span>
                <span style={{ color: 'var(--ink-soft)' }}>4 matches</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <section className="block">
        <div className="container">
          <Reveal className="strip">
            <div>
              <strong>10 MB</strong>
              <span>max per photo, 50 per batch</span>
            </div>
            <div>
              <strong>512-d</strong>
              <span>face embedding per face</span>
            </div>
            <div>
              <strong>60 min</strong>
              <span>link validity before refresh</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>worker drains the queue</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta">
        <div className="hero-orb a" style={{ opacity: 0.18, top: '-20vw' }} />
        <div className="container">
          <Reveal>
            <p className="kicker">Ready when you are</p>
            <h2>Your next album deserves better than scrolling.</h2>
            <p className="lede" style={{ textAlign: 'center' }}>
              Create an album, send the link, and let the faces do the sorting.
            </p>
            <Link to="/register" className="btn accent">
              Create your first album
            </Link>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="container">
          <span>SnapTrace — face-powered photo retrieval</span>
          <span>
            FastAPI · PostgreSQL/pgvector · Redis · S3 — built for people who take too
            many photos.
          </span>
        </div>
      </footer>
    </main>
  )
}
