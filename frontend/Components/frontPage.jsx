import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useTheme } from "../src/ThemeContext.jsx";
import { FiHeart, FiUsers, FiSearch, FiBarChart2, FiDroplet, FiMoon, FiSun, FiActivity, FiChevronDown, FiPlusCircle } from "react-icons/fi";

const STATS = [
  { value: "Every 2 sec", label: "Someone needs blood" },
  { value: "3 lives", label: "Saved per donation" },
  { value: "38%", label: "Population eligible" },
  { value: "1 unit", label: "Can help 3 patients" },
];

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

// ECG path that looks like a heartbeat waveform
const ECG_PATH = "M0,30 L20,30 L25,10 L30,50 L35,5 L42,55 L48,30 L60,30 L80,30 L85,10 L90,50 L95,5 L102,55 L108,30 L120,30";

// Auth guard helper — checks localStorage for a valid token
const isLoggedIn = () => !!localStorage.getItem('ls_token');

export default function FrontPage() {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();
  const [pageVisible, setPageVisible] = useState(false);
  const [selectedBlood, setSelectedBlood] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

  useEffect(() => {
    const handleWinScroll = () => {
      if (window.scrollY > 10 || document.documentElement.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleWinScroll);
    return () => window.removeEventListener('scroll', handleWinScroll);
  }, []);

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
      // Make background transparent so the interactive background image shows through
      scene.background = null;

      camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 1.5, 6);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 1.1));
      const glowLight = new THREE.PointLight(isDark ? 0xff1744 : 0xd50000, 6, 22);
      glowLight.position.set(0, 0, 6);
      scene.add(glowLight);

      // Floating plasma / red blood cells
      const dropGeom = new THREE.SphereGeometry(0.065, 16, 16);
      dropGeom.scale(1, 1, 0.35); // Flatten like a blood cell
      const dropMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0xff1744 : 0xd50000,
        emissive: isDark ? 0xcc0000 : 0x990000,
        emissiveIntensity: isDark ? 0.8 : 0.5, // Brighter glow in dark mode
        roughness: 0.15,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: isDark ? 0.9 : 0.75, // Softer opacity in light mode
      });

      drops = new THREE.Group();
      for (let i = 0; i < 220; i++) {
        const p = new THREE.Mesh(dropGeom, dropMat);
        const x = Math.random() * 14 - 7;
        const y = Math.random() * 10 - 5;
        const z = Math.random() * 8 - 4;
        p.basePos = { x, y, z };
        p.position.set(x, y, z);
        
        // Initial random rotation
        p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        
        p.userData.wave = Math.random() * Math.PI * 2;
        p.userData.rotSpeed = (Math.random() - 0.5) * 0.04;
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
            p.rotation.x += p.userData.rotSpeed;
            p.rotation.y += p.userData.rotSpeed;
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
        @keyframes bounce-arrow {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(12px); }
          60% { transform: translateX(-50%) translateY(6px); }
        }

        /* 
          1. Mobile & Tablet Optimization 
        */
        .front-wrapper {
          min-height: 100dvh;
          width: 100vw;
          overflow-x: hidden;
          background-color: var(--ls-bg); /* fallback */
          font-family: Inter, system-ui, Roboto;
          -webkit-tap-highlight-color: transparent;
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

        .hero-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          z-index: 1; /* Above the overlay, below content */
          pointer-events: none;
        }

        .hero-page {
          width: 100%;
          min-height: 100dvh;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          transition: opacity 0.7s ease;
          z-index: 2;
          -webkit-overflow-scrolling: touch;
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
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 30px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #FF1744, #D50000);
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
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
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
          align-content: center;
          padding: 0 48px;
          gap: 36px;
          max-width: 1300px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Left panel ── */
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 22px;
          animation: ls-fade-up 0.7s ease both;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 30px;
          background: rgba(198,40,40,0.12);
          border: 1px solid rgba(198,40,40,0.28);
          color: var(--ls-crimson);
          font-weight: 700;
          font-size: 14px;
          width: fit-content;
          box-shadow: 0 4px 12px rgba(198,40,40,0.15);
        }
        .hero-h1 {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.05em;
          color: var(--ls-text);
          margin: 0;
          text-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .hero-h1 .accent {
          background: linear-gradient(135deg, #FF1744, #D50000);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          display: inline-block;
          filter: drop-shadow(0 0 16px rgba(255,23,68,0.25));
        }
        .hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: clamp(16px, 2vw, 20px);
          color: var(--ls-text);
          opacity: 0.9;
          font-weight: 500;
          line-height: 1.65;
          margin: 0;
          max-width: 500px;
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
          background: linear-gradient(135deg, #FF1744, #D50000);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 28px rgba(213,0,0,0.40);
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

        /* ── Bottom Section Special Hover Buttons ── */
        .hero-bottom-btn {
          position: relative;
          overflow: hidden;
          width: 100%;
          justify-content: center;
          font-size: 15px;
          padding: 14px 16px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          transition: all 0.4s ease;
          z-index: 1;
        }
        .hero-bottom-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          z-index: -1;
          transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-bottom-btn:hover::before {
          left: 0;
        }

        /* Explicitly dismiss hover effect ON CLICK as requested */
        .hero-bottom-btn:active::before {
          left: -100% !important;
          transition: none !important;
        }

        /* Primary: Register */
        .hero-bottom-btn-primary {
          background: rgba(213,0,0,0.05);
          border: 1.5px solid rgba(213,0,0,0.3);
          color: #D50000; /* Darker red for light mode visibility */
        }
        .hero-bottom-btn-primary::before {
          background: linear-gradient(90deg, #FF1744, #D50000);
        }
        .hero-bottom-btn-primary:hover {
          color: #fff;
          border-color: transparent;
          box-shadow: 0 8px 25px rgba(255,23,68,0.5);
          transform: translateY(-2px);
        }
        .hero-bottom-btn-primary:active {
          color: #D50000 !important;
          box-shadow: none !important;
          border-color: rgba(213,0,0,0.3) !important;
          transform: scale(0.98) !important;
        }

        /* Secondary: Blood Banks */
        .hero-bottom-btn-secondary {
          background: rgba(0,137,123,0.05);
          border: 1.5px solid rgba(0,137,123,0.3);
          color: #00897B; /* Darker teal for light mode visibility */
        }
        .hero-bottom-btn-secondary::before {
          background: linear-gradient(90deg, #00C9B1, #00897B);
        }
        .hero-bottom-btn-secondary:hover {
          color: #fff;
          border-color: transparent;
          box-shadow: 0 8px 25px rgba(0,201,177,0.5);
          transform: translateY(-2px);
        }
        .hero-bottom-btn-secondary:active {
          color: #00897B !important;
          box-shadow: none !important;
          border-color: rgba(0,137,123,0.3) !important;
          transform: scale(0.98) !important;
        }

        /* ── Right panel — floating glass cards ── */
        .hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          animation: ls-fade-up 0.7s 0.2s ease both;
        }
        .hero-glass-card {
          background: color-mix(in srgb, var(--ls-surface) 40%, transparent);
          backdrop-filter: blur(6px) saturate(140%);
          -webkit-backdrop-filter: blur(6px) saturate(140%);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 22px 26px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          width: 100%;
          max-width: 360px;
          transition: transform 0.3s ease;
        }
        .hero-glass-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .hero-quote {
          font-size: 15px;
          line-height: 1.7;
          color: var(--ls-text-sub);
          font-style: italic;
          font-weight: 500;
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
          background: linear-gradient(135deg, #FF1744, #D50000);
          color: #fff;
          border-color: transparent;
          transform: scale(1.06);
          box-shadow: 0 6px 18px rgba(213,0,0,0.35);
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

        /* (Removed ECG strip at bottom) */

        /* Light Mode Glass Background */
        .light-mode-glass {
          background: color-mix(in srgb, var(--ls-surface) 40%, transparent) !important;
          backdrop-filter: blur(6px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(6px) saturate(140%) !important;
          border-radius: 24px;
          padding: 24px !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          border: 1px solid var(--ls-border);
        }

        /* Heart zone spacer — hidden on desktop, visible on mobile */
        .hero-heart-zone {
          display: none;
        }

        /* Get Started Glowing Button */
        .hero-get-started-btn {
          padding: 16px 44px;
          border-radius: 50px;
          background: linear-gradient(135deg, #FF1744, #D50000);
          color: #fff;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: 0.05em;
          text-decoration: none;
          box-shadow: 0 0 20px rgba(255,23,68,0.4), 0 0 40px rgba(255,23,68,0.2);
          animation: ls-pulse-ring 2.5s infinite;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 50;
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .hero-get-started-btn:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 0 35px rgba(255,23,68,0.7), 0 0 70px rgba(255,23,68,0.4);
        }
        @keyframes float-drop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .hero-get-started-btn .blood-drop {
          animation: float-drop 1.5s ease-in-out infinite;
        }

        /* Scroll down arrow — hidden on desktop */
        .hero-scroll-arrow {
          display: none;
        }

        /* Footer */
        .hero-footer {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 12px 20px 24px; /* Added bottom padding */
          background: transparent; /* Removed full-width background */
        }
        .hero-footer-pill {
          display: inline-block;
          background: rgba(128, 128, 128, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 10px 24px;
          border-radius: 50px;
          border: 1px solid rgba(128, 128, 128, 0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }
        .hero-footer-text {
          font-size: 13px;
          color: var(--ls-text); /* Higher contrast */
          font-weight: 600;
          letter-spacing: 0.01em;
          margin: 0;
        }
        .hero-footer-text .footer-heart {
          color: #FF1744;
          display: inline-block;
        }
        .hero-footer-name {
          font-weight: 700;
          background: linear-gradient(135deg, #FF1744, #D50000);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-body {
            gap: 20px;
            padding: 0 24px;
          }
          .hero-h1 { font-size: clamp(34px, 5vw, 48px); }
          .hero-glass-card { max-width: 100%; }
        }
        @media (max-width: 768px) {
          .hero-page {
            height: auto;
            min-height: auto;
            padding-bottom: 0;
          }
          .hero-canvas {
            opacity: 0.5;
          }
          .hero-body {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 0 16px;
            gap: 0;
          }
          .hero-topbar { padding: 12px 16px; }
          .hero-left { 
            padding: 16px 10px 0;
            margin-top: 20px; /* Shift lower towards center */
            z-index: 10;
            background: transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .hero-left .hero-tag { font-size: 12px; padding: 6px 12px; }
          .hero-left .hero-h1 { font-size: clamp(28px, 8vw, 36px); margin-bottom: 6px; }
          .hero-left .hero-sub { font-size: 14px; line-height: 1.5; margin-bottom: 4px; max-width: 90%; }
          .hero-left .hero-actions { 
            gap: 12px; 
            flex-direction: column; /* Stack vertically */
            justify-content: center;
            width: 100%;
          }
          .hero-left .hero-cta-primary { padding: 12px 24px; font-size: 15px; width: 100%; justify-content: center; }
          .hero-left .hero-cta-secondary { padding: 12px 24px; font-size: 15px; width: 100%; justify-content: center; }
          
          /* Spacer for the beating heart to show through */
          .hero-heart-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 22vh; /* Severely decreased space above and below button */
            position: relative;
            z-index: 50;
            margin: 10px 0;
          }

          /* Scroll arrow — fixed at bottom of screen */
          .hero-scroll-arrow {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            position: fixed;
            bottom: 18px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 50;
            animation: bounce-arrow 2s infinite;
          }
          .hero-scroll-arrow span {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--ls-text-muted);
            text-shadow: 0 1px 4px rgba(0,0,0,0.3);
          }
          .hero-scroll-arrow .arrow-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1.5px solid rgba(255,23,68,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FF1744;
            box-shadow: 0 4px 20px rgba(255,23,68,0.3);
          }

          .hero-right { 
            align-items: center; 
            width: 100%; 
            z-index: 10;
            padding: 0;
            margin-top: -10px; /* Shift upper towards center */
            margin-bottom: 60px;
            background: transparent;
            gap: 16px;
          }
          .hero-glass-card { width: 100%; max-width: 100%; padding: 18px 20px; }
          .hero-blood-grid { grid-template-columns: repeat(4, 1fr); }
          .hero-stat-row { grid-template-columns: 1fr 1fr; gap: 6px; }
        }
        @media (max-width: 480px) {
          .hero-brand { font-size: 24px; }
          .hero-topbar-btn { padding: 8px 12px; font-size: 13px; }
          .hero-theme-btn { width: 34px; height: 34px; font-size: 15px; }
        }

        /* Static Background Layer */
        .hero-bg-layer {
          position: fixed;
          inset: 0;
          background: url('/img/front_blood_bg_1777551469033.png') center/cover no-repeat fixed;
          z-index: 0;
        }
        .hero-gradient-overlay {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(to bottom right, var(--ls-bg), transparent, var(--ls-bg));
          opacity: 0.9;
        }
      `}</style>

      <div
        className="hero-page"
        onScroll={handleScroll}
        style={{ opacity: pageVisible ? 1 : 0, backgroundColor: 'var(--ls-bg)', position: 'relative' }}
      >
        {/* Static Background Layer */}
        <div 
          className="hero-bg-layer"
          style={{ opacity: isDark ? 0.4 : 0.6 }}
        />
        <div className="hero-gradient-overlay" />

        {/* THREE.js canvas */}
        <div className="hero-canvas" ref={mountRef} />

        {/* Top bar */}
        <div className="hero-topbar">
          <Link to="/" className="hero-brand">
            <FiActivity size={32} style={{ color: '#FF1744' }} /> lifeStream
          </Link>
          <div className="hero-topbar-actions" style={{ gap: '18px' }}>
            <button className="hero-theme-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <FiPlusCircle size={20} color="#FF1744" /> : <FiPlusCircle size={20} color="#D50000" />}
            </button>
            <Link to="/login" className="hero-topbar-btn" style={{ background: 'linear-gradient(135deg, #FF1744, #D50000)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(213,0,0,0.3)' }}>
              Sign Up
            </Link>
          </div>
        </div>

        {/* Main hero body */}
        <div className="hero-body">
          {/* Left: copy + CTAs */}
          <div className={`hero-left ${!isDark ? 'light-mode-glass' : ''}`}>

            <div className="hero-tag">
              <FiActivity size={18} />
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
                <FiUsers size={20} /> Login
              </Link>
              <Link to={isLoggedIn() ? "/donors" : "/login"} className="hero-cta-secondary">
                <FiSearch size={20} /> Find Donors
              </Link>
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'nowrap', justifyContent: 'space-between', width: '100%', marginTop: '20px' }}>
              {[
                { n: '10K+', l: 'Donors' },
                { n: '56L+', l: 'Donated' },
                { n: '300+', l: 'Banks' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 22, color: '#FF1744', textShadow: '0 2px 10px rgba(255,23,68,0.2)' }}>{s.n}</div>
                  <div style={{ fontSize: 13, color: 'var(--ls-text)', fontWeight: 600, opacity: 0.85 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer for heart on mobile */}
          <div className="hero-heart-zone">
            <Link to="/login" className="hero-get-started-btn">
              Get Started <FiDroplet className="blood-drop" size={24} />
            </Link>
          </div>

          {/* Right: glass cards */}
          <div className="hero-right">
            {/* Blood type selector */}
            <div className="hero-glass-card">
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ls-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiSearch size={18} color="#FF1744" /> Find a Donor by Blood Type
              </div>
              <div className="hero-blood-grid">
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt}
                    className={`hero-blood-chip${selectedBlood === bt ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedBlood(bt);
                      navigate(isLoggedIn() ? '/donors' : '/login');
                    }}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="hero-glass-card">
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ls-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBarChart2 size={18} color="#00C9B1" /> Did you know?
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
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to={isLoggedIn() ? "/registerdonor" : "/login"} className="hero-bottom-btn hero-bottom-btn-primary">
                  Register as Donor
                </Link>
                <Link to={isLoggedIn() ? "/bloodbank" : "/login"} className="hero-bottom-btn hero-bottom-btn-secondary">
                  Search Blood Banks
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="hero-footer">
          <div className="hero-footer-pill">
            <p className="hero-footer-text">
              © {new Date().getFullYear()} lifeStream — Built with <span className="footer-heart"><FiHeart size={13} /></span> by <span className="hero-footer-name">Utkarsh Raj</span>
            </p>
          </div>
        </div>

        {/* Scroll arrow — fixed at bottom, mobile only, vanishes smoothly on scroll */}
        <div className="hero-scroll-arrow" style={{ 
          opacity: isScrolled ? 0 : 1, 
          transform: isScrolled ? 'translateX(-50%) translateY(30px)' : 'translateX(-50%) translateY(0)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
          pointerEvents: isScrolled ? 'none' : 'auto' 
        }}>
          <span>Scroll</span>
          <div className="arrow-icon">
            <FiChevronDown size={22} />
          </div>
        </div>

      </div>
    </>
  );
}
