import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

const IMAGES = [
  "/img/contact_1_1777551550109.png",
  "/img/contact_2_1777551565011.png",
  "/img/contact_3_1777551823453.png",
  "/img/contact_4_1777551866707.png"
];

export default function Contact() {
  const navigate = useNavigate();
  /* ================= THREE.JS BACKGROUND ================= */
  const bgRef = useRef(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaa2b2b,
      size: 0.12,
      opacity: 0.85,
      transparent: true,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    let raf;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
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
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const int = setInterval(() => {
      setCarouselIdx(p => (p + 1) % IMAGES.length);
    }, 3500);
    return () => clearInterval(int);
  }, []);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitForm = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Your message has been sent successfully!");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMsg("Failed to send message. Please try again.");
      }
    } catch {
      setErrorMsg("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .contact-page {
          min-height: 100vh;
          background: var(--ls-bg);
          position: relative;
        }

        .contact-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .contact-wrapper {
          position: relative;
          z-index: 5;
          max-width: 1100px;
          margin: 0 auto;
          padding: 36px 20px 70px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media(min-width: 900px) {
          .contact-wrapper { flex-direction: row; align-items: stretch; }
          .contact-carousel-col { flex: 1.2; }
          .contact-form-col { flex: 1; }
        }

        .contact-carousel-col {
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          min-height: 400px;
          box-shadow: var(--ls-shadow-lg);
        }

        .contact-carousel-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease;
        }
        .contact-carousel-img.active { opacity: 1; }

        .contact-overlay {
          position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
          display: flex; flex-direction: column; justify-content: flex-end; padding: 40px; color: white;
        }

        .contact-form-col {
          display: flex; flex-direction: column;
        }

        .contact-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: var(--ls-shadow-lg);
          flex: 1;
        }

        .contact-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 26px;
          color: var(--ls-text);
          margin-bottom: 6px;
        }

        .contact-subtitle {
          color: var(--ls-text-muted);
          margin-bottom: 24px;
          font-size: 14px;
        }

        .contact-info-box {
          background: rgba(0,137,123,0.06);
          border: 1px solid var(--ls-border-alt);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-info-item {
          display: flex;
          gap: 10px;
          font-size: 14px;
          color: var(--ls-text-sub);
          align-items: center;
        }

        .contact-info-item a {
          color: var(--ls-teal);
          font-weight: 500;
        }
        .contact-info-item a:hover { text-decoration: underline; }

        .form-label {
          font-weight: 600;
          font-size: 13px;
          color: var(--ls-text-sub);
          display: block;
          margin-bottom: 5px;
        }

        .btn-main {
          margin-top: 16px;
          padding: 14px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          width: 100%;
          background: var(--ls-grad-crimson);
          color: white;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 10px 28px rgba(198,40,40,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .btn-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(198,40,40,0.50);
        }
        .btn-main:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .whatsapp-float {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25d366, #1ebe57);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(37,211,102,0.50);
          transition: all 0.3s ease;
          animation: waPulse 3s infinite;
        }
        .whatsapp-float:hover {
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 18px 40px rgba(37,211,102,0.70);
        }
        @keyframes waPulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
          70%  { box-shadow: 0 0 0 18px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        @keyframes ls-spin {
          to { transform: rotate(360deg); }
        }
        .ls-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ls-spin 0.8s linear infinite;
          display: inline-block;
        }
      `}</style>

      <div className="contact-page">
        <div ref={bgRef} className="contact-bg" />
        <Navbar />

        <div className="contact-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
              ←
            </button>
            <h2 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: 'var(--ls-text)' }}>Contact Us</h2>
          </div>
          {/* Carousel Column */}
          <div className="contact-carousel-col">
            {IMAGES.map((img, idx) => (
              <img key={img} src={img} className={`contact-carousel-img ${idx === carouselIdx ? 'active' : ''}`} alt="Community Impact" />
            ))}
            <div className="contact-overlay">
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '28px', marginBottom: '8px' }}>Global Impact</h2>
              <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '500px', margin: 0 }}>
                Donating blood is more than just a medical contribution. It's a commitment to our global community, advancing Sustainable Development Goals like Zero Hunger, Climate Action, and Good Health for All.
              </p>
            </div>
          </div>

          <div className="contact-form-col">
            <div className="contact-card">
              <h3 className="contact-title">📬 Contact lifeStream</h3>
              <p className="contact-subtitle">
                We're here to help. Reach out for support, partnerships, or urgent assistance.
              </p>

              <div className="contact-info-box">
                <div className="contact-info-item">🏢 123 Donation Street, Health City</div>
                <div className="contact-info-item">📩 support@lifestream.org</div>
                <div className="contact-info-item">📞 +91 123 456 7890</div>
                <div className="contact-info-item">⏰ Mon – Sat, 9 AM – 7 PM</div>
              </div>

              {successMsg && <div className="alert alert-success">{successMsg}</div>}
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={submitForm}>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Full Name</label>
                  <input className="ls-input" name="name" placeholder="Your full name" required value={form.name} onChange={update} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Email Address</label>
                  <input className="ls-input" name="email" type="email" placeholder="your@email.com" required value={form.email} onChange={update} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Subject</label>
                  <input className="ls-input" name="subject" placeholder="How can we help?" required value={form.subject} onChange={update} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <label className="form-label">Message</label>
                  <textarea className="ls-input" rows="5" name="message" placeholder="Your message..." required value={form.message} onChange={update} style={{ resize: 'vertical', minHeight: 100 }} />
                </div>
                <button type="submit" className="btn-main" disabled={isLoading}>
                  {isLoading ? <><span className="ls-spinner" style={{ marginRight: 8 }}></span> Sending...</> : "📤 Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <a
          href="https://wa.me/9219369399?text=Hello%20BloodCare,%20I%20need%20assistance."
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float"
        >
          <span className="whatsapp-tooltip">Chat with us</span>
          💬
        </a>
      </div>
      
    </>
  );
}
