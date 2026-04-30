import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import * as THREE from "three";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

export default function Donors() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const socketRef = useRef(null);
  const mountRef = useRef(null);

  // Fetch donors
  useEffect(() => {
    async function load() {
      try {
        const donorsRes = await fetch(`${API_BASE}/api/donors`).then(r => r.json());
        setDonors(donorsRes || []);
        setFilteredDonors(donorsRes || []);
      } catch (err) {
        console.error("Failed to fetch donors", err);
      }
    }
    load();
  }, []);

  // Socket.io for real-time updates
  useEffect(() => {
    socketRef.current = io(API_BASE);
    const socket = socketRef.current;

    socket.on("donorRegistered", (payload) => {
      setDonors(prev => [payload, ...prev]);
      applyFilters([payload, ...donors]);
    });

    return () => socket.disconnect();
  }, [donors]);

  // User geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Filter function
  function applyFilters(data = donors) {
    let res = data;
    if (bloodGroupFilter !== "All") {
      res = res.filter(d => String(d.bloodGroup).toUpperCase() === bloodGroupFilter);
    }
    if (search.trim() !== "") {
      res = res.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.city.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredDonors(res);
  }

  useEffect(() => applyFilters(), [search, bloodGroupFilter]);

  // Distance calculation
  function calcDistanceKm(userLat, userLng, donorData) {
    if (!donorData?.location?.coordinates) return null;
    const toRad = deg => (deg * Math.PI) / 180;
    const [lng, lat] = donorData.location.coordinates;
    const R = 6371;
    const dLat = toRad(lat - userLat);
    const dLon = toRad(lng - userLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
    return Number((2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R).toFixed(1));
  }

  // THREE.js particle background
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

  return (
    <>
      <style>{`
        html, body { height:auto !important; overflow-y:auto !important; }
        .db-page { min-height:100vh; background: var(--ls-bg); position: relative; }
        .db-bg { position:fixed; inset:0; width:100vw; height:100vh; z-index:0; pointer-events:none; }
        .content-wrap { max-width:1400px; margin:0 auto; padding:28px 20px 60px; position:relative; z-index:5; }
        .page-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800; font-size: 28px;
          color: var(--ls-text); margin-bottom: 4px;
        }
        .page-sub { color: var(--ls-text-muted); font-size: 14px; margin-bottom: 24px; }
        .filters-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px; align-items:center; }
        .search-input {
          flex: 1; min-width: 200px;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          color: var(--ls-text);
          font-size: 15px;
          font-weight: 500;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .search-input::placeholder { color: var(--ls-text-muted); }
        .search-input:focus {
          border-color: var(--ls-crimson);
          box-shadow: 0 0 0 3px rgba(198,40,40,0.15);
        }
        .blood-select {
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-grad-crimson);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          appearance: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(198,40,40,0.25);
        }
        .blood-select:hover { box-shadow: 0 8px 24px rgba(198,40,40,0.40); }
        .blood-select option { background: #C62828; color: #fff; }
        .donor-card {
          background: var(--ls-surface);
          backdrop-filter: blur(14px);
          border: 1px solid var(--ls-border);
          border-radius:16px;
          padding:16px 20px;
          margin-bottom:12px;
          box-shadow: var(--ls-shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .donor-card:hover { transform:translateY(-3px); box-shadow: var(--ls-shadow-md); }
        .donor-name { font-weight:700; font-size: 16px; color: var(--ls-text); }
        .donor-meta { font-size: 13px; color: var(--ls-text-muted); margin-top: 2px; }
        .bloodTag {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 6px 14px;
          border-radius: 10px;
          font-weight: 800; font-size: 14px; color: #fff;
          background: var(--ls-grad-crimson);
          box-shadow: 0 4px 14px rgba(198,40,40,0.30);
        }
        .btn-outline-danger {
          padding: 7px 16px; border-radius: 9px;
          border: 1.5px solid var(--ls-crimson);
          background: transparent;
          color: var(--ls-crimson);
          font-weight: 600; font-size: 13px;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-outline-danger:hover {
          background: var(--ls-grad-crimson);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 6px 18px rgba(198,40,40,0.30);
        }
      `}</style>

      <div className="db-page">
        <div ref={mountRef} className="db-bg" />
        <Navbar />
        <div className="content-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
              ←
            </button>
            <div className="page-title" style={{ margin: 0 }}>👥 Donor Network</div>
          </div>
          <div className="page-sub">Find registered voluntary donors ready to help</div>

          {/* Filters */}
        <div className="filters-row">
          <div style={{ flex: 1 }}>
            <input
              className="search-input"
              placeholder="Search by name or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '200px', marginLeft: '16px' }}>
            <select
              className="blood-select"
              value={bloodGroupFilter}
              onChange={e => setBloodGroupFilter(e.target.value)}
            >
              <option value="All">All Blood Types</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div className="text-muted" style={{ marginLeft: 'auto', fontWeight: 500 }}>
            {filteredDonors.length} donors found
          </div>
        </div>

          {/* Donor List */}
          {filteredDonors.map(d => {
            const dist = userLocation && d.location?.coordinates
              ? calcDistanceKm(userLocation.lat, userLocation.lng, d)
              : null;
            return (
              <div key={d._id} className="donor-card">
                <div className="row align-items-center">
                  <div className="col-md-7">
                    <div className="donor-name">{d.name}</div>
                    <div className="donor-meta">{d.age} yrs • {d.gender}</div>
                    <div className="donor-meta">{d.city}, {d.state}</div>
                    <div className="donor-meta">Last donated: {new Date(d.lastDonation).toLocaleDateString()}</div>
                  </div>
                  <div className="col-md-2 d-flex justify-content-center">
                    <div className="bloodTag">{d.bloodGroup}</div>
                  </div>
                  <div className="col-md-3 d-flex flex-column align-items-end">
                    <div style={{ fontSize: 12, color: 'var(--ls-text-muted)' }}>{dist ? `${dist} km away` : '—'}</div>
                    <Link to={`/donor/${d._id}`} className="btn-outline-danger mt-2">
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredDonors.length === 0 &&
            <div className="text-center text-muted mt-4">No donors found</div>
          }

        </div>
      </div>
    </>
  );
}
