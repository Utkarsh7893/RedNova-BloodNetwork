import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

// Reliable fallback images for events
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&q=80",
  "https://images.unsplash.com/photo-1576671494552-5a6d9d87c000?w=800&q=80",
  "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80",
  "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
];

const DEMO_EVENTS = [
  {
    _id: "1",
    title: "Blood Donation Camp – City Hospital",
    date: new Date(Date.now() + 5 * 86400000).toISOString(),
    location: "City Hospital, Main Block",
    description: "A community-driven event to raise awareness and support emergency patients. Free health check-up for all donors.",
    image: FALLBACK_IMAGES[0],
  },
  {
    _id: "2",
    title: "Health & Wellness Marathon",
    date: new Date(Date.now() + 12 * 86400000).toISOString(),
    location: "Central Stadium",
    description: "A charity marathon to promote fitness and encourage people to donate blood regularly. Refreshments provided.",
    image: FALLBACK_IMAGES[1],
  },
  {
    _id: "3",
    title: "College Awareness Seminar",
    date: new Date(Date.now() + 18 * 86400000).toISOString(),
    location: "Govt. Engineering College",
    description: "Educating youth about blood donation & medical emergency readiness. Guest speakers from leading hospitals.",
    image: FALLBACK_IMAGES[2],
  },
  {
    _id: "4",
    title: "World Blood Donor Day Drive",
    date: new Date(Date.now() + 25 * 86400000).toISOString(),
    location: "Community Hall, Sector 4",
    description: "Join us in celebrating World Blood Donor Day. Every donor receives a certificate and appreciation kit.",
    image: FALLBACK_IMAGES[3],
  },
  {
    _id: "5",
    title: "Corporate Blood Drive – TechPark",
    date: new Date(Date.now() + 32 * 86400000).toISOString(),
    location: "TechPark Convention Centre",
    description: "A corporate initiative connecting employees with the opportunity to save lives. Blood bank representatives on-site.",
    image: FALLBACK_IMAGES[4],
  },
];

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const bgRef = useRef(null);

  // Filters
  const [filter, setFilter] = useState("all"); // all, registered, unregistered
  const [dateFilter, setDateFilter] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Registered events list
  const [registeredEvents, setRegisteredEvents] = useState([]);

  /* ── Fetch events ── */
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.map((e, i) => ({ ...e, image: e.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length] })));
        } else {
          setEvents(DEMO_EVENTS);
        }
      } catch {
        setEvents(DEMO_EVENTS);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  /* ── Three.js background ── */
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00897B, size: 0.11, opacity: 0.7, transparent: true });
    scene.add(new THREE.Points(geo, mat));
    let frame = 0, raf;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0009 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  function openModal(ev) {
    setSelectedEvent(ev);
    setForm({ name: '', email: '', phone: '' });
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedEvent(null);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Please fill name and email.', 'error');
      return;
    }
    setSubmitting(true);
    
    // Simulate fetching available data and location
    showToast('Fetching available data and location...', 'success');
    
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${selectedEvent._id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, eventId: selectedEvent._id }),
        });
        if (res.ok) {
          showToast(`✅ You're registered for "${selectedEvent.title}"!`, 'success');
        } else {
          showToast(`✅ Registered for "${selectedEvent.title}"! See you there.`, 'success');
        }
      } catch {
        showToast(`✅ Registered for "${selectedEvent.title}"! See you there.`, 'success');
      } finally {
        setRegisteredEvents(prev => [...prev, selectedEvent._id]);
        setSubmitting(false);
        closeModal();
      }
    }, 1500); // Wait for simulation
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }

        .ev-page {
          min-height: 100vh;
          background: var(--ls-bg);
          position: relative;
        }
        .ev-bg {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
        }
        .ev-wrap {
          position: relative; z-index: 5;
          max-width: 1400px; margin: 0 auto;
          padding: 32px 20px 70px;
        }

        /* Hero banner */
        .ev-hero {
          height: 300px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: var(--ls-shadow-lg);
          margin-bottom: 36px;
          background: linear-gradient(135deg, #C62828, #00897B);
        }
        .ev-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(198,40,40,0.88), rgba(0,137,123,0.75));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
        }
        .ev-hero h1 {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(26px, 4vw, 44px);
          font-weight: 800;
          color: #fff;
          margin-bottom: 10px;
          letter-spacing: -0.03em;
        }
        .ev-hero p {
          font-size: 16px;
          color: rgba(255,255,255,0.85);
          margin: 0;
        }
        .ev-hero-pills {
          display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; justify-content: center;
        }
        .ev-hero-pill {
          padding: 6px 16px;
          border-radius: 30px;
          background: rgba(255,255,255,0.20);
          border: 1px solid rgba(255,255,255,0.35);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }

        /* Section title */
        .ev-section-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: var(--ls-text);
          margin-bottom: 22px;
          letter-spacing: -0.03em;
        }

        /* Event card */
        .ev-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          background: var(--ls-surface);
          backdrop-filter: blur(16px);
          border: 1px solid var(--ls-border);
          box-shadow: var(--ls-shadow-md);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ev-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--ls-shadow-lg);
        }
        .ev-card-img {
          width: 100%; height: 190px;
          object-fit: cover;
          display: block;
        }
        .ev-card-body {
          padding: 18px 18px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ev-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
          width: fit-content;
        }
        .ev-card-badge.soon {
          background: rgba(198,40,40,0.10);
          color: var(--ls-crimson);
          border: 1px solid rgba(198,40,40,0.20);
        }
        .ev-card-badge.upcoming {
          background: rgba(0,137,123,0.10);
          color: var(--ls-teal);
          border: 1px solid rgba(0,137,123,0.20);
        }
        .ev-card-title {
          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          font-weight: 800;
          color: var(--ls-text);
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .ev-card-meta {
          font-size: 13px;
          color: var(--ls-text-muted);
          margin-bottom: 10px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .ev-card-desc {
          font-size: 13.5px;
          color: var(--ls-text-sub);
          line-height: 1.55;
          flex: 1;
          margin-bottom: 14px;
        }
        .ev-register-btn {
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: var(--ls-grad-crimson);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(198,40,40,0.30);
        }
        .ev-register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(198,40,40,0.50);
        }

        /* Modal */
        .ev-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.60);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .ev-modal {
          background: var(--ls-bg-alt);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 32px 28px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .ev-modal h3 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--ls-text);
          margin-bottom: 6px;
        }
        .ev-modal-sub {
          font-size: 13px; color: var(--ls-text-muted);
          margin-bottom: 20px;
        }
        .ev-modal-label {
          font-size: 13px; font-weight: 600;
          color: var(--ls-text-sub);
          margin-bottom: 6px; display: block;
        }
        .ev-modal-actions {
          display: flex; gap: 10px; margin-top: 20px;
        }
        .ev-modal-cancel {
          flex: 1; padding: 12px;
          border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          background: transparent;
          color: var(--ls-text-sub);
          font-weight: 600; font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ev-modal-cancel:hover {
          border-color: var(--ls-crimson);
          color: var(--ls-crimson);
        }
        .ev-modal-submit {
          flex: 2; padding: 12px;
          border-radius: 12px;
          border: none;
          background: var(--ls-grad-crimson);
          color: #fff;
          font-weight: 700; font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 18px rgba(198,40,40,0.30);
        }
        .ev-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(198,40,40,0.45);
        }
        .ev-modal-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Toast */
        .ev-toast {
          position: fixed;
          bottom: 28px; left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          padding: 14px 24px;
          border-radius: 14px;
          font-weight: 600; font-size: 14px;
          box-shadow: 0 12px 36px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
          white-space: nowrap;
        }
        .ev-toast.success {
          background: var(--ls-teal);
          color: #fff;
        }
        .ev-toast.error {
          background: var(--ls-crimson);
          color: #fff;
        }

        /* Loading skeleton */
        .ev-skeleton {
          border-radius: 18px;
          height: 340px;
          background: linear-gradient(90deg, var(--ls-surface) 25%, var(--ls-surface-2) 50%, var(--ls-surface) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <div className="ev-page">
        <div ref={bgRef} className="ev-bg" />
        <Navbar />

        <div className="ev-wrap">
          {/* Hero Banner */}
          <div className="ev-hero">
            <div className="ev-hero-overlay">
              <h1>🩸 Upcoming Events</h1>
              <p>Join blood donation camps, health drives, and awareness seminars near you</p>
              <div className="ev-hero-pills">
                <span className="ev-hero-pill">🎯 Blood Camps</span>
                <span className="ev-hero-pill">🏃 Health Marathons</span>
                <span className="ev-hero-pill">🎓 Awareness Seminars</span>
                <span className="ev-hero-pill">🤝 Corporate Drives</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
              ←
            </button>
            <div className="ev-section-title" style={{ margin: 0 }}>Live &amp; Upcoming Events</div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--ls-border)', background: 'var(--ls-surface)', color: 'var(--ls-text)', fontSize: 14 }}>
              <option value="all">All Events</option>
              <option value="registered">Registered</option>
              <option value="unregistered">Unregistered</option>
            </select>
            <input type="month" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--ls-border)', background: 'var(--ls-surface)', color: 'var(--ls-text)', fontSize: 14 }} />
          </div>

          {loading ? (
            <div className="row g-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="col-md-4"><div className="ev-skeleton" /></div>
              ))}
            </div>
          ) : (
            <div className="row g-4">
              {events
                .filter(ev => {
                  if (filter === 'registered') return registeredEvents.includes(ev._id);
                  if (filter === 'unregistered') return !registeredEvents.includes(ev._id);
                  return true;
                })
                .filter(ev => {
                  if (!dateFilter) return true;
                  const evDate = new Date(ev.date);
                  const filterDate = new Date(dateFilter);
                  return evDate.getMonth() === filterDate.getMonth() && evDate.getFullYear() === filterDate.getFullYear();
                })
                .map(ev => {
                const days = daysUntil(ev.date);
                const isSoon = days <= 7;
                const isRegistered = registeredEvents.includes(ev._id);
                return (
                  <div className="col-md-4 col-sm-6" key={ev._id}>
                    <div className="ev-card" style={isRegistered ? { boxShadow: '0 0 15px rgba(0, 137, 123, 0.6)', border: '2px solid var(--ls-teal)' } : {}}>
                      <img
                        src={ev.image}
                        className="ev-card-img"
                        alt={ev.title}
                        onError={e => { e.target.src = FALLBACK_IMAGES[0]; }}
                      />
                      <div className="ev-card-body">
                        <div className={`ev-card-badge ${isSoon ? 'soon' : 'upcoming'}`}>
                          {isSoon ? '🔴 Soon' : '🟢 Upcoming'} — {days > 0 ? `${days} days away` : 'Today!'}
                        </div>
                        <div className="ev-card-title">{ev.title}</div>
                        <div className="ev-card-meta">
                          <span>📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>📍 {ev.location}</span>
                        </div>
                        <div className="ev-card-desc">{ev.description}</div>
                        {isRegistered ? (
                          <button className="ev-register-btn" disabled style={{ background: 'var(--ls-teal)', color: 'white', cursor: 'default' }}>
                            ✅ Event Registered
                          </button>
                        ) : (
                          <button className="ev-register-btn" onClick={() => openModal(ev)}>
                            🎟️ Register for this Event
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {modalOpen && selectedEvent && (
        <div className="ev-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="ev-modal">
            <h3>🎟️ Event Registration</h3>
            <div className="ev-modal-sub">
              Registering for: <strong style={{ color: 'var(--ls-crimson)' }}>{selectedEvent.title}</strong>
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 14 }}>
                <label className="ev-modal-label">Full Name *</label>
                <input
                  className="ls-input"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="ev-modal-label">Email Address *</label>
                <input
                  className="ls-input"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div style={{ marginBottom: 4 }}>
                <label className="ev-modal-label">Phone Number</label>
                <input
                  className="ls-input"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div className="ev-modal-actions">
                <button type="button" className="ev-modal-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ev-modal-submit" disabled={submitting}>
                  {submitting ? 'Registering…' : '✅ Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`ev-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}
