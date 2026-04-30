import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useTheme } from "../src/ThemeContext.jsx";

const STATS = [
  { value: "Every 2 sec", label: "Someone needs blood" },
  { value: "3 lives", label: "Saved per donation" },
  { value: "38%", label: "Population eligible" },
  { value: "1 unit", label: "Can help 3 patients" },
];

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

// ECG path that looks like a heartbeat waveform
const ECG_PATH = "M0,30 L20,30 L25,10 L30,50 L35,5 L42,55 L48,30 L60,30 L80,30 L85,10 L90,50 L95,5 L102,55 L108,30 L120,30";

export default function FrontPage() {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();
  const [pageVisible, setPageVisible] = useState(false);
  const [selectedBlood, setSelectedBlood] = useState(null);
  const navigate = useNavigate();

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setPageVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Three.js scene
  useEffect(() => {
    let mounted = true;
    let heartMesh = null;
    let limeGlow = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let drops = null;

    (async () => {
      if (!mounted) return;
      const container = mountRef.current;
      if (!container) return;

      while (container.firstChild) {
        try { container.firstChild.remove(); } catch (e) {}
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      // Dark: deep navy, Light: clean off-white
      scene.background = new THREE.Color(isDark ? "#0D1B2A" : "#F0F4F8");

      camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 1.5, 6);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 1.1));
      const glowLight = new THREE.PointLight(isDark ? 0xff2020 : 0xC62828, 6, 22);
      glowLight.position.set(0, 0, 6);
      scene.add(glowLight);

      // Floating particles (blood drops)
      const dropGeom = new THREE.SphereGeometry(0.05, 8, 8);
      const dropMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0xEF5350 : 0xC62828,
        emissive: isDark ? 0x550000 : 0x330000,
        emissiveIntensity: 0.2,
      });

      drops = new THREE.Group();
      for (let i = 0; i < 260; i++) {
        const p = new THREE.Mesh(dropGeom, dropMat);
        const x = Math.random() * 14 - 7;
        const y = Math.random() * 10 - 5;
        const z = Math.random() * 8 - 4;
        p.basePos = { x, y, z };
        p.position.set(x, y, z);
        p.userData.wave = Math.random() * Math.PI * 2;
        drops.add(p);
      }
      scene.add(drops);

      // Load heart model
      const loader = new GLTFLoader();
      const baseScale = 1.9;

      loader.load(
        "/models/human_heart.glb",
        (gltf) => {
          if (!mounted) return;
          heartMesh = gltf.scene;
          heartMesh.scale.set(baseScale, baseScale, baseScale);
          heartMesh.position.set(0, 1.1, 0);
          scene.add(heartMesh);

          // Teal/green glow on heart (healthcare feel)
          limeGlow = new THREE.PointLight(isDark ? 0x00C9B1 : 0x00897B, 3.2, 6);
          limeGlow.position.set(0, 0.9, 0.9);
          scene.add(limeGlow);
        },
        undefined,
        (err) => console.error("Heart model error:", err)
      );

      // Animation loop
      let glowFrame = 0;
      const animate = () => {
        glowFrame += 0.035;
        const beat = Math.abs(Math.sin(glowFrame * 1.6));

        if (heartMesh) {
          heartMesh.scale.set(
            baseScale + beat * 0.12,
            baseScale + beat * 0.14,
            baseScale + beat * 0.12
          );
          if (limeGlow) limeGlow.intensity = 3.2 + beat * 2.5;
        }

        if (drops) {
          drops.children.forEach((p) => {
            p.position.x = p.basePos.x + Math.sin(glowFrame * 0.12 + p.userData.wave) * 0.8;
            p.position.y = p.basePos.y + Math.sin(glowFrame * 0.18 + p.userData.wave) * 0.5;
            p.position.z = p.basePos.z + Math.cos(glowFrame * 0.15 + p.userData.wave) * 0.6;
          });
        }

        renderer.render(scene, camera);
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);
    })();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      const container = mountRef.current;
      if (container) {
        while (container.firstChild) {
          try { container.firstChild.remove(); } catch (e) {}
        }
      }
      window.removeEventListener("resize", () => {});
    };
  }, [isDark]);

  return (
    <>
      <style>{`
        @keyframes ecg-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes ls-pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(198,40,40,0.55); }
          50%      { box-shadow: 0 0 0 14px rgba(198,40,40,0); }
        }
        @keyframes ls-fade-up {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float-badge {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }

        /* 
          1. Mobile & Tablet Optimization 
        */
        .front-wrapper {
          min-height: 100vh;
          width: 100vw;
          overflow-x: hidden;
          background: url('/img/front_blood_bg_1777551469033.png') center/cover no-repeat fixed;
          background-color: var(--ls-bg); /* fallback */
          font-family: Inter, system-ui, Roboto;
        }

        /* The translucent overlay that makes the background look glassmorphic */
        .front-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px) saturate(120%);
          z-index: 0;
          pointer-events: none;
        }

        .canvas-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1; /* Above the overlay, below content */
          pointer-events: none;
        }

        .hero-page {
          width: 100%;
          height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: opacity 0.7s ease;
          z-index: 2;
        }

        /* ── Top bar ── */
        .hero-topbar {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 36px;
        }
        .hero-brand {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -0.04em;
          background: var(--ls-grad-crimson);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
        }
        .hero-topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hero-topbar-btn {
          padding: 8px 20px;
          border-radius: 10px;
          border: 1.5px solid rgba(198,40,40,0.35);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          color: var(--ls-text);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .hero-topbar-btn:hover {
          background: rgba(198,40,40,0.12);
          border-color: var(--ls-crimson);
          color: var(--ls-crimson);
        }
        .hero-theme-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1.5px solid rgba(198,40,40,0.25);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--ls-text);
        }
        .hero-theme-btn:hover {
          background: rgba(198,40,40,0.12);
          border-color: var(--ls-crimson);
          transform: scale(1.08);
        }

        /* ── Main content layout ── */
        .hero-body {
          flex: 1;
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 0 36px;
          gap: 32px;
          max-width: 1300px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Left panel ── */
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: ls-fade-up 0.7s ease both;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 30px;
          background: rgba(198,40,40,0.10);
          border: 1px solid rgba(198,40,40,0.22);
          color: var(--ls-crimson);
          font-weight: 600;
          font-size: 13px;
          width: fit-content;
        }
        .hero-h1 {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(32px, 4.5vw, 58px);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.04em;
          color: var(--ls-text);
          margin: 0;
        }
        .hero-h1 .accent {
          background: var(--ls-grad-crimson);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(14px, 1.8vw, 18px);
          color: var(--ls-text-sub);
          line-height: 1.6;
          margin: 0;
          max-width: 460px;
        }
        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .hero-cta-primary {
          padding: 14px 32px;
          border-radius: 14px;
          border: none;
          background: var(--ls-grad-crimson);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 28px rgba(198,40,40,0.40);
          animation: ls-pulse-ring 2.2s ease-in-out infinite;
        }
        .hero-cta-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(198,40,40,0.55);
          color: #fff;
        }
        .hero-cta-secondary {
          padding: 13px 28px;
          border-radius: 14px;
          border: 2px solid rgba(198,40,40,0.35);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          color: var(--ls-crimson);
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .hero-cta-secondary:hover {
          background: rgba(198,40,40,0.10);
          border-color: var(--ls-crimson);
          transform: translateY(-2px);
          color: var(--ls-crimson);
        }

        /* ── Right panel — floating glass cards ── */
        .hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          animation: ls-fade-up 0.7s 0.2s ease both;
        }
        .hero-glass-card {
          background: var(--ls-surface);
          backdrop-filter: blur(18px) saturate(150%);
          -webkit-backdrop-filter: blur(18px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 18px;
          padding: 18px 22px;
          box-shadow: var(--ls-shadow-md);
          width: 100%;
          max-width: 340px;
        }
        .hero-quote {
          font-size: 14px;
          line-height: 1.65;
          color: var(--ls-text-sub);
          font-style: italic;
        }
        .hero-blood-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        .hero-blood-chip {
          padding: 8px 4px;
          border-radius: 10px;
          text-align: center;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.18s ease;
          background: rgba(198,40,40,0.08);
          color: var(--ls-crimson);
        }
        .hero-blood-chip:hover,
        .hero-blood-chip.selected {
          background: var(--ls-grad-crimson);
          color: #fff;
          border-color: transparent;
          transform: scale(1.06);
          box-shadow: 0 6px 18px rgba(198,40,40,0.35);
        }
        .hero-stat-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .hero-stat-chip {
          background: rgba(0,137,123,0.08);
          border: 1px solid rgba(0,137,123,0.18);
          border-radius: 12px;
          padding: 10px 12px;
          text-align: center;
        }
        .hero-stat-val {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: var(--ls-teal);
        }
        .hero-stat-lbl {
          font-size: 11px;
          color: var(--ls-text-muted);
          margin-top: 2px;
        }

        /* ── ECG strip at bottom ── */
        .hero-ecg-strip {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          overflow: hidden;
          z-index: 15;
          opacity: 0.55;
        }
        .hero-ecg-inner {
          display: flex;
          white-space: nowrap;
          animation: ecg-scroll 3.5s linear infinite;
        }
        .hero-ecg-svg {
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-page {
            height: auto;
            min-height: 100vh;
          }
          .hero-canvas {
            position: absolute;
            height: 100vh;
            opacity: 0.3;
          }
          .hero-body {
            grid-template-columns: 1fr;
            padding: 0 20px;
            gap: 20px;
          }
          .hero-topbar { padding: 14px 20px; }
          .hero-left { padding-top: 30px; }
          .hero-right { align-items: center; padding-bottom: 80px; }
          .hero-glass-card { max-width: 100%; }
          .hero-h1 { font-size: clamp(28px, 7vw, 38px); }
          .hero-ecg-strip { position: relative; }
        }
        @media (max-width: 480px) {
          .hero-brand { font-size: 20px; }
          .hero-topbar-btn { display: none; }
          .hero-left { padding-top: 20px; }
          .hero-sub { font-size: 14px; }
          .hero-actions { flex-direction: column; }
          .hero-cta-primary, .hero-cta-secondary { width: 100%; justify-content: center; }
        }
      `}</style>

      <div
        className="hero-page"
        style={{ opacity: pageVisible ? 1 : 0, background: 'var(--ls-bg)' }}
      >
        {/* THREE.js canvas */}
        <div className="hero-canvas" ref={mountRef} />

        {/* Top bar */}
        <div className="hero-topbar">
          <span className="hero-brand">lifeStream 🩸</span>
          <div className="hero-topbar-actions">
            <button className="hero-theme-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="hero-topbar-btn">Sign In</Link>
            <Link to="/login" className="hero-topbar-btn" style={{ background: 'var(--ls-grad-crimson)', color: '#fff', border: 'none', boxShadow: '0 6px 18px rgba(198,40,40,0.35)' }}>
              Get Started
            </Link>
          </div>
        </div>

        {/* Main hero body */}
        <div className="hero-body">
          {/* Left: copy + CTAs */}
          <div className="hero-left">
            <div className="hero-tag">
              <span>🩺</span>
              <span>Trusted Blood Donation Network</span>
            </div>

            <h1 className="hero-h1">
              Donate Blood,<br />
              <span className="accent">Save Lives</span>
            </h1>

            <p className="hero-sub">
              Every heartbeat tells a story. Your single donation can save up to
              3 lives — connecting donors, hospitals, and patients in real time.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="hero-cta-primary">
                🩸 Donate Now
              </Link>
              <Link to="/donors" className="hero-cta-secondary">
                👥 Find Donors →
              </Link>
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '4px' }}>
              {[
                { n: '10K+', l: 'Donors registered' },
                { n: '56L+', l: 'Blood donated' },
                { n: '300+', l: 'Blood banks' },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--ls-crimson)' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: 'var(--ls-text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: glass cards */}
          <div className="hero-right">
            {/* Blood type selector */}
            <div className="hero-glass-card">
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ls-text)', marginBottom: 10 }}>
                🔍 Find a Donor by Blood Type
              </div>
              <div className="hero-blood-grid">
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt}
                    className={`hero-blood-chip${selectedBlood === bt ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedBlood(bt);
                      navigate('/donors');
                    }}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="hero-glass-card">
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ls-text)', marginBottom: 10 }}>
                📊 Did you know?
              </div>
              <div className="hero-stat-row">
                {STATS.map(s => (
                  <div className="hero-stat-chip" key={s.label}>
                    <div className="hero-stat-val">{s.value}</div>
                    <div className="hero-stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote card */}
            <div className="hero-glass-card">
              <p className="hero-quote">
                "Every 2 seconds someone in the world needs blood. Your donation
                is their lifeline. Be the reason someone gets to go home."
              </p>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <Link to="/registerdonor" className="hero-cta-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px 16px' }}>
                  Register as Donor
                </Link>
                <Link to="/bloodbank" className="hero-cta-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px 16px' }}>
                  Blood Banks
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ECG strip at bottom */}
        <div className="hero-ecg-strip">
          <div className="hero-ecg-inner">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <svg
                key={i}
                className="hero-ecg-svg"
                width="120"
                height="60"
                viewBox="0 0 120 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="0,30 20,30 25,10 30,50 35,5 42,55 48,30 60,30 80,30 85,10 90,50 95,5 102,55 108,30 120,30"
                  stroke={isDark ? '#EF5350' : '#C62828'}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
            {/* Duplicate for seamless scroll */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <svg
                key={`dup-${i}`}
                className="hero-ecg-svg"
                width="120"
                height="60"
                viewBox="0 0 120 60"
                fill="none"
              >
                <polyline
                  points="0,30 20,30 25,10 30,50 35,5 42,55 48,30 60,30 80,30 85,10 90,50 95,5 102,55 108,30 120,30"
                  stroke={isDark ? '#EF5350' : '#C62828'}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
