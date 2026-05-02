import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import Navbar from "./Navbar.jsx";
import { useTheme } from '../src/ThemeContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

export default function BloodBanks() {
  const mountRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [sortOption, setSortOption] = useState("name");

  /* ------------------ FETCH BANKS ------------------ */
  useEffect(() => {
    fetch(`${API_BASE}/api/banks`)
      .then(r => r.json())
      .then(d => setBanks(d || []))
      .catch(console.error);
  }, []);

  /* ------------------ GEOLOCATION ------------------ */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  }, []);

  /* ------------------ THREE.JS BACKGROUND ------------------ */
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaa2b2b,
      size: 0.12,
      opacity: 0.85,
      transparent: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let raf;
    const animate = () => {
      frame += 0.01;
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geometry.attributes.position.needsUpdate = true;
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
      el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ------------------ HELPERS ------------------ */
  const calcDistanceKm = (userLat, userLng, coords) => {
    if (!coords) return null;
    const [lng, lat] = coords;
    const R = 6371;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat - userLat);
    const dLon = toRad(lng - userLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userLat)) *
        Math.cos(toRad(lat)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fmt = n => (n || 0).toLocaleString();

  const filteredBanks = banks
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === "units") {
        const sa = Object.values(a.stock).reduce((x, y) => x + y, 0);
        const sb = Object.values(b.stock).reduce((x, y) => x + y, 0);
        return sb - sa;
      }
      return a.name.localeCompare(b.name);
    });

  /* ------------------ UI ------------------ */
  return (
    <>
      <style>{`
        html, body {
          height: auto !important;
          overflow-y: auto !important;
        }

        .bb-page {
          min-height:100vh;
          background: var(--ls-bg);
          position: relative;
        }

        .bb-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .bb-content {
          position: relative;
          z-index: 5;
          max-width: 1400px;
          margin: 0 auto;
          padding: 28px 20px 60px;
        }

        .bb-title {
          font-family: 'Manrope', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--ls-text);
          margin-bottom: 4px;
        }
        .bb-sub { color: var(--ls-text-muted); font-size: 14px; margin-bottom: 24px; }

        .bb-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px;
          border-radius: 16px;
          background: var(--ls-surface);
          backdrop-filter: blur(16px);
          border: 1px solid var(--ls-border);
          box-shadow: var(--ls-shadow-sm);
        }

        .bb-controls input,
        .bb-controls select {
          flex: 1;
          min-width: 180px;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          outline: none;
          font-size: 14px;
          font-weight: 500;
          background: var(--ls-bg-alt);
          color: var(--ls-text);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bb-controls input::placeholder { color: var(--ls-text-muted); }
        .bb-controls input:focus,
        .bb-controls select:focus {
          border-color: var(--ls-crimson);
          box-shadow: 0 0 0 3px rgba(198,40,40,0.12);
        }

        /* Search + select — theme-aware */
        .bb-controls input,
        .bb-controls select {
          padding: 14px 18px;
          border-radius: 14px;
          border: 1.5px solid var(--ls-border);
          outline: none;
          font-size: 15px;
          font-weight: 600;
          min-height: 52px;
          min-width: 260px;
          color: var(--ls-text);
          background: var(--ls-surface);
          backdrop-filter: blur(12px);
          box-shadow: var(--ls-shadow-sm);
          transition: all 0.25s ease;
        }
        .bb-controls input::placeholder { color: var(--ls-text-muted); }

        .bb-controls input { min-width: 300px; }

        .bb-controls input:hover,
        .bb-controls select:hover {
          border-color: var(--ls-crimson);
          box-shadow: 0 6px 20px rgba(198,40,40,0.15);
        }

        .bb-controls input:focus,
        .bb-controls select:focus {
          border-color: var(--ls-crimson);
          box-shadow: 0 0 0 3px rgba(198,40,40,0.15), 0 8px 24px rgba(198,40,40,0.12);
        }

        .bb-controls select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml;utf8,<svg fill='%23b71c1c' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 18px;
          padding-right: 48px;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .bb-controls {
            padding: 14px;
          }
          .bb-controls input,
          .bb-controls select {
            width: 100%;
            min-width: unset;
          }
        }


        .bank-card {
          background: var(--ls-surface);
          backdrop-filter: blur(14px);
          border: 1px solid var(--ls-border);
          border-radius:16px;
          padding:18px;
          margin-bottom:12px;
          cursor:pointer;
          box-shadow: var(--ls-shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .bank-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--ls-shadow-md);
        }

        .bank-name {
          font-size: 17px;
          font-weight: 800;
          color: var(--ls-text);
          font-family: 'Manrope', sans-serif;
        }

        .expand-box {
          margin-top: 14px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(0,137,123,0.06);
          border: 1px solid var(--ls-border-alt);
        }

        table { width:100%; }
        td { padding: 6px 4px; color: var(--ls-text-sub); font-size: 14px; }
        @media (max-width:768px) {
          .bb-controls { padding: 12px; }
          .bb-controls input, .bb-controls select { min-width: unset; width: 100%; }
        }
      `}</style>

      <div className="bb-page">
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${isDark ? '/img/dash_bg_dark.png' : '/img/dash_bg_light.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6, mixBlendMode: 'luminosity', transition: 'all 1s' }} />
        <div ref={mountRef} className="bb-bg" />
        <Navbar />

        <div className="bb-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
              ←
            </button>
            <div className="bb-title" style={{ margin: 0 }}>🏥 Blood Banks</div>
          </div>
          <div className="bb-sub">Find blood banks near you sorted by name or available units</div>

          <div className="bb-controls">
            <input
              type="text"
              placeholder="🔍 Search blood banks by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="name">🔤 Sort by Name</option>
              <option value="units">🩸 Sort by Available Units</option>
            </select>
          </div>


          {filteredBanks.map(b => {
            const total = Object.values(b.stock).reduce((a, c) => a + c, 0);
            const dist = userLocation
              ? calcDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  b.location.coordinates
                ).toFixed(1) + " km"
              : "—";

            return (
              <div
                key={b._id}
                className="bank-card"
                onClick={() =>
                  setExpanded(p => ({ ...p, [b._id]: !p[b._id] }))
                }
              >
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div className="bank-name">{b.name}</div>
                    <div className="small text-muted">{b.address}</div>
                    <div className="small">📞 {b.contact}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <strong>{fmt(total)}</strong> units
                    <div className="small text-muted">{dist}</div>
                  </div>
                </div>

                {expanded[b._id] && (
                  <div className="expand-box">
                    <table>
                      <tbody>
                        {Object.entries(b.stock).map(([g,c]) => (
                          <tr key={g}>
                            <td><strong>{g}</strong></td>
                            <td style={{ textAlign:"right" }}>{c}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <a
                      href={`https://www.google.com/maps?q=${b.location.coordinates[1]},${b.location.coordinates[0]}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📍 View on Google Maps
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
