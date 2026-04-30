import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import Navbar from "./Navbar.jsx";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Component to handle map click
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

export default function DonorRegister() {
  const mountRef = useRef(null);
  const messageRef = useRef(null); // Scroll ref
  const navigate = useNavigate();

  // --------------------
  // THREE.JS BACKGROUND
  // --------------------
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
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    const count = 160;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xb71c1c,
      size: 0.12,
      opacity: 0.75,
      transparent: true,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let raf;
    const animate = () => {
      pts.rotation.y += 0.0006;
      pts.rotation.x += 0.0003;
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

  // --------------------
  // FORM HANDLING
  // --------------------
  const [form, setForm] = useState({
    name: "",
    bloodGroup: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    lastDonation: "",
    lat: "",
    lng: "",
    healthInfo: ""
  });

  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitForm = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const lng = parseFloat(form.lng);
      const lat = parseFloat(form.lat);
      if (!lat || !lng) {
        setErrorMsg("Please select your location on the map.");
        return;
      }

      const body = { ...form, location: { type: "Point", coordinates: [lng, lat] } };
      const res = await fetch(`${API_BASE}/api/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Donor Registered Successfully!");
        setForm({
          name: "",
          bloodGroup: "",
          age: "",
          gender: "",
          phone: "",
          email: "",
          city: "",
          state: "",
          lastDonation: "",
          lat: "",
          lng: "",
          healthInfo: ""
        });

        // Scroll to top of the form/card
        if (messageRef.current) {
          messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } else setErrorMsg("Registration failed.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error. Try again.");
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }
        .donor-page {
          min-height: 100vh;
          background: var(--ls-bg);
        }
        .donor-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .donor-content {
          position: relative;
          z-index: 5;
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 20px 80px;
        }
        .donor-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: var(--ls-shadow-lg);
        }
        .donor-card h3 {
          font-family: 'Manrope', sans-serif;
          color: var(--ls-text);
          font-weight: 800;
          font-size: 22px;
          margin-bottom: 6px;
        }
        .donor-card p { color: var(--ls-text-sub); font-size: 14px; }
        .rd-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--ls-text-sub);
          margin-bottom: 5px;
        }
        .rd-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          color: var(--ls-text);
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          margin-top: 0;
        }
        .rd-input:focus {
          border-color: var(--ls-crimson);
          box-shadow: 0 0 0 3px rgba(198,40,40,0.15);
        }
        .rd-input::placeholder { color: var(--ls-text-muted); }
        .btn-main {
          margin-top: 20px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          background: var(--ls-grad-crimson);
          color: white;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 10px 28px rgba(198,40,40,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(198,40,40,0.50); }
        .bloodTag { padding: 10px 20px; border-radius: 12px; background: var(--ls-grad-crimson); color: white; font-weight: 800; font-size: 18px; }
        .leaflet-container { border-radius: 14px; height: 320px; margin-top: 6px; }
      `}</style>

      <div className="donor-page">
        <div ref={mountRef} className="donor-bg" />
        <Navbar />

        <div className="donor-content">
          <div className="donor-card" ref={messageRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-bg-alt)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
                ←
              </button>
              <h3 style={{ margin: 0 }}>Register as a Donor</h3>
            </div>
            <p style={{ marginBottom: "16px" }}>Your contribution may save someone's life. Fill in the details below.</p>

            {successMsg && <div style={{ color: "#2e7d32", fontWeight: 600, marginBottom: "12px" }}>{successMsg}</div>}
            {errorMsg && <div style={{ color: "#b71c1c", fontWeight: 600, marginBottom: "12px" }}>{errorMsg}</div>}

            <form onSubmit={submitForm}>
              <div className="row g-3">
                <div className="col-md-6"><label className="rd-label">Full Name</label><input className="rd-input" type="text" name="name" placeholder="Your full name" value={form.name} onChange={update} required/></div>
                <div className="col-md-6"><label className="rd-label">Blood Group</label><select className="rd-input" name="bloodGroup" value={form.bloodGroup} onChange={update} required><option value="">Select group</option>{bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                <div className="col-md-4"><label className="rd-label">Age</label><input className="rd-input" type="number" name="age" placeholder="25" value={form.age} onChange={update} required/></div>
                <div className="col-md-4"><label className="rd-label">Gender</label><select className="rd-input" name="gender" value={form.gender} onChange={update}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div className="col-md-4"><label className="rd-label">Last Donation Date</label><input className="rd-input" type="date" name="lastDonation" value={form.lastDonation} onChange={update}/></div>
                <div className="col-md-6"><label className="rd-label">Phone</label><input className="rd-input" type="text" name="phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={update} required/></div>
                <div className="col-md-6"><label className="rd-label">Email</label><input className="rd-input" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={update}/></div>
                <div className="col-md-6"><label className="rd-label">City</label><input className="rd-input" type="text" name="city" placeholder="Mumbai" value={form.city} onChange={update} required/></div>
                <div className="col-md-6"><label className="rd-label">State</label><input className="rd-input" type="text" name="state" placeholder="Maharashtra" value={form.state} onChange={update} required/></div>

                <div className="col-12">
                  <label className="rd-label">📍 Select Your Location on Map</label>
                  <MapContainer center={form.lat && form.lng ? [form.lat, form.lng] : [20.5937, 78.9629]} zoom={5} className="leaflet-container">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
                    <LocationMarker form={form} setForm={setForm} />
                  </MapContainer>
                  <div style={{ fontSize: 12, color: 'var(--ls-text-muted)', marginTop: 6 }}>Click on the map to pin your location</div>
                </div>

                <div className="col-12">
                  <label className="rd-label">Health Information (optional)</label>
                  <textarea className="rd-input" name="healthInfo" rows={3} value={form.healthInfo} onChange={update} placeholder="Health notes, allergies, medications..." style={{ resize: 'vertical' }}/>
                </div>
              </div>

              <button type="submit" className="btn-main">✅ Submit Registration</button>
            </form>
          </div>

          {/* Donor Preview */}
          {(form.name || form.city || form.bloodGroup) && (
            <div className="donor-card">
              <h4 style={{ color: "#b71c1c", fontWeight: 700 }}>Donor Preview</h4>
              <p style={{ color: "#555" }}>This is how your profile will look.</p>

              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 style={{ fontWeight: 700 }}>{form.name || "Full Name"}</h5>
                  <div style={{ color: "#555" }}>{form.age || "--"} yrs • {form.gender || "--"}</div>
                  <div style={{ fontSize: "0.9rem", color: "#777" }}>{form.city || "--"}, {form.state || "--"}</div>
                  <div style={{ fontSize: "0.9rem" }}>Last donated: {form.lastDonation ? new Date(form.lastDonation).toLocaleDateString() : "--"}</div>
                  <div style={{ fontSize: "0.9rem", marginTop: 6, color: "#555" }}>Phone: {form.phone || "--"}</div>
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>Email: {form.email || "--"}</div>
                  <div style={{ fontSize: "0.9rem", marginTop: 6 }}><strong>Health Info:</strong> {form.healthInfo || "--"}</div>
                </div>
                <div className="col-md-4 d-flex justify-content-center align-items-center">
                  <div className="bloodTag">{form.bloodGroup || "BG"}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
