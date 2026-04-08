import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import 'leaflet/dist/leaflet.css';
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
        .req-page { min-height: 100vh; font-family: Inter, system-ui, Roboto;
          background: radial-gradient(circle at top left, rgba(255,180,180,0.35), transparent 45%),
                      linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
        }
        .req-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .req-content { position: relative; z-index: 5; max-width: 1100px; margin: auto; padding: 50px 30px 80px; }
        .req-card { position: relative; background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,220,220,0.55));
          backdrop-filter: blur(14px); border-radius: 24px; padding: 50px 50px 60px; box-shadow: 0 28px 90px rgba(0,0,0,0.25);
        }
        .req-card::before { content: ""; position: absolute; inset: -16px; border-radius: 28px;
          background: radial-gradient(circle at top, rgba(183,28,28,0.2), transparent 60%); filter: blur(32px); z-index: -1;
        }
        .req-card h2 { color: #b71c1c; font-weight: 800; font-size: 32px; margin-bottom: 12px; }
        label { font-weight: 600; margin-top: 16px; display: block; }
        input, select { width: 100%; padding: 14px 16px; border-radius: 14px; border: 1px solid #e2c0c0; margin-top: 8px; font-size: 15px; transition: all 0.2s ease; }
        input:focus, select:focus { outline: none; border-color: #b71c1c; box-shadow: 0 0 0 3px rgba(183,28,28,0.15); }
        .btn-main { margin-top: 28px; width: 100%; padding: 16px; border-radius: 16px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #b71c1c, #ff6b6b); color: white; font-weight: 800; font-size: 16px; letter-spacing: 0.4px; box-shadow: 0 16px 42px rgba(183,28,28,0.45); transition: all 0.3s ease;
        }
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 24px 60px rgba(183,28,28,0.65); }
        .btn-main:active { transform: scale(0.97); }
        .success-box { background: #e8f5e9; color: #2e7d32; padding: 16px; border-radius: 14px; margin-bottom: 18px; font-weight: 600; text-align: center; }
        .error-box { background: #fdecea; color: #b71c1c; padding: 16px; border-radius: 14px; margin-bottom: 18px; font-weight: 600; text-align: center; }
        .processing-box, .notify-box { margin: 22px 0 28px; padding: 20px; border-radius: 16px; text-align: center; font-weight: 600; }
        .processing-box { background: rgba(255, 240, 240, 0.9); color: #b71c1c; }
        .processing-box span { display: block; font-size: 14px; opacity: 0.85; margin-top: 6px; }
        .pulse { width: 16px; height: 16px; background: #b71c1c; border-radius: 50%; margin: 0 auto 12px; animation: pulse 1.4s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(183,28,28,0.6); } 70% { box-shadow: 0 0 0 16px rgba(183,28,28,0); } 100% { box-shadow: 0 0 0 0 rgba(183,28,28,0); } }
        .notify-box { background: linear-gradient(135deg, rgba(232,245,233,0.95), rgba(200,230,201,0.85)); color: #2e7d32; }
        .notify-box span { display: block; font-size: 14px; margin-top: 6px; }
        .react-leaflet-container { border-radius: 14px; margin-top: 8px; box-shadow: 0 10px 36px rgba(0,0,0,0.18); }
      `}</style>

      <div className="req-page">
        <div ref={mountRef} className="req-bg" />

        <div className="req-content">
          <div className="req-card" ref={messageRef}>
            <h2>Request Blood</h2>

            {stage === "submitting" && (
              <div className="processing-box">
                <div className="pulse" />
                <p>Processing your blood request…</p>
                <span>Notifying nearby donors & blood banks</span>
              </div>
            )}

            {stage === "notified" && (
              <div className="notify-box">
                <p>✅ Request submitted successfully</p>
                <span>
                  Donors and blood banks will be notified.<br />
                  You may receive a response within <b>24–48 hours</b>.
                </span>
              </div>
            )}

            {success && <div className="success-box">Blood request submitted successfully.</div>}
            {error && <div className="error-box">{error}</div>}

            <p className="text-muted">
              Submit an urgent blood request. Nearby donors and blood banks will be notified in real-time.
            </p>

            <form onSubmit={handleSubmit}>
              <label>Patient / Requester Name</label>
              <input name="requesterName" value={form.requesterName} onChange={handleChange} required />

              <label>Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required>
                <option value="">Select</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>

              <label>Units Required</label>
              <input type="number" min="1" name="units" value={form.units} onChange={handleChange} required />

              <label>Hospital / Location</label>
              <input name="hospital" value={form.hospital} onChange={handleChange} required />

              <label>Select Location on Map</label>
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
