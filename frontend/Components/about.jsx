import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import Navbar from "./Navbar.jsx";
import { useTheme } from '../src/ThemeContext.jsx';

const COMPANY_NAME = "lifeStream";

export default function AboutPage() {
  const mountRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const CAROUSEL_IMGS = ['/img/about_1.png', '/img/about_2.png', '/img/about_3.png'];
  const [cIdx, setCIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCIdx(i => (i + 1) % CAROUSEL_IMGS.length), 4500);
    return () => clearInterval(id);
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
    renderer.setPixelRatio(window.devicePixelRatio || 1);
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
    const mat = new THREE.PointsMaterial({ color: 0xaa2b2b, size: 0.1, opacity: 0.7, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    let raf;
    const animate = () => { pts.rotation.y += 0.0004; pts.rotation.x += 0.0002; renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
    animate();
    const resize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); renderer.dispose(); };
  }, []);

  const features = [
    { icon: "📡", title: "Real-Time Tracking", desc: "Instantly track available donors and blood stock across hospitals in your network." },
    { icon: "🏥", title: "Hospital Integration", desc: "Monitor demand across multiple hospitals to allocate resources where needed most." },
    { icon: "🔔", title: "Smart Alerts", desc: "Automated notifications based on demand, donor eligibility, and emergency needs." },
    { icon: "🛡️", title: "Verified Donations", desc: "Every donor undergoes screening to guarantee safe and contamination-free blood supply." },
    { icon: "📊", title: "Data Insights", desc: "Analyze trends, predict shortages, and optimize distribution with actionable data." },
    { icon: "🤝", title: "Community Network", desc: "Connect donors, hospitals, and organizations to build a sustainable donor ecosystem." },
  ];

  const stats = [
    { value: "3+", label: "Lives per Donation" },
    { value: "24/7", label: "Emergency Support" },
    { value: "100%", label: "Verified Donors" },
    { value: "5 min", label: "Alert Response" },
  ];

  const donationFacts = [
    { icon: "🏨", text: "Emergency surgeries & trauma care" },
    { icon: "🎗️", text: "Cancer & chemotherapy patients" },
    { icon: "🤰", text: "Maternity & childbirth support" },
    { icon: "💊", text: "Chronic illness management" },
    { icon: "🌍", text: "Disaster & epidemic relief" },
    { icon: "❤️", text: "Community health security" },
  ];

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; }
        .abt-page { min-height: 100vh; position: relative; background: var(--ls-bg); }
        .abt-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .abt-wrap { position: relative; z-index: 5; max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }

        .abt-hero {
          text-align: center;
          padding: 40px 20px 32px;
          margin-bottom: 28px;
        }
        .abt-hero h1 {
          font-family: 'Manrope', sans-serif;
          font-weight: 900;
          font-size: clamp(28px, 5vw, 42px);
          letter-spacing: -0.03em;
          background: var(--ls-grad-crimson);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .abt-hero p {
          color: var(--ls-text-sub);
          font-size: 15px;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .abt-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px);
          border: 1px solid var(--ls-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--ls-shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .abt-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--ls-shadow-md);
        }

        .abt-section-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--ls-text);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .abt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
        .abt-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 28px; }
        .abt-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }

        @media (max-width: 768px) {
          .abt-grid { grid-template-columns: repeat(2, 1fr); }
          .abt-grid-2 { grid-template-columns: 1fr; }
          .abt-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .abt-grid { grid-template-columns: 1fr; }
        }

        .abt-carousel {
          position: relative;
          width: 100%;
          height: 320px;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .abt-carousel img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 1s ease;
        }
        .abt-carousel img.active { opacity: 1; }
        .abt-carousel-dots {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .abt-carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .abt-carousel-dot.active {
          background: #fff;
          transform: scale(1.3);
        }
        @media (max-width: 768px) {
          .abt-carousel { height: 200px; }
        }
      `}</style>

      <div className="abt-page">
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${isDark ? '/img/dash_bg_dark.png' : '/img/dash_bg_light.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6, mixBlendMode: 'luminosity', transition: 'all 1s' }} />
        <div className="abt-bg" ref={mountRef} />
        <Navbar />

        <div className="abt-wrap">

          {/* Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>←</button>
          </div>

          {/* Hero */}
          <div className="abt-hero">
            <h1>🩸 {COMPANY_NAME}</h1>
            <p>A technology-driven platform transforming blood donation, monitoring, and distribution. Real-time coordination. Verified donors. Lives saved.</p>
          </div>

          {/* Carousel */}
          <div className="abt-carousel">
            {CAROUSEL_IMGS.map((src, i) => (
              <img key={i} src={src} className={i === cIdx ? 'active' : ''} alt={`About ${i + 1}`} />
            ))}
            <div className="abt-carousel-dots">
              {CAROUSEL_IMGS.map((_, i) => (
                <button key={i} className={`abt-carousel-dot${i === cIdx ? ' active' : ''}`} onClick={() => setCIdx(i)} />
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="abt-grid-4" style={{ marginBottom: 32 }}>
            {stats.map((s, i) => (
              <div key={i} className="abt-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ls-crimson)', fontFamily: "'Manrope', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ls-text-sub)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* What We Do */}
          <div className="abt-section-title">⚡ What We Do</div>
          <div className="abt-grid">
            {features.map((f, i) => (
              <div key={i} className="abt-card">
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ls-text)', marginBottom: 6, fontFamily: "'Manrope', sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ls-text-sub)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Why Donate */}
          <div className="abt-section-title">💉 Why Blood Donation Matters</div>
          <div className="abt-grid-2">
            <div className="abt-card" style={{ padding: 24 }}>
              <p style={{ color: 'var(--ls-text-sub)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Blood cannot be manufactured—it depends entirely on donors. Every donation can save <strong style={{ color: 'var(--ls-text)' }}>up to 3 lives</strong> and supports emergency surgeries, cancer treatments, maternity care, and disaster relief.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {donationFacts.map((d, i) => (
                <div key={i} className="abt-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ls-text-sub)' }}>{d.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Highlight */}
          <div className="abt-card" style={{ background: 'var(--ls-grad-crimson)', padding: '28px 24px', textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6, fontFamily: "'Manrope', sans-serif" }}>🎁 First-Time Donor Appreciation</div>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: '0 0 16px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Your first donation earns you a special appreciation gift, fresh fruits, and an energy drink. Start your lifesaving journey today.
            </p>
            <Link to="/registerdonor" style={{ display: 'inline-block', background: '#fff', color: '#b71c1c', fontWeight: 800, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              ➕ Register as Donor
            </Link>
          </div>

          {/* Benefits & Responsibilities */}
          <div className="abt-section-title">📋 Quick Facts</div>
          <div className="abt-grid-2" style={{ marginBottom: 28 }}>
            <div className="abt-card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#22c55e', marginBottom: 10 }}>✅ Benefits</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ls-text-sub)', lineHeight: 2 }}>
                <li>Saves up to 3 lives per donation</li>
                <li>Improves cardiovascular health</li>
                <li>Free health screening every time</li>
                <li>Builds community responsibility</li>
              </ul>
            </div>
            <div className="abt-card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#f59e0b', marginBottom: 10 }}>⚠️ Things to Know</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ls-text-sub)', lineHeight: 2 }}>
                <li>Mild fatigue possible — temporary</li>
                <li>Stay hydrated after donating</li>
                <li>Age 18–65, min weight ~50 kg</li>
                <li>Safe donation intervals tracked</li>
              </ul>
            </div>
          </div>

          {/* Join Network */}
          <div className="abt-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ls-text)', fontFamily: "'Manrope', sans-serif", marginBottom: 6 }}>🌐 Join the Lifesaving Network</div>
            <p style={{ color: 'var(--ls-text-sub)', fontSize: 13, maxWidth: 500, margin: '0 auto 16px', lineHeight: 1.6 }}>
              Become a regular donor with {COMPANY_NAME}. Together, we ensure no patient suffers due to lack of blood.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--ls-bg-alt)', border: '1px solid var(--ls-border)', color: 'var(--ls-text)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                🏠 Dashboard
              </Link>
              <Link to="/donors" style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--ls-bg-alt)', border: '1px solid var(--ls-border)', color: 'var(--ls-text)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                🤝 Find Donors
              </Link>
              <Link to="/contact" style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--ls-bg-alt)', border: '1px solid var(--ls-border)', color: 'var(--ls-text)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                ✉️ Contact Us
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
