import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './ComfortSpot.css'

// Replace these with real files in `public/images` and `public/audio` later
const heroPhoto = '/images/his-photo.webp'

// Use local SVG placeholders for art; audio uses an external placeholder MP3 which you can replace
// Credentials editable here (saved to workspace file)
const unlockCredentials = { id: 'abhinavchauhan26@gmail.com', pass: 'ABHI1234' }

const tracks = [
  { id: 1, title: 'Raabta', src: '/audio/raabata.mp3', art: '/images/art1.webp' },
  { id: 2, title: 'Arz Kiya Hai', src: '/audio/arz kiya hai.mp3', art: '/images/art2.webp' },
  { id: 3, title: 'Mere Nishaan', src: '/audio/mere nishaan .mp3', art: '/images/art3.webp' },
  { id: 4, title: 'Zaalima', src: '/audio/zaalima.mp3', art: '/images/art4.webp' },
  { id: 5, title: 'Darkhaast', src: '/audio/darkhaast.mp3', art: '/images/art5.webp' },
]

const bubbleTexts = ['I love you Abhi', 'my baby boy', 'forever yours']

const bubbleConfigs = [
  { left: '8%', size: 96, delay: 0, duration: 22, color: 'rgba(255, 118, 189, 0.22)', text: '' },
  { left: '24%', size: 64, delay: 3, duration: 18, color: 'rgba(132, 119, 255, 0.18)', text: 'I love you Abhi' },
  { left: '45%', size: 72, delay: 5, duration: 24, color: 'rgba(96, 255, 226, 0.18)', text: '' },
  { left: '62%', size: 52, delay: 8, duration: 20, color: 'rgba(255, 191, 105, 0.18)', text: 'my baby boy' },
  { left: '78%', size: 84, delay: 2, duration: 26, color: 'rgba(246, 120, 255, 0.16)', text: 'forever yours' },
]

