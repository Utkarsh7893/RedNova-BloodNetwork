import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

export default function Awareness() {
  const mountRef = useRef(null);
  const navigate = useNavigate();

  // Three.js background
  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.zIndex = "0";
    renderer.domElement.style.pointerEvents = "none";

    document.body.appendChild(renderer.domElement);

    // Particles
    const count = 220;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xb71c1c,
      size: 0.14,
      opacity: 0.85,
      transparent: true,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let raf;
    const animate = () => {
      points.rotation.y += 0.0006;
      points.rotation.x += 0.0004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  // Expanded awareness points (2+ lines each)
  const points = [
    "🩸 Staying well hydrated before blood donation helps maintain healthy blood flow and prevents dizziness or fatigue during and after the donation process.",
    "🍎 Consuming a balanced meal rich in iron, proteins, and vitamins before donating blood ensures better hemoglobin levels and a smoother recovery.",
    "🛏️ Proper rest and quality sleep before donation allow your body to remain stable and reduce the risk of weakness or lightheadedness.",
    "💉 Understanding the blood donation procedure in advance helps reduce anxiety and makes the entire experience more comfortable and stress-free.",
    "😷 Avoid donating blood if you are experiencing fever, infection, or illness, as it may affect both your health and the recipient’s safety.",
    "🩺 Always inform the medical staff about any medications, allergies, or medical conditions to ensure safe and appropriate handling.",
    "🧬 Keep a personal record of your blood donation history to track intervals and maintain eligibility for future donations.",
    "🩹 Proper care of the puncture site after donation prevents infections and promotes faster healing.",
    "🤝 Encouraging friends, family, and colleagues to donate blood helps strengthen community healthcare support systems.",
    "🚨 Emergency blood donations play a critical role during accidents, surgeries, and disasters — timely donors save lives."
  ];

  const images = [
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df",
    "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d"
  ];

  return (
    <>
      <style>{`
      html, body { height: auto !important; overflow-y: auto !important; }
        html, body {
          margin: 0;
          padding: 0;
          font-family: Inter, system-ui, Roboto;
          background:
            radial-gradient(circle at top left, rgba(255,140,140,0.35), transparent 45%),
            linear-gradient(180deg, #ffecec 0%, #f7caca 45%, #f1b5b5 100%);
          overflow-x: hidden;
        }

        .aw-page {
          min-height: 100vh;
          position: relative;
          z-index: 1;
          padding: 80px 20px;
        }

        .aw-card {
          position: relative;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.95),
            rgba(255,215,215,0.6)
          );
          backdrop-filter: blur(18px);
          border-radius: 30px;
          padding: 60px;
          max-width: 1150px;
          margin: auto;
          border: 2px solid rgba(255,60,60,0.65);
          box-shadow:
            0 0 35px rgba(255,0,0,0.45),
            0 0 90px rgba(183,28,28,0.45),
            0 35px 120px rgba(0,0,0,0.35);
        }

        .aw-card::before {
          content: "";
          position: absolute;
          inset: -25px;
          border-radius: 38px;
          background: radial-gradient(circle, rgba(255,0,0,0.5), transparent 70%);
          filter: blur(45px);
          z-index: -1;
        }

        .aw-title {
          color: #b71c1c;
          font-weight: 900;
          font-size: 34px;
          margin-bottom: 30px;
          text-align: center;
        }

        .aw-points li {
          font-size: 16px;
          margin-bottom: 18px;
          line-height: 1.75;
        }

        .aw-images {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 22px;
          margin-top: 40px;
        }

        .aw-images img {
          width: 100%;
          border-radius: 18px;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          cursor: pointer;
        }

        .aw-images img:hover {
          transform: translateY(-8px) scale(1.04);
          box-shadow: 0 20px 45px rgba(183,28,28,0.45);
        }

        .btn-back {
          margin-top: 45px;
          padding: 14px 30px;
          border-radius: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          border: none;
          box-shadow: 0 18px 55px rgba(183,28,28,0.55);
        }

        .btn-back:hover {
          transform: translateY(-3px);
        }
      `}</style>

      <div className="aw-page">
        <div className="aw-card">
          <h2 className="aw-title">🩸 Medical Awareness & Best Practices</h2>

          <ul className="aw-points">
            {points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>

          <div className="aw-images">
            {images.map((img, i) => (
              <img key={i} src={img} alt={`awareness-${i}`} />
            ))}
          </div>

          <div className="text-center">
            <button
              className="btn btn-back text-white"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
