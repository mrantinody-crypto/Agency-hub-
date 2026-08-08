import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Replace these with real files in `public/images` and `public/audio` later
const heroPhoto = '/images/his-photo.svg'

// Use local SVG placeholders for art; audio uses an external placeholder MP3 which you can replace
// Credentials editable here (saved to workspace file)
const unlockCredentials = { id: 'abhinavchauhan26@gmail.com', pass: 'ABHI1234' }

const tracks = [
  { id: 1, title: 'Comfort Track 1', duration: '3:20', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', art: '/images/art1.svg' },
  { id: 2, title: 'Comfort Track 2', duration: '2:58', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', art: '/images/art2.svg' },
  { id: 3, title: 'Comfort Track 3', duration: '4:01', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', art: '/images/art3.svg' },
  { id: 4, title: 'Comfort Track 4', duration: '3:45', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', art: '/images/art1.svg' },
  { id: 5, title: 'Comfort Track 5', duration: '2:50', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', art: '/images/art2.svg' },
]

export default function ComfortSpot() {
  const { user } = useAuth()
  const [currentId, setCurrentId] = useState(null)
  const audioRefs = useRef({})
  const firstTrackId = tracks[0]?.id
  const statLine = 'Listened on repeat since 21 July 2026' // editable
  const [showLove, setShowLove] = useState(false)

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
    audio.onended = () => setCurrentId(null)
  }

  function toggleTrack(id) {
    const audio = audioRefs.current[id]
    if (!audio) return
    if (currentId === id) {
      audio.pause()
      setCurrentId(null)
    } else {
      playTrack(id)
    }
  }

  function playFirst() {
    const seeds = [0.06, 0.18, 0.32, 0.46, 0.62, 0.78, 0.9]
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {seeds.map((s, i) => {
          const size = 20 + (i % 4) * 6
          const dur = 2400 + (i * 300)
          const left = `${s * 100}%`
          return (
            <span
              key={i}
              className={`heart animate`}
              style={{ left, ['--size']: `${size}px`, ['--dur']: `${dur}ms` }}
            >
              ❤️
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes rise { 0% { transform: translateY(0) scale(1); opacity: 1 } 70% { opacity: 0.9 } 100% { transform: translateY(-300px) scale(1.15); opacity: 0 } }
        @keyframes pulse { 0% { transform: scale(1) } 50% { transform: scale(1.06) } 100% { transform: scale(1) } }
        .heart { position: absolute; bottom: 20px; font-size: var(--size, 24px); opacity: 0.95; transform-origin: center; }
        .heart.animate { animation: rise var(--dur, 2600ms) cubic-bezier(.2,.8,.2,1) forwards, pulse 1200ms ease-in-out infinite; }
      `}</style>
      {showLove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={dismissLove} />
          <div className="relative z-10 w-[92%] max-w-lg rounded-lg bg-[#0B0B0B] p-6 text-center text-white">
            <h3 className="mb-3 text-2xl font-semibold">For Abhi — My Whole Heart 💖</h3>
            <p className="mb-4 text-sm text-gray-300">Abhi — you are my quiet joy and my loudest comfort. I put this little corner together so you always have a place that feels like home. I love you deeply, now and always.</p>
            <button onClick={dismissLove} className="mx-auto rounded-full bg-sysblue px-4 py-2 text-sm">Close</button>
            <Hearts />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="relative mb-8 overflow-hidden rounded-lg">
          <div className="h-64 w-full bg-gray-900">
            <img src={heroPhoto} alt="hero" className="h-64 w-full object-cover opacity-80" />
          </div>
          <div className="absolute left-6 bottom-6 flex items-end gap-4">
            <div>
              <h1 className="font-display text-[48px] leading-none text-white">My Comfort Spot <span className="ml-2 inline-block text-sm text-green-400">✅ My Favorite Artist</span></h1>
              <p className="mt-2 text-sm text-gray-300">{statLine}</p>
            </div>
          </div>
        </section>

        <div className="mb-6 flex items-center gap-4">
          <button onClick={playFirst} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-black text-2xl shadow-lg">▶</button>
          <button className="rounded-full border border-white/10 px-4 py-2 text-sm">My Heart</button>
          <button className="rounded-full border border-white/10 px-3 py-2 text-sm">...</button>
        </div>

        {/* Welcome popup removed — credentials saved to workspace file for admin use */}

        <section>
          <h2 className="mb-4 text-xl font-semibold">Popular</h2>
          <div className="space-y-2">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => toggleTrack(t.id)}
                className={`flex cursor-pointer items-center gap-4 rounded-md px-3 py-2 transition-colors ${currentId === t.id ? 'bg-white/6' : 'hover:bg-white/3'}`}
              >
                <div className="w-8 text-right text-sm text-gray-400">{idx + 1}</div>
                <img src={t.art} alt="art" className="h-12 w-12 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-400">Album</p>
                    </div>
                    <div className="text-sm text-gray-400">{t.duration}</div>
                  </div>
                </div>
                <div className="w-6 text-right text-gray-400">{currentId === t.id ? '⏸' : '▶'}</div>

                <audio ref={(el) => (audioRefs.current[t.id] = el)} src={t.src} preload="none" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
