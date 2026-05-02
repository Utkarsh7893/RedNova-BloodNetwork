import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import 'leaflet/dist/leaflet.css';
import Navbar from "./Navbar.jsx";
import { useTheme } from '../src/ThemeContext.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Fly map to user's location
function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 12, { duration: 1.5 });
  }, [lat, lng]);
  return null;
}

function LocationMarker({ form, setForm }) {
  const [position, setPosition] = useState(
    form.lat && form.lng ? [form.lat, form.lng] : null
  );
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setForm(f => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
    },
  });
  return position ? <Marker position={position} /> : null;
}

const API_BASE = import.meta.env.VITE_API_URL;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RequestBlood() {
  const { isDark } = useTheme();
  const mountRef = useRef(null);
  const messageRef = useRef(null);

  const [form, setForm] = useState({
    requesterName: "",
    bloodGroup: "",
    units: 1,
    hospital: "",
    selectedBank: "",
    lat: "",
    lng: "",
  });

  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [country, setCountry] = useState("");
  const [stage, setStage] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fetch blood banks
  useEffect(() => {
    fetch(`${API_BASE}/api/banks`).then(r => r.json()).then(d => setBanks(d || [])).catch(() => {});
  }, []);

  // Filter banks when blood group changes
  useEffect(() => {
    if (!form.bloodGroup) {
      setFilteredBanks([]);
      return;
    }
    const bg = form.bloodGroup;
    const matches = banks.filter(b => {
      const stockKey = Object.keys(b.stock || {}).find(k => k.toUpperCase().replace(/\s/g, '') === bg.toUpperCase().replace(/\s/g, ''));
      return stockKey && b.stock[stockKey] > 0;
    });
    setFilteredBanks(matches);
  }, [form.bloodGroup, banks]);

  // Geo location + reverse geocode country
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setForm(f => ({ ...f, lat, lng }));
      // Reverse geocode for country
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(r => r.json())
        .then(data => {
          if (data?.address?.country) setCountry(data.address.country);
        })
        .catch(() => {});
    });
  }, []);

  // Three.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xb71c1c, size: 0.12, opacity: 0.7, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    let raf;
    const animate = () => { pts.rotation.y += 0.0006; pts.rotation.x += 0.0003; renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
    animate();
    const resize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); geo.dispose(); mat.dispose(); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStage("submitting");
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('ls_token');
      const payload = {
        requesterName: form.requesterName,
        bloodGroup: form.bloodGroup,
        units: Number(form.units),
        hospital: form.hospital,
        selectedBank: form.selectedBank,
        location: { type: "Point", coordinates: [Number(form.lng), Number(form.lat)] },
      };
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      setForm(f => ({ ...f, requesterName: "", bloodGroup: "", units: 1, hospital: "", selectedBank: "" }));
      setStage("notified");
      setSuccess(true);
      setError(null);
      if (messageRef.current) messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err.message);
      setSuccess(false);
      if (messageRef.current) messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setLoading(false);
    }
  };

  const selectedBankObj = banks.find(b => b._id === form.selectedBank);

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }
        .req-page { min-height: 100vh; background: var(--ls-bg); position: relative; }
        .req-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .req-content { position: relative; z-index: 5; max-width: 800px; margin: 0 auto; padding: 28px 16px 80px; }
        .req-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 22px;
          padding: 28px 24px;
          box-shadow: var(--ls-shadow-lg);
          margin-bottom: 20px;
        }
        .req-card h2 {
          font-family: 'Manrope', sans-serif;
          color: var(--ls-text);
          font-weight: 900;
          font-size: 24px;
          margin-bottom: 4px;
        }
        .req-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .req-form-grid .full { grid-column: 1 / -1; }
        @media (max-width: 600px) {
          .req-form-grid { grid-template-columns: 1fr; }
          .req-card { padding: 20px 16px; }
        }
        .req-label {
          font-weight: 700; font-size: 13px; color: var(--ls-text-sub);
          display: block; margin-bottom: 6px;
        }
        .req-input {
          width: 100%; padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          color: var(--ls-text);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .req-input:focus { border-color: var(--ls-crimson); box-shadow: 0 0 0 3px rgba(198,40,40,0.12); }
        .req-input::placeholder { color: var(--ls-text-muted); }
        .btn-main { margin-top: 20px; width: 100%; padding: 15px; border-radius: 14px; border: none; cursor: pointer;
          background: var(--ls-grad-crimson); color: white; font-weight: 800; font-size: 15px;
          box-shadow: 0 10px 28px rgba(198,40,40,0.30); transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(198,40,40,0.45); }
        .btn-main:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .success-box { background: rgba(0,137,123,0.10); border: 1px solid rgba(0,137,123,0.25); color: var(--ls-teal); padding: 16px; border-radius: 14px; margin-bottom: 14px; font-weight: 700; text-align: center; }
        .error-box { background: rgba(198,40,40,0.08); border: 1px solid rgba(198,40,40,0.20); color: var(--ls-crimson); padding: 16px; border-radius: 14px; margin-bottom: 14px; font-weight: 700; text-align: center; }
        .processing-box { margin: 18px 0; padding: 18px; border-radius: 14px; text-align: center; font-weight: 700; background: rgba(198,40,40,0.06); color: var(--ls-crimson); border: 1px solid var(--ls-border); }
        .pulse { width: 14px; height: 14px; background: var(--ls-crimson); border-radius: 50%; margin: 0 auto 10px; animation: pulse 1.4s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(198,40,40,0.6); } 70% { box-shadow: 0 0 0 14px rgba(198,40,40,0); } 100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); } }
        .notify-box { margin: 18px 0; padding: 18px; border-radius: 14px; background: rgba(0,137,123,0.08); border: 1px solid var(--ls-border-alt); color: var(--ls-teal); text-align: center; font-weight: 700; }
        .notify-box span { display: block; font-size: 13px; margin-top: 6px; color: var(--ls-text-muted); }
        .leaflet-container { border-radius: 14px !important; margin-top: 8px; height: 320px !important; z-index: 1; }
        @media (max-width: 600px) { .leaflet-container { height: 260px !important; } }

        .bank-list { display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; padding: 4px 0; }
        .bank-option {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          cursor: pointer; transition: all 0.2s;
        }
        .bank-option:hover { border-color: var(--ls-crimson); }
        .bank-option.selected {
          border-color: var(--ls-crimson);
          background: rgba(198,40,40,0.06);
          box-shadow: 0 0 0 2px rgba(198,40,40,0.15);
        }
        .bank-option input[type=radio] { accent-color: #b71c1c; width: 18px; height: 18px; flex-shrink: 0; }
        .bank-info { flex: 1; min-width: 0; }
        .bank-name-opt { font-weight: 700; font-size: 14px; color: var(--ls-text); }
        .bank-meta-opt { font-size: 12px; color: var(--ls-text-muted); margin-top: 2px; }
        .bank-stock-badge {
          flex-shrink: 0; padding: 4px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 800; color: #fff;
          background: var(--ls-grad-crimson);
        }
        .country-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px;
          background: var(--ls-bg-alt); border: 1px solid var(--ls-border);
          font-size: 13px; font-weight: 600; color: var(--ls-text-sub);
          margin-top: 8px;
        }
      `}</style>

      <div className="req-page">
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${isDark ? '/img/dash_bg_dark.png' : '/img/dash_bg_light.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6, mixBlendMode: 'luminosity', transition: 'all 1s' }} />
        <div ref={mountRef} className="req-bg" />
        <Navbar />

        <div className="req-content">
          <div className="req-card" ref={messageRef}>
            <h2>🩸 Request Blood</h2>
            <p style={{ color: 'var(--ls-text-muted)', fontSize: 14, marginBottom: 20 }}>
              Submit an urgent blood request. Nearby donors and blood banks will be notified in real-time.
            </p>

            {stage === "submitting" && (
              <div className="processing-box">
                <div className="pulse" />
                <p style={{ margin: 0 }}>Processing your request…</p>
                <span style={{ display: 'block', fontSize: 13, opacity: 0.75, marginTop: 5 }}>Notifying nearby donors &amp; blood banks</span>
              </div>
            )}
            {stage === "notified" && (
              <div className="notify-box">
                <p style={{ margin: 0 }}>✅ Request submitted successfully!</p>
                <span>📧 A confirmation email has been sent. Your blood is being prepared for shipment and will reach you within a few hours.</span>
              </div>
            )}
            {success && <div className="success-box">✅ Blood request submitted. Check your email for details.</div>}
            {error && <div className="error-box">❌ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="req-form-grid">
                {/* Name */}
                <div>
                  <label className="req-label">👤 Patient / Requester Name</label>
                  <input className="req-input" name="requesterName" placeholder="Full name" value={form.requesterName} onChange={handleChange} required />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="req-label">🩸 Blood Group Required</label>
                  <select className="req-input" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required>
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>

                {/* Units */}
                <div>
                  <label className="req-label">📦 Units Required</label>
                  <input className="req-input" type="number" min="1" max="20" name="units" value={form.units} onChange={handleChange} required />
                </div>

                {/* Delivery Location */}
                <div>
                  <label className="req-label">🏥 Delivery Location / Hospital</label>
                  <input className="req-input" name="hospital" placeholder="Hospital name or delivery address" value={form.hospital} onChange={handleChange} required />
                </div>

                {/* Blood Bank Selection */}
                {form.bloodGroup && (
                  <div className="full">
                    <label className="req-label">🏦 Select Blood Bank ({filteredBanks.length} available for {form.bloodGroup})</label>
                    {filteredBanks.length === 0 ? (
                      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(198,40,40,0.06)', border: '1px solid var(--ls-border)', color: 'var(--ls-text-muted)', fontSize: 14, textAlign: 'center' }}>
                        ⚠️ No blood banks have <strong>{form.bloodGroup}</strong> in stock right now.
                      </div>
                    ) : (
                      <div className="bank-list">
                        {filteredBanks.map(b => {
                          const stockKey = Object.keys(b.stock || {}).find(k => k.toUpperCase().replace(/\s/g, '') === form.bloodGroup.toUpperCase().replace(/\s/g, ''));
                          const stockCount = stockKey ? b.stock[stockKey] : 0;
                          return (
                            <label key={b._id} className={`bank-option${form.selectedBank === b._id ? ' selected' : ''}`}>
                              <input type="radio" name="selectedBank" value={b._id} checked={form.selectedBank === b._id} onChange={handleChange} />
                              <div className="bank-info">
                                <div className="bank-name-opt">{b.name}</div>
                                <div className="bank-meta-opt">📍 {b.address} • 📞 {b.contact}</div>
                              </div>
                              <div className="bank-stock-badge">{stockCount} units</div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Map */}
                <div className="full">
                  <label className="req-label">📍 Select Delivery Location on Map</label>
                  <p style={{ fontSize: 12, color: 'var(--ls-text-muted)', margin: '0 0 4px' }}>Click on the map to pin the exact delivery point</p>
                  <MapContainer
                    center={form.lat && form.lng ? [form.lat, form.lng] : [20.5937, 78.9629]}
                    zoom={form.lat ? 12 : 5}
                    style={{ height: "320px", borderRadius: "14px" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <LocationMarker form={form} setForm={setForm} />
                    <FlyTo lat={form.lat} lng={form.lng} />
                  </MapContainer>
                  {country && (
                    <div className="country-badge">
                      🌍 Detected Country: <strong>{country}</strong>
                    </div>
                  )}
                  {form.lat && form.lng && (
                    <div style={{ fontSize: 12, color: 'var(--ls-text-muted)', marginTop: 6 }}>
                      📌 Coordinates: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              <button className="btn-main" disabled={loading}>
                {loading ? "⏳ Submitting..." : "🩸 Submit Blood Request"}
              </button>
            </form>
          </div>

          {/* Selected bank preview */}
          {selectedBankObj && (
            <div className="req-card" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ls-text)', marginBottom: 8 }}>🏦 Selected Blood Bank</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ls-crimson)' }}>{selectedBankObj.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginTop: 4 }}>📍 {selectedBankObj.address}</div>
              <div style={{ fontSize: 13, color: 'var(--ls-text-sub)', marginTop: 2 }}>📞 {selectedBankObj.contact}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
