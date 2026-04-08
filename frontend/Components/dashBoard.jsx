import React, { useEffect, useRef, useState } from "react";
import { fetchRandomImage1, fetchRandomImage2, fetchRandomImage3 } from './api';
import * as THREE from "three";
import { io } from "socket.io-client";


const API_BASE = import.meta.env.VITE_API_URL;

export default function DashBoard() {

  const [imageUrl1, setImageUrl1] = useState(null);
  useEffect(() => {
    async function loadImage1() {
      const url = await fetchRandomImage1();
      setImageUrl1(url);
    }
    loadImage1();
  }, []);

  const [imageUrl2, setImageUrl2] = useState(null);
  useEffect(() => {
    async function loadImage2() {
      const url = await fetchRandomImage2();
      setImageUrl2(url);
    }
    loadImage2();
  }, []);

  const [imageUrl3, setImageUrl3] = useState(null);
  useEffect(() => {
    async function loadImage3() {
      const url = await fetchRandomImage3();
      setImageUrl3(url);
    }
    loadImage3();
  }, []);

  const mountRef = useRef(null);
  const socketRef = useRef(null);

  // data states
  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalDonationsLiters: 0, liveNow: 0 });

  // carousel images (sample URLs) — replace or fetch from API if needed
  const carouselImages = [
    imageUrl1, imageUrl2, imageUrl3,

  ];
  const [carouselIndex, setCarouselIndex] = useState(0);

  // counters animated states
  const [usersCount, setUsersCount] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [liveNowCount, setLiveNowCount] = useState(0);

  // fetch initial data
  useEffect(() => {
    async function load() {
      try {
        const [banksRes, reqRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/banks`).then(r => r.json()),
          fetch(`${API_BASE}/api/requests`).then(r => r.json()),
          fetch(`${API_BASE}/api/stats`).then(r => r.json())
        ]);
        setBanks(banksRes || []);
        setRequests(reqRes || []);
        setStats(statsRes || { totalUsers: 0, totalDonationsLiters: 0, liveNow: 0 });

        // animate counters to those targets
        animateCounters(statsRes || {});
      } catch (err) {
        console.error("Failed to fetch", err);
      }
    }
    load();
  }, []);

  // socket.io setup
  useEffect(() => {
    socketRef.current = io(API_BASE);
    const socket = socketRef.current;

    socket.on("connect", () => console.log("socket connected:", socket.id));
    socket.on("bankUpdated", (payload) => {
      // update local bank list for real-time updates
      setBanks(prev => prev.map(b => (String(b._id) === String(payload.bankId) ? { ...b, stock: payload.stock } : b)));
    });
    socket.on("requestCreated", (payload) => {
      setRequests(prev => [payload, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  // three.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0); // fully transparent
    el.appendChild(renderer.domElement);

    // points particles
    const particlesCount = 180;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaa2b2b, size: 0.12, opacity: 0.85, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    let rafId;
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
      const w = window.innerWidth;
      const h = window.innerHeight;

      renderer.setSize(w, h);
      camera.aspect = w / h;
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

  // carousel auto advance
  useEffect(() => {
    const id = setInterval(() => setCarouselIndex(i => (i + 1) % carouselImages.length), 4000);
    return () => clearInterval(id);
  }, []);

  // helper: animate counters smoothly to stats
  function animateCounters(targets = { totalUsers: 0, totalDonationsLiters: 0, liveNow: 0 }) {
    const startTime = performance.now();
    const duration = 1400;
    const from = { u: 0, d: 0, l: 0 };
    const to = { u: targets.totalUsers || 0, d: targets.totalDonationsLiters || 0, l: targets.liveNow || 0 };
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = (x) => 1 - Math.pow(1 - x, 3);
      setUsersCount(Math.floor(from.u + ease(t) * (to.u - from.u)));
      setDonationsCount(Math.floor(from.d + ease(t) * (to.d - from.d)));
      setLiveNowCount(Math.floor(from.l + ease(t) * (to.l - from.l)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // small fmt
  const fmt = n => (n || 0).toLocaleString();

  // calculate distance (Haversine) between user's lat/lng and bank coords [lng,lat]
  function calcDistanceKm(userLat, userLng, bankCoords) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const [lng, lat] = bankCoords;
    const R = 6371;
    const dLat = toRad(lat - userLat);
    const dLon = toRad(lng - userLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // OPTIONAL: get user's location to compute distances (ask permission)
  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, () => { /* ignore errors */ });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap');

        html, body {
            height: auto !important;
            overflow-y: auto !important;
        }
        .db-page { 
            min-height:100vh; 
            font-family: Inter, system-ui, -apple-system, Roboto, "Segoe UI", Arial;
            background:
              radial-gradient(circle at top left, rgba(255, 180, 180, 0.35), transparent 45%),
              linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
        }
        .db-bg { 
          position: fixed; 
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          pointer-events: none;
        }
        .content-wrap {
          max-width: 1560px;      /* choose your width */
          margin: 0 auto;         /* center it */
          padding: 0 16px;        /* mobile breathing space */
        }
        .db-content { position: relative; z-index: 5; padding-top: 18px; padding-bottom: 50px; }

        .navbar-glass {
          background: linear-gradient(
            135deg,
            rgba(183, 28, 28, 0.45),
            rgba(255, 120, 120, 0.25)
          );
          backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.25);
        }

        .nav-link {
          font-weight: 500;
          color: #5c1a1a !important;
        }

        .nav-link:hover {
          color: #b71c1c !important;
        }

        .navbar-brand { 
          font-family: Manrope, Inter, system-ui;
          letter-spacing: -0.3px;
          color: #7B1E1E !important; 
          font-weight: 700; 
        }

        h5, h6 {
          font-weight: 700;
          color: #6b1414;
        }

        .db-carousel { 
          position: relative; 
          width:100%; 
          height:360px; 
          border-radius: 18px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
          overflow:hidden; 
          background: rgba(0,0,0,0.03);
        }
        .db-carousel img { 
          position:absolute; 
          left:0; 
          top:0; 
          width:100%; 
          height:100%; 
          object-fit:cover; 
          opacity:0; 
          transition:opacity 900ms ease; 
          filter: saturate(1.15) contrast(1.08);
        }
        .db-carousel img.active { opacity: 1; }

        .db-carousel-indicators { position:absolute; bottom:12px; left:50%; transform: translateX(-50%); display:flex; gap:8px; z-index:10; }
        .db-carousel-indicators button { width:10px; height:10px; border-radius:50%; border:0; background: rgba(255,255,255,0.78); box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
        .db-carousel-indicators button.active { background: #b71c1c; transform: scale(1.25); }

        .counters-grid { 
          display:grid; 
          grid-template-columns: 
          repeat(3,1fr); 
          gap:18px; 
          margin-top: 22px; 
        }
        .counter-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.65),
            rgba(255, 215, 215, 0.55)
          );
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 18px 45px rgba(183, 28, 28, 0.18);
        }

        .counter-number {
          font-size: 34px;
          font-weight: 800;
          background: linear-gradient(135deg, #b71c1c, #ff5e5e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .banks-list { margin-top: 18px; }
        .bank-item { 
          display:flex; 
          justify-content:space-between; 
          align-items:center; 
          padding:12px; 
          border-radius:10px; 
          background: rgba(183, 28, 28, 0.22); 
          box-shadow: 0 6px 20px rgba(0,0,0,0.04); 
          margin-bottom:10px; 
        }
        .bank-item {
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55),
            rgba(255, 220, 220, 0.45)
          );
          border-radius: 14px;
        }

        .bank-item:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
          background: rgba(255, 246, 246, 0.6);
          backdrop-filter: blur(2px);
        }
        .requests-feed { margin-top: 14px; }
        .request-item { 
          padding:10px;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.04); 
          margin-bottom:10px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55),
            rgba(255, 220, 220, 0.45)
          );
          border-radius: 14px; 
        }
        .request-item {
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, background 0.2s ease;
        }
        .request-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
          background: rgba(255, 246, 246, 0.6);
          backdrop-filter: blur(2px);

        }

        .btn-danger {
          background: linear-gradient(135deg, #b71c1c, #ff4d4d);
          border: none;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(183, 28, 28, 0.35);
        }

        .btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(183, 28, 28, 0.45);
        }

        .btn-outline-danger {
          background: transparent;
          border: 2px solid transparent;
          background-image:
            linear-gradient(rgba(255, 230, 230, 0.55), rgba(255, 230, 230, 0.55)),
            linear-gradient(135deg, #b71c1c, #ff5e5e);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          color: #7b1e1e;
          font-weight: 600;
        }

        .btn-outline-danger:hover {
          background-image:
            linear-gradient(rgba(255, 210, 210, 0.75), rgba(255, 210, 210, 0.75)),
            linear-gradient(135deg, #b71c1c, #ff5e5e);
          color: #8b1e1e;
          box-shadow: 0 10px 28px rgba(183, 28, 28, 0.25);
          transform: translateY(-1px);
        }

        .footer-pro {
          margin-top: 64px;
          padding: 56px 28px;
          background:
            radial-gradient(circle at top right, rgba(255, 90, 90, 0.18), transparent 40%),
            linear-gradient(180deg, #2f2626 0%, #241e1e 100%);
          color: #dcdcdc;
          border-radius: 18px;
          box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.35);
        }

        .footer-pro h6 {
          font-family: Manrope, Inter, system-ui;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #ffffff;
        }

        .footer-pro a {
          color: #ff9a9a;
          text-decoration: none;
          font-weight: 500;
        }

        .footer-pro a:hover {
          color: #ffd6d6;
          text-decoration: underline;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin-top: 26px;
          padding-top: 16px;
          color: #bdbdbd;
          font-size: 13px;
        }

        @media (max-width: 991px) {
          .db-carousel { height: 240px; }
          .counters-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="db-page">
        {/* three.js mount */}
        <div ref={mountRef} className="db-bg" />

        <div className="db-content container-fluid">
          <div className="content-wrap">
            {/* NAV */}
            <nav className="navbar navbar-expand-lg navbar-glass rounded-3 mb-3">
              <div className="container-fluid">
                <a className="navbar-brand">lifeStream🩸</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                  <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="navMenu">
                  <ul className="navbar-nav ms-auto">
                    <li className="nav-item"><a className="nav-link" href="/about">About</a></li>
                    <li className="nav-item"><a className="nav-link" href="/donors">Donors</a></li>
                    <li className="nav-item"><a className="nav-link" href="/bloodbank">Blood Bank</a></li>
                    <li className="nav-item"><a className="nav-link" href="/events">Events</a></li>
                    <li className="nav-item"><a className="nav-link" href="/contact">Contact</a></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Counters */}
            <div className="counters-grid mt-1 mb-4">
              <div className="counter-card">
                <div className="small text-muted"><b>Registered Users</b></div>
                <div className="counter-number">{fmt(usersCount)}</div>
              </div>
              <div className="counter-card">
                <div className="small text-muted"><b>Liters Donated</b></div>
                <div className="counter-number">{fmt(donationsCount)}</div>
              </div>
              <div className="counter-card">
                <div className="small text-muted"><b>People Online</b></div>
                <div className="counter-number">{fmt(liveNowCount)}</div>
              </div>
            </div>

            {/* CAROUSEL & sidebar */}
            <div className="row gx-4">
              <div className="col-lg-8">
                <div className="db-carousel">
                  {carouselImages.map((src, i) => (
                    <img key={i} src={src} className={i === carouselIndex ? "active" : ""} alt={`slide-${i}`} />
                  ))}
                  <div className="db-carousel-indicators">
                    {carouselImages.map((_, i) => (
                      <button key={i} className={i === carouselIndex ? "active" : ""} onClick={() => setCarouselIndex(i)} />
                    ))}
                  </div>
                </div>

                {/* Requests feed */}
                <div className="requests-feed mt-3">
                  <h5>Live Requests</h5>
                  {requests.map(r => (
                    <div
                      key={r._id}
                      className="request-item p-3 rounded-3 shadow-sm mb-2"
                      onClick={() => window.location.href = `/dashboardrequests/${r._id}`}
                    >
                      <div style={{ fontWeight:700 }}>
                        {r.requesterName} —
                        <span style={{ color:"#b71c1c" }}>{r.bloodGroup}</span>
                      </div>

                      <div className="small text-muted">
                        {r.hospital} • {new Date(r.createdAt).toLocaleString()}
                      </div>

                      <div style={{ fontWeight:700 }}>{r.units} unit(s)</div>
                      <div className="small text-muted">{r.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="p-3 mb-3" style={{ background: "rgba(183, 28, 28, 0.22)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
                  <h6 style={{ marginBottom: 8 }}>Quick Actions</h6>
                  <a className="btn btn-danger w-100 mb-2" href="/requestblood">Request Blood</a>
                  <a className="btn btn-outline-danger w-100" href="/registerdonor">Register as Donor</a>
                </div>

                <div className="p-3 banks-list">
                  <h6>Nearby Blood Banks</h6>
                  {banks.length === 0 && <div className="small text-muted">No blood banks yet</div>}
                  {banks.map(b => {
                    const dist = userLocation ? (calcDistanceKm(userLocation.lat, userLocation.lng, b.location.coordinates).toFixed(1) + " km") : "—";
                    // compute low stock flag
                    const totalUnits = Object.values(b.stock || {}).reduce((a, c) => a + (c || 0), 0);
                    return (
                      <div className="bank-item" key={b._id} onClick={() => window.location.href = `/bloodbank/${b._id}`}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{b.name}</div>
                          <div className="small text-muted">{b.address}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="small">Units: <strong>{totalUnits}</strong></div>
                          <div className="small text-muted">{dist}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="row mt-0 g-3">
              <div className="col-md-4">
                <div className="p-3 rounded-3 shadow-sm h-100" style={{ backgroundColor: "rgba(183, 28, 28, 0.22)" }}>
                  <h6>How it works</h6>
                  <p className="small text-muted mb-0">Register → Find donors/banks → Book appointment → Donate.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 shadow-sm h-100" style={{ backgroundColor: "rgba(183, 28, 28, 0.22)" }}>
                  <h6>Eligibility</h6>
                  <p className="small text-muted mb-0">18–65 yrs, healthy, min weight ~50kg. Check local guidlines.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 shadow-sm h-100" style={{ backgroundColor: "rgba(183, 28, 28, 0.22)" }}>
                  <h6>Emergency Requests</h6>
                  <p className="small text-muted mb-0">Use Request Blood to notify donors and banks in the area quickly.</p>
                </div>
              </div>
            </div>

            {/* Footer (expanded and professional) */}
            <footer className="footer-pro mt-5">
              <div className="row">
                <div className="col-md-4">
                  <h6>BloodCare Initiative</h6>
                  <p className="small">Connecting donors and blood banks with those in need. Trusted network and local centers.</p>
                  <p className="small">Follow: <a href="#">Twitter</a> • <a href="#">Facebook</a> • <a href="#">Instagram</a></p>
                </div>
                <div className="col-md-2">
                  <h6>Explore</h6>
                  <ul className="list-unstyled small">
                    <li><a href="/about">About</a></li>
                    <li><a href="/donors">Donors</a></li>
                    <li><a href="/bloodbank">Blood Banks</a></li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <h6>Support</h6>
                  <ul className="list-unstyled small">
                    <li><a href="/volunteer">Volunteer</a></li>
                    <li><a href="/awareness">Awareness</a></li>
                    <li><a href="/privacypolicy">Privacy Policy</a></li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <h6>Contact</h6>
                  <p className="small mb-1">📩 support@bloodcare.org</p>
                  <p className="small mb-1">📞 +91 123 456 7890</p>
                  <p className="small">🏢 123 Donation St, City</p>
                </div>
              </div>
              <div className="footer-bottom mt-4">© {new Date().getFullYear()} BloodCare — Saving lives together.</div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}