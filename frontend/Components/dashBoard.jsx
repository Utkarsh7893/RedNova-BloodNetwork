import React, { useEffect, useRef, useState } from "react";
import { fetchRandomImage1, fetchRandomImage2, fetchRandomImage3 } from './api';
import * as THREE from "three";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

export default function DashBoard() {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const socketRef = useRef(null);

  const [imageUrl1, setImageUrl1] = useState(null);
  const [imageUrl2, setImageUrl2] = useState(null);
  const [imageUrl3, setImageUrl3] = useState(null);

  useEffect(() => { (async () => setImageUrl1(await fetchRandomImage1()))(); }, []);
  useEffect(() => { (async () => setImageUrl2(await fetchRandomImage2()))(); }, []);
  useEffect(() => { (async () => setImageUrl3(await fetchRandomImage3()))(); }, []);

  const carouselImages = [imageUrl1, imageUrl2, imageUrl3];
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [liveNowCount, setLiveNowCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => {
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      fullDate: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  };
  const clockData = formatClock(currentTime);

  const campaigns = [
    { id: 1, name: "City Center Blood Drive", location: "Downtown Plaza", urgency: "urgent", need: "High (All Types)", instructions: "Please drink plenty of water before arriving." },
    { id: 2, name: "Community Health Camp", location: "Northside Community Hall", urgency: "moderate", need: "Moderate (O-, B-)", instructions: "Bring an ID. Free checkups available." },
    { id: 3, name: "University Campus Run", location: "Main Library Square", urgency: "relaxed", need: "Low (General Stock)", instructions: "Walk-ins welcome all day." }
  ];

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [banksRes, reqRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/banks`).then(r => r.json()),
          fetch(`${API_BASE}/api/requests`).then(r => r.json()),
          fetch(`${API_BASE}/api/stats`).then(r => r.json()),
        ]);
        setBanks(banksRes || []);
        setRequests(reqRes || []);
        animateCounters(statsRes || {});
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    }
    load();
  }, []);

  // Socket.io
  useEffect(() => {
    socketRef.current = io(API_BASE);
    const s = socketRef.current;
    s.on("bankUpdated", (p) => setBanks(prev => prev.map(b => String(b._id) === String(p.bankId) ? { ...b, stock: p.stock } : b)));
    s.on("requestCreated", (p) => setRequests(prev => [p, ...prev]));
    return () => s.disconnect();
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos =>
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {}
    );
  }, []);

  // Three.js
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const particlesCount = 180;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xC62828, size: 0.1, opacity: 0.7, transparent: true });
    scene.add(new THREE.Points(geo, mat));
    let frame = 0, rafId;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Carousel
  useEffect(() => {
    const id = setInterval(() => setCarouselIndex(i => (i + 1) % carouselImages.length), 4000);
    return () => clearInterval(id);
  }, []);

  function animateCounters(targets = {}) {
    const startTime = performance.now();
    const duration = 1400;
    const to = { u: targets.totalUsers || 0, d: targets.totalDonationsLiters || 0, l: targets.liveNow || 0 };
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = x => 1 - Math.pow(1 - x, 3);
      setUsersCount(Math.floor(ease(t) * to.u));
      setDonationsCount(Math.floor(ease(t) * to.d));
      setLiveNowCount(Math.floor(ease(t) * to.l));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function calcDistanceKm(userLat, userLng, bankCoords) {
    const toRad = d => (d * Math.PI) / 180;
    const [lng, lat] = bankCoords;
    const R = 6371;
    const a = Math.sin(toRad(lat - userLat) / 2) ** 2
      + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(toRad(lng - userLng) / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const fmt = n => (n || 0).toLocaleString();

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }

        .db-page {
          min-height: 100vh;
          background: var(--ls-bg);
          position: relative;
        }
        .db-bg {
          position: fixed; inset: 0;
          width: 100vw; height: 100vh;
          z-index: 0; pointer-events: none;
        }
        .db-wrap {
          position: relative; z-index: 5;
          max-width: 1400px; margin: 0 auto;
          padding: 28px 20px 60px;
        }

        /* Counter cards */
        .db-counters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .db-counter-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px);
          border: 1px solid var(--ls-border);
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: var(--ls-shadow-sm);
        }
        .db-counter-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--ls-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .db-counter-num {
          font-family: 'Manrope', sans-serif;
          font-size: 36px;
          font-weight: 800;
          background: var(--ls-grad-crimson);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Carousel */
        .db-carousel {
          position: relative; width: 100%; height: 340px;
          border-radius: 18px; overflow: hidden;
          box-shadow: var(--ls-shadow-lg);
          background: rgba(0,0,0,0.05);
        }
        .db-carousel img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0;
          transition: opacity 900ms ease;
          filter: saturate(1.1) contrast(1.05);
        }
        .db-carousel img.active { opacity: 1; }
        .db-carousel-dots {
          position: absolute; bottom: 12px; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 7px; z-index: 10;
        }
        .db-carousel-dot {
          width: 9px; height: 9px; border-radius: 50%; border: 0;
          background: rgba(255,255,255,0.65);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: all 0.2s;
        }
        .db-carousel-dot.active {
          background: var(--ls-crimson); transform: scale(1.3);
        }

        /* Section headers */
        .db-section-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--ls-text);
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }

        /* Request cards */
        .db-request-item {
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 10px;
          background: var(--ls-grad-card);
          border: 1px solid var(--ls-border);
          box-shadow: var(--ls-shadow-sm);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .db-request-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--ls-shadow-md);
        }

        /* Bank cards */
        .db-bank-item {
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 10px;
          background: var(--ls-grad-card);
          border: 1px solid var(--ls-border);
          box-shadow: var(--ls-shadow-sm);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .db-bank-item:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: var(--ls-shadow-md);
        }

        /* Quick actions sidebar */
        .db-quick-actions {
          background: var(--ls-surface);
          border: 1px solid var(--ls-border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: var(--ls-shadow-sm);
          margin-bottom: 16px;
        }

        /* Info cards */
        .db-info-card {
          background: var(--ls-surface);
          border: 1px solid var(--ls-border);
          border-radius: 14px;
          padding: 18px;
          height: 100%;
          box-shadow: var(--ls-shadow-sm);
        }

        /* Clock Component */
        .db-clock {
          background: var(--ls-grad-card);
          border: 1px solid var(--ls-border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: var(--ls-shadow-sm);
          margin-bottom: 16px;
          text-align: center;
        }
        .db-clock-time {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 32px;
          color: var(--ls-crimson);
          letter-spacing: 1px;
        }
        .db-clock-date {
          font-size: 14px;
          color: var(--ls-text-muted);
          font-weight: 500;
          margin-top: 4px;
        }

        /* Campaigns */
        .db-campaign {
          background: var(--ls-surface);
          border: 1px solid var(--ls-border);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: var(--ls-shadow-sm);
          transition: transform 0.2s;
        }
        .db-campaign:hover { transform: translateY(-3px); }
        .urgency-urgent { color: #d32f2f; background: #ffebee; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .urgency-moderate { color: #f57c00; background: #fff3e0; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .urgency-relaxed { color: #388e3c; background: #e8f5e9; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }

        /* Footer */
        .db-footer {
          margin-top: 60px;
          padding: 48px 28px;
          background: var(--ls-surface);
          border: 1px solid var(--ls-border);
          border-radius: 18px;
          box-shadow: var(--ls-shadow-md);
        }
        .db-footer h6 {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          color: var(--ls-text);
          margin-bottom: 12px;
        }
        .db-footer a {
          color: var(--ls-crimson);
          font-weight: 500;
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
        }
        .db-footer a:hover { color: var(--ls-crimson-lt); }
        .db-footer-bottom {
          border-top: 1px solid var(--ls-border);
          margin-top: 24px;
          padding-top: 14px;
          color: var(--ls-text-muted);
          font-size: 13px;
        }
        .db-footer p { color: var(--ls-text-sub); font-size: 14px; }

        @media (max-width: 768px) {
          .db-counters { grid-template-columns: 1fr; }
          .db-carousel { height: 220px; }
        }
      `}</style>

      <div className="db-page">
        <div ref={mountRef} className="db-bg" />
        <Navbar />

        <div className="db-wrap">
          {/* Counters */}
          <div className="db-counters">
            <div className="db-counter-card">
              <div className="db-counter-label">👥 Registered Users</div>
              <div className="db-counter-num">{fmt(usersCount)}</div>
            </div>
            <div className="db-counter-card">
              <div className="db-counter-label">🩸 Liters Donated</div>
              <div className="db-counter-num">{fmt(donationsCount)}</div>
            </div>
            <div className="db-counter-card">
              <div className="db-counter-label">🟢 People Online Now</div>
              <div className="db-counter-num">{fmt(liveNowCount)}</div>
            </div>
          </div>

          {/* Main grid */}
          <div className="row gx-4">
            {/* Left: carousel + live requests */}
            <div className="col-lg-8">
              <div style={{ marginBottom: 16 }}>
                <Link to="/admin" className="ls-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', color: 'var(--ls-crimson)', fontWeight: 600 }}>
                  🛡️ Access Admin Portal
                </Link>
              </div>
              <div className="db-carousel mb-3">
                {carouselImages.map((src, i) => (
                  <img key={i} src={src} className={i === carouselIndex ? 'active' : ''} alt={`slide-${i}`} />
                ))}
                <div className="db-carousel-dots">
                  {carouselImages.map((_, i) => (
                    <button key={i} className={`db-carousel-dot${i === carouselIndex ? ' active' : ''}`} onClick={() => setCarouselIndex(i)} />
                  ))}
                </div>
              </div>

              {/* Live Requests */}
              <div className="db-section-title mt-3">
                <span>🔴</span> Live Blood Requests
              </div>
              {requests.length === 0 && (
                <div style={{ color: 'var(--ls-text-muted)', fontSize: 14, padding: '12px 0' }}>No active requests right now.</div>
              )}
              {requests.map(r => (
                <div key={r._id} className="db-request-item" onClick={() => navigate(`/dashboardrequests/${r._id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ls-text)' }}>
                        {r.requesterName} —{' '}
                        <span className="blood-badge" style={{ width: 'auto', height: 'auto', padding: '2px 10px', borderRadius: 8, fontSize: 13 }}>
                          {r.bloodGroup}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ls-text-muted)', marginTop: 4 }}>
                        {r.hospital} • {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ls-crimson)' }}>{r.units} unit(s)</div>
                      <div style={{ fontSize: 12, color: 'var(--ls-text-muted)', marginTop: 2, textTransform: 'capitalize' }}>{r.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: quick actions + banks */}
            <div className="col-lg-4">
              <div className="db-clock">
                <div className="db-clock-time">{clockData.time}</div>
                <div className="db-clock-date">{clockData.day}, {clockData.fullDate}</div>
              </div>

              <div className="db-quick-actions">
                <div className="db-section-title" style={{ marginBottom: 12 }}>⚡ Quick Actions</div>
                <Link to="/requestblood" className="ls-btn-primary w-100 mb-2" style={{ justifyContent: 'center', marginBottom: 10, display: 'flex' }}>
                  🩸 Request Blood
                </Link>
                <Link to="/registerdonor" className="ls-btn-outline w-100" style={{ justifyContent: 'center', display: 'flex' }}>
                  ➕ Register as Donor
                </Link>
              </div>

              <div className="db-section-title">🏥 Nearby Blood Banks</div>
              {banks.length === 0 && (
                <div style={{ color: 'var(--ls-text-muted)', fontSize: 14 }}>No banks found.</div>
              )}
              {banks.map(b => {
                const dist = userLocation
                  ? calcDistanceKm(userLocation.lat, userLocation.lng, b.location.coordinates).toFixed(1) + ' km'
                  : '—';
                const totalUnits = Object.values(b.stock || {}).reduce((a, c) => a + (c || 0), 0);
                return (
                  <div key={b._id} className="db-bank-item" onClick={() => navigate(`/bloodbank/${b._id}`)}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ls-text)', fontSize: 14 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ls-text-muted)' }}>{b.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ls-crimson)' }}>{totalUnits} units</div>
                      <div style={{ fontSize: 12, color: 'var(--ls-text-muted)' }}>{dist}</div>
                    </div>
                  </div>
                );
              })}

              <div className="db-section-title mt-4">📣 Active Campaigns</div>
              {campaigns.map(c => (
                <div key={c.id} className="db-campaign">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ls-text)' }}>{c.name}</div>
                    <span className={`urgency-${c.urgency}`}>{c.urgency}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginBottom: 4 }}>📍 {c.location}</div>
                  <div style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginBottom: 8 }}>🩸 Need: {c.need}</div>
                  <div style={{ fontSize: 12, color: 'var(--ls-text-muted)', marginBottom: 10 }}><i>{c.instructions}</i></div>
                  <button className="ls-btn-primary w-100" style={{ fontSize: 13, padding: '8px', justifyContent: 'center' }} onClick={() => alert(`Registered for ${c.name}!`)}>Register for Campaign</button>
                </div>
              ))}

              {/* Email Subscription Interface */}
              <div className="db-quick-actions mt-4" style={{ textAlign: 'center' }}>
                <div className="db-section-title" style={{ justifyContent: 'center', marginBottom: 8 }}>💌 Campaign Alerts</div>
                <p style={{ fontSize: 13, color: 'var(--ls-text-muted)', marginBottom: 12 }}>Receive detailed emails about urgent blood needs in your area.</p>
                <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully to campaign alerts!'); }} style={{ display: 'flex', gap: 8 }}>
                  <input type="email" placeholder="Your email address" required style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--ls-border)', background: 'var(--ls-bg-alt)', color: 'var(--ls-text)', fontSize: 14, outline: 'none' }} />
                  <button type="submit" className="ls-btn-primary" style={{ padding: '0 16px', borderRadius: 10 }}>Subscribe</button>
                </form>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="row mt-4 g-3">
            {[
              { icon: '💡', title: 'How it works', body: 'Register → Find donors or blood banks → Book appointment → Donate and save lives.' },
              { icon: '✅', title: 'Eligibility', body: '18–65 yrs, healthy, min weight ~50 kg. Check with local guidelines before donating.' },
              { icon: '🚨', title: 'Emergency', body: 'Use "Request Blood" to instantly notify nearby donors and blood banks in real-time.' },
            ].map(c => (
              <div key={c.title} className="col-md-4">
                <div className="db-info-card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, color: 'var(--ls-text)', marginBottom: 6 }}>{c.title}</div>
                  <p style={{ fontSize: 13.5, color: 'var(--ls-text-sub)', margin: 0 }}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer className="db-footer">
            <div className="row">
              <div className="col-md-4 mb-3">
                <h6>lifeStream 🩸</h6>
                <p>Connecting donors and blood banks with those in need. A trusted real-time network.</p>
                <p style={{ fontSize: 13, color: 'var(--ls-text-muted)' }}>Follow us: Twitter · Facebook · Instagram</p>
              </div>
              <div className="col-md-2 mb-3">
                <h6>Explore</h6>
                <Link to="/about">About</Link>
                <Link to="/donors">Donors</Link>
                <Link to="/bloodbank">Blood Banks</Link>
                <Link to="/events">Events</Link>
              </div>
              <div className="col-md-3 mb-3">
                <h6>Support</h6>
                <Link to="/registerdonor">Volunteer</Link>
                <Link to="/awareness">Awareness</Link>
                <Link to="/privacypolicy">Privacy Policy</Link>
              </div>
              <div className="col-md-3 mb-3">
                <h6>Contact</h6>
                <p style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginBottom: 4 }}>📩 support@lifestream.org</p>
                <p style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginBottom: 4 }}>📞 +91 123 456 7890</p>
                <p style={{ fontSize: 13, color: 'var(--ls-text-sub)' }}>🏢 123 Donation St, City</p>
              </div>
            </div>
            <div className="db-footer-bottom">© {new Date().getFullYear()} lifeStream — Saving lives together.</div>
          </footer>
        </div>
      </div>
    </>
  );
}