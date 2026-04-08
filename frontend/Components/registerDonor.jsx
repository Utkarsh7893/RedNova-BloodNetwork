import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
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
          font-family: Inter, system-ui, -apple-system, Roboto;
          background:
            radial-gradient(circle at top left, rgba(255,180,180,0.35), transparent 45%),
            linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
        }
        .donor-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .donor-content {
          position: relative;
          z-index: 5;
          max-width: 1080px;
          margin: auto;
          padding: 40px 40px 100px; /* reduced top spacing */
        }
        .donor-card {
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.85),
            rgba(255,240,240,0.65)
          );
          backdrop-filter: blur(14px);
          border-radius: 32px;
          padding: 50px 60px;
          position: relative;
          box-shadow: 0 28px 80px rgba(183,28,28,0.35);
          margin-bottom: 40px;
          border: 1px solid rgba(255,255,255,0.5);
          transition: box-shadow 0.3s ease;
        }
        .donor-card:hover { box-shadow: 0 0 48px rgba(183,28,28,0.45); }
        .donor-card h3 { color: #b71c1c; font-weight: 800; margin-bottom: 8px; }
        input, select, textarea { width: 100%; padding: 14px 16px; border-radius: 14px; border: 1px solid #e2c0c0; margin-top: 8px; font-size: 14px; background: white; color: #333; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #b71c1c; box-shadow: 0 0 0 2px rgba(183,28,28,0.15); }
        .btn-main { margin-top: 24px; width: 100%; padding: 16px; border-radius: 16px; border: none; cursor: pointer; background: linear-gradient(135deg, #b71c1c, #ff6b6b); color: white; font-weight: 800; letter-spacing: 0.3px; box-shadow: 0 16px 40px rgba(183,28,28,0.45); transition: all 0.3s ease; }
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 24px 60px rgba(183,28,28,0.65); }
        .bloodTag { padding: 10px 20px; border-radius: 16px; background: #b71c1c; color: white; font-weight: 700; font-size: 18px; }
        .leaflet-container { border-radius: 16px; height: 350px; margin-top: 8px; }
      `}</style>

      <div className="donor-page">
        <div ref={mountRef} className="donor-bg" />

        <div className="donor-content">
          <div className="donor-card" ref={messageRef}>
            <h3>Register as Donor</h3>
            <p style={{ color: "#555", marginBottom: "16px" }}>Your contribution may save someone’s life.</p>

            {successMsg && <div style={{ color: "#2e7d32", fontWeight: 600, marginBottom: "12px" }}>{successMsg}</div>}
            {errorMsg && <div style={{ color: "#b71c1c", fontWeight: 600, marginBottom: "12px" }}>{errorMsg}</div>}

            <form onSubmit={submitForm}>
              <div className="row g-3">
                <div className="col-md-6"><label>Full Name</label><input type="text" name="name" value={form.name} onChange={update} required/></div>
                <div className="col-md-6"><label>Blood Group</label><select name="bloodGroup" value={form.bloodGroup} onChange={update} required><option value="">Select</option>{bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                <div className="col-md-4"><label>Age</label><input type="number" name="age" value={form.age} onChange={update} required/></div>
                <div className="col-md-4"><label>Gender</label><select name="gender" value={form.gender} onChange={update}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div className="col-md-4"><label>Last Donation</label><input type="date" name="lastDonation" value={form.lastDonation} onChange={update}/></div>
                <div className="col-md-6"><label>Phone</label><input type="text" name="phone" value={form.phone} onChange={update} required/></div>
                <div className="col-md-6"><label>Email</label><input type="email" name="email" value={form.email} onChange={update}/></div>
                <div className="col-md-6"><label>City</label><input type="text" name="city" value={form.city} onChange={update} required/></div>
                <div className="col-md-6"><label>State</label><input type="text" name="state" value={form.state} onChange={update} required/></div>

                {/* Leaflet Map */}
                <div className="col-12">
                  <label>Select Your Location</label>
                  <MapContainer center={form.lat && form.lng ? [form.lat, form.lng] : [20.5937, 78.9629]} zoom={5} className="leaflet-container">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
                    <LocationMarker form={form} setForm={setForm} />
                  </MapContainer>
                </div>

                <div className="col-12">
                  <label>Health Information</label>
                  <textarea name="healthInfo" rows={4} value={form.healthInfo} onChange={update} placeholder="Health notes, allergies, medications..." />
                </div>
              </div>

              <button type="submit" className="btn-main">Submit Registration</button>
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
