import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import * as THREE from "three";

const API_BASE = "import.meta.env.VITE_API_URL";

export default function Donors() {
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
        .db-page { min-height:100vh; background:linear-gradient(180deg,#ffe6e6 0%,#f7caca 100%); font-family:Inter,sans-serif; position:relative; }
        .db-bg { position:fixed; inset:0; width:100vw; height:100vh; z-index:0; pointer-events:none; }
        .content-wrap { max-width:1560px; margin:0 auto; padding:16px; position:relative; z-index:5; }
        h2 { font-weight:700; color:#6b1414; margin-bottom:6px; }
        .filters-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:20px; align-items:center; }
        .search-box input, .form-select { padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.1); width:100%; }
        .donor-card { 
          background: linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,215,215,0.55)); 
          border-radius:16px; 
          padding:16px; 
          margin-bottom:14px; 
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .donor-card:hover { transform:translateY(-4px); box-shadow:0 20px 42px rgba(0,0,0,0.18); }
        .bloodTag { 
          padding:6px 12px; 
          border-radius:8px; 
          font-weight:700; 
          color:#fff; 
          background:linear-gradient(135deg,#b71c1c,#ff4d4d);
          text-align:center;
        }
        .btn-outline-danger { 
          background: transparent;
          border: 2px solid transparent;
          background-image: linear-gradient(rgba(255,230,230,0.55), rgba(255,230,230,0.55)), linear-gradient(135deg, #b71c1c, #ff5e5e);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          color: #7b1e1e;
          font-weight: 600;
        }
        .btn-outline-danger:hover {
          background-image: linear-gradient(rgba(255,210,210,0.75), rgba(255,210,210,0.75)), linear-gradient(135deg,#b71c1c,#ff5e5e);
          color:#8b1e1e;
          box-shadow:0 10px 28px rgba(183,28,28,0.25);
          transform: translateY(-1px);
        }
        .search-input {
          width: 100%;
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          background: rgba(20, 20, 20, 0.75);
          color: #fff;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .search-input::placeholder {
          color: rgba(255,255,255,0.6);
        }
        .search-input:focus {
          outline: none;
          background: rgba(30, 30, 30, 0.85);
          box-shadow: 0 12px 32px rgba(183,28,28,0.4);
        }

        .blood-select {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #8b0000, #b71c1c);
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          appearance: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
        .blood-select:hover {
          background: linear-gradient(135deg, #a30000, #d32f2f);
          box-shadow: 0 12px 28px rgba(183,28,28,0.4);
        }
        .blood-select:focus {
          outline: none;
          box-shadow: 0 12px 28px rgba(183,28,28,0.5);
        }

        .filters-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
      `}</style>

      <div className="db-page">
        <div ref={mountRef} className="db-bg" />
        <div className="content-wrap">
          <h2>Donors</h2>
          <p className="text-muted mb-3"><b>Find registered voluntary donors ready to help</b></p>

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
                    <h5 style={{fontWeight:700}}>{d.name}</h5>
                    <div className="text-muted">{d.age} yrs • {d.gender}</div>
                    <div className="small text-muted">{d.city}, {d.state}</div>
                    <div className="small">Last donated: {new Date(d.lastDonation).toLocaleDateString()}</div>
                  </div>
                  <div className="col-md-2 d-flex justify-content-center">
                    <div className="bloodTag">{d.bloodGroup}</div>
                  </div>
                  <div className="col-md-3 d-flex flex-column align-items-end">
                    <div className="small text-muted">{dist ? `${dist} km away` : "Distance —"}</div>
                    <a href={`/donor/${d._id}`} className="btn btn-outline-danger btn-sm mt-2">View Profile</a>
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
