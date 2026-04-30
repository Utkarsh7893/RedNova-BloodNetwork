import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import 'leaflet/dist/leaflet.css';
import Navbar from "./Navbar.jsx";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function LocationMarker({ form, setForm }) {
  const [position, setPosition] = useState(
    form.lat && form.lng ? [form.lat, form.lng] : null
  );

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setForm((f) => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

const API_BASE = import.meta.env.VITE_API_URL;

export default function RequestBlood() {
  const mountRef = useRef(null);
  const messageRef = useRef(null); // ← reference to scroll

  const [form, setForm] = useState({
    requesterName: "",
    bloodGroup: "",
    units: 1,
    hospital: "",
    lat: "",
    lng: "",
  });
  const [stage, setStage] = useState("idle"); // idle → submitting → notified
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Geo location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({
        ...f,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }));
    });
  }, []);

  // Three.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      el.clientWidth / el.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xb71c1c,
      size: 0.14,
      opacity: 0.75,
      transparent: true,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let raf;
    const animate = () => {
      pts.rotation.y += 0.0007;
      pts.rotation.x += 0.0004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStage("submitting");
    setLoading(true);
    setError(null);

    try {
      const payload = {
        requesterName: form.requesterName,
        bloodGroup: form.bloodGroup,
        units: Number(form.units),
        hospital: form.hospital,
        location: { type: "Point", coordinates: [Number(form.lng), Number(form.lat)] },
      };
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit request");

      setForm({ requesterName: "", bloodGroup: "", units: 1, hospital: "", lat: form.lat, lng: form.lng });
      setStage("notified");
      setSuccess(true);
      setError(null);

      // Scroll to top message
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      setError(err.message);
      setSuccess(false);

      // Scroll to error message
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }
        .req-page { min-height: 100vh; background: var(--ls-bg); }
        .req-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .req-content { position: relative; z-index: 5; max-width: 780px; margin: 0 auto; padding: 28px 20px 80px; }
        .req-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 32px;
          box-shadow: var(--ls-shadow-lg);
        }
        .req-card h2 {
          font-family: 'Manrope', sans-serif;
          color: var(--ls-text);
          font-weight: 800;
          font-size: 24px;
          margin-bottom: 6px;
        }
        .req-label { font-weight: 600; font-size: 13px; color: var(--ls-text-sub); display: block; margin-bottom: 5px; margin-top: 14px; }
        .req-input {
          width: 100%; padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          color: var(--ls-text);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .req-input:focus { border-color: var(--ls-crimson); box-shadow: 0 0 0 3px rgba(198,40,40,0.15); }
        .req-input::placeholder { color: var(--ls-text-muted); }
        .btn-main { margin-top: 20px; width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer;
          background: var(--ls-grad-crimson); color: white; font-weight: 700; font-size: 15px;
          box-shadow: 0 10px 28px rgba(198,40,40,0.35); transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(198,40,40,0.50); }
        .btn-main:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .success-box { background: rgba(0,137,123,0.10); border: 1px solid rgba(0,137,123,0.25); color: var(--ls-teal); padding: 14px; border-radius: 12px; margin-bottom: 14px; font-weight: 600; text-align: center; }
        .error-box { background: rgba(198,40,40,0.08); border: 1px solid rgba(198,40,40,0.20); color: var(--ls-crimson); padding: 14px; border-radius: 12px; margin-bottom: 14px; font-weight: 600; text-align: center; }
        .processing-box { margin: 18px 0; padding: 16px; border-radius: 14px; text-align: center; font-weight: 600; background: rgba(198,40,40,0.06); color: var(--ls-crimson); border: 1px solid var(--ls-border); }
        .processing-box span { display: block; font-size: 13px; opacity: 0.75; margin-top: 5px; }
        .pulse { width: 14px; height: 14px; background: var(--ls-crimson); border-radius: 50%; margin: 0 auto 10px; animation: pulse 1.4s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(198,40,40,0.6); } 70% { box-shadow: 0 0 0 14px rgba(198,40,40,0); } 100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); } }
        .notify-box { margin: 18px 0; padding: 16px; border-radius: 14px; background: rgba(0,137,123,0.08); border: 1px solid var(--ls-border-alt); color: var(--ls-teal); text-align: center; font-weight: 600; }
        .notify-box span { display: block; font-size: 13px; margin-top: 5px; color: var(--ls-text-muted); }
        .leaflet-container { border-radius: 12px; margin-top: 8px; height: 300px !important; }
      `}</style>

      <div className="req-page">
        <div ref={mountRef} className="req-bg" />
        <Navbar />

        <div className="req-content">
          <div className="req-card" ref={messageRef}>
            <h2>🩸 Request Blood</h2>
            <p style={{ color: 'var(--ls-text-muted)', fontSize: 14, marginBottom: 16 }}>
              Submit an urgent blood request. Nearby donors and blood banks will be notified in real-time.
            </p>

            {stage === "submitting" && (
              <div className="processing-box">
                <div className="pulse" />
                <p style={{ margin: 0 }}>Processing your request…</p>
                <span>Notifying nearby donors &amp; blood banks</span>
              </div>
            )}
            {stage === "notified" && (
              <div className="notify-box">
                <p style={{ margin: 0 }}>✅ Request submitted successfully</p>
                <span>You may receive a response within <b>24–48 hours</b>.</span>
              </div>
            )}
            {success && <div className="success-box">Blood request submitted successfully.</div>}
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="req-label">Patient / Requester Name</label>
              <input className="req-input" name="requesterName" placeholder="Full name" value={form.requesterName} onChange={handleChange} required />

              <label className="req-label">Blood Group</label>
              <select className="req-input" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required>
                <option value="">Select</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>

              <label className="req-label">Units Required</label>
              <input className="req-input" type="number" min="1" name="units" value={form.units} onChange={handleChange} required />

              <label className="req-label">Hospital / Location</label>
              <input className="req-input" name="hospital" placeholder="Hospital name or address" value={form.hospital} onChange={handleChange} required />

              <label className="req-label">📍 Select Location on Map</label>
              <MapContainer
                center={form.lat && form.lng ? [form.lat, form.lng] : [20.5937, 78.9629]}
                zoom={5}
                style={{ height: "320px", borderRadius: "14px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <LocationMarker form={form} setForm={setForm} />
              </MapContainer>

              <button className="btn-main" disabled={loading}>
                {loading ? "Submitting..." : "🩸 Submit Blood Request"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