export default function ComfortSpot() {
  const { user } = useAuth()
  const [currentId, setCurrentId] = useState(null)
  const [durations, setDurations] = useState({})
  const [heroLoaded, setHeroLoaded] = useState(false)
  const audioRefs = useRef({})
  const firstTrackId = tracks[0]?.id
  const statLine = 'Listened on repeat since 21 July 2026' // editable
  const [showLove, setShowLove] = useState(false)

  function handleLoadedMetadata(id) {
    const audio = audioRefs.current[id]
    if (!audio) return
    const duration = audio.duration
    if (!isFinite(duration)) return
    setDurations((prev) => ({ ...prev, [id]: duration }))
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds)) return '--:--'
    const rounded = Math.round(seconds)
    const mins = Math.floor(rounded / 60)
    const secs = rounded % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const abhiEmail = 'abhinavchauhan26@gmail.com'
    if (!user || user.email !== abhiEmail) return
    const key = `comfort_love_dismissed_${user.email}`
    const dismissed = localStorage.getItem(key)
    if (!dismissed) setShowLove(true)
  }, [user])

  function dismissLove() {
    if (user?.email) localStorage.setItem(`comfort_love_dismissed_${user.email}`, '1')
    setShowLove(false)
  }

  useEffect(() => {
    // initialize refs for audio elements if needed
    tracks.forEach((t) => {
      if (!audioRefs.current[t.id]) audioRefs.current[t.id] = null
    })
    return () => {
      // pause all on unmount
      Object.values(audioRefs.current).forEach((a) => {
        if (a && !a.paused) a.pause()
      })
    }
  }, [])

  const [showHearts, setShowHearts] = useState(false)

  function playTrack(id) {
    const prev = currentId
    if (prev && audioRefs.current[prev]) {
      audioRefs.current[prev].pause()
      audioRefs.current[prev].currentTime = 0
    }
    const audio = audioRefs.current[id]
    if (!audio) return
    audio.play()
    setCurrentId(id)
    setShowHearts(true)
    audio.onended = () => {
      setCurrentId(null)
      setShowHearts(false)
    }
  }

  function toggleTrack(id) {
    const audio = audioRefs.current[id]
    if (!audio) return
    if (currentId === id) {
      audio.pause()
      setCurrentId(null)
      setShowHearts(false)
    } else {
      playTrack(id)
    }
  }

  function playFirstTrack() {
    if (firstTrackId) {
      playTrack(firstTrackId)
    }
  }

  function renderHearts() {
    const seeds = [0.06, 0.18, 0.32, 0.46, 0.62, 0.78, 0.9]
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {seeds.map((s, i) => {
          const size = 20 + (i % 4) * 6
          const dur = 2400 + i * 300
          const left = `${s * 100}%`
          return (
            <span
              key={i}
              className="heart animate"
              style={{ left, '--size': `${size}px`, '--dur': `${dur}ms` }}
            >
              ❤️
            </span>
          )
        })}
      </div>
    )
  }

  function Hearts() {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {renderHearts()}
      </div>
    )
  }

  return (
    <div className="comfort-spot-root min-h-screen text-white">
      <div className="bubble-layer">
        {bubbleConfigs.map((bubble, idx) => (
          <div
            key={idx}
            className={`bubble${bubble.text ? ' text' : ''}`}
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `-${bubble.delay}s`,
              backgroundColor: bubble.color,
            }}
          >
            {bubble.text}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes rise { 0% { transform: translateY(0) scale(1); opacity: 1 } 70% { opacity: 0.9 } 100% { transform: translateY(-300px) scale(1.15); opacity: 0 } }
        @keyframes pulse { 0% { transform: scale(1) } 50% { transform: scale(1.06) } 100% { transform: scale(1) } }
        .heart { position: absolute; bottom: 20px; font-size: var(--size, 24px); opacity: 0.95; transform-origin: center; }
        .heart.animate { animation: rise var(--dur, 2600ms) cubic-bezier(.2,.8,.2,1) forwards, pulse 1200ms ease-in-out infinite; }
      `}</style>
      {showLove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/70" onClick={dismissLove} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090b]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl text-white">
            <h3 className="mb-3 text-2xl font-semibold">For Abhi — My Whole Heart 💖</h3>
            <p className="mb-4 text-sm text-gray-300">
              Abhi — you are my quiet joy and my loudest comfort. I put this little corner together so you always have a place that feels like home. I love you deeply, now and always.
            </p>
            <button
              onClick={dismissLove}
              className="rounded-full bg-sysblue px-4 py-2 text-sm transition hover:scale-[0.98]"
            >
              Close
            </button>
            <Hearts />
          </div>
        </div>
      )}
      <div className="mx-auto relative max-w-6xl px-4 py-8">
        <section className="hero-card relative mb-8 overflow-hidden rounded-[26px]">
          <div className="window-controls">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <img
            src={heroPhoto}
            alt="hero"
            className={`hero-image ${heroLoaded ? 'loaded' : ''}`}
            onLoad={() => setHeroLoaded(true)}
          />
          <div className="hero-overlay">
            <div className="hero-copy">
              <h1 className={`hero-title page-title text-[48px] leading-none text-white ${heroLoaded ? 'visible' : ''}`}>
                My Comfort Spot <span className="ml-2 inline-block text-sm text-green-400">✅ My Favorite Artist</span>
              </h1>
              <p className={`hero-stat mt-2 text-sm text-gray-300 ${heroLoaded ? 'visible' : ''}`}>{statLine}</p>
            </div>
          </div>
        </section>

        <div className="action-row">
          <button onClick={playFirstTrack} className="action-button primary">
            ▶
          </button>
          <button className="action-button secondary">My Heart</button>
          <button className="action-button secondary">...</button>
        </div>

        <section className="track-list">
          <h2 className="mb-4 text-xl font-semibold">Popular</h2>
          <div className="space-y-3">
            {tracks.map((t, idx) => {
              const isActive = currentId === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTrack(t.id)}
                  className={`track-row ${isActive ? 'active' : ''}`}
                >
                  <div className="w-8 text-right text-sm text-gray-400">{idx + 1}</div>
                  <img src={t.art} alt={`${t.title} art`} className="track-art" />
                  <div className="track-info">
                    <div className="track-meta">
                      <div className="track-title-block">
                        <div>
                          <p className="track-title">{t.title}</p>
                          <p className="track-subtitle">Album</p>
                        </div>
                        {isActive && (
                          <div className="audio-meter" aria-hidden="true">
                            <span className="equalizer-bar" />
                            <span className="equalizer-bar" />
                            <span className="equalizer-bar" />
                          </div>
                        )}
                      </div>
                      <div className="track-duration">{formatDuration(durations[t.id])}</div>
                    </div>
                  </div>
                  <div className={`track-icon transition ${isActive ? 'playing' : ''}`}>
                    {isActive ? '⏸' : '▶'}
                  </div>

                  <audio
                    ref={(el) => (audioRefs.current[t.id] = el)}
                    src={t.src}
                    preload="metadata"
                    onLoadedMetadata={() => handleLoadedMetadata(t.id)}
                  />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
