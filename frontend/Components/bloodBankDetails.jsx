import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function BloodBankDetails() {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const mountRef = useRef(null);

  // fetch bank data
  useEffect(() => {
    fetch(`${API_BASE}/api/banks/${id}`)
      .then(res => res.json())
      .then(setBank)
      .catch(console.error);
  }, [id]);

  // three.js background
  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "0"; // behind content
    renderer.domElement.style.pointerEvents = "none";

    document.body.appendChild(renderer.domElement);

    // particles
    const count = 240;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xb71c1c,
      size: 0.18,
      opacity: 0.9,
      transparent: true,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let rafId;
    const animate = () => {
      points.rotation.y += 0.0006;
      points.rotation.x += 0.0004;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  if (!bank)
    return <div className="container mt-5">Loading blood bank details...</div>;

  const totalUnits = Object.values(bank.stock || {}).reduce((a, b) => a + b, 0);

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: Inter, system-ui, Roboto;
          height: 100%;
          background: linear-gradient(180deg,#ffe6e6,#f7caca,#f2b6b6);
        }
        .bb-page {
          position: relative;
          min-height: 100vh;
        }
        .bb-bg {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0; /* behind content */
          pointer-events: none;
        }
        .bb-content {
          position: relative;
          z-index: 1;
        }
        .card-wrapper {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,220,220,0.55));
          backdrop-filter: blur(14px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          max-width: 900px;
          margin: 50px auto;
        }
        .blood-box {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .blood-box:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px 3px;
        }
      `}</style>

      <div className="bb-page">
        {/* Three.js background */}
        <div ref={mountRef} className="bb-bg" />

        <div className="container bb-content">
          <div className="card-wrapper">
            <h3 style={{ color: "#b71c1c", fontWeight: 700 }}>{bank.name}</h3>
            <p className="text-muted">{bank.address}</p>

            <hr />

            <div className="row mb-3">
              <div className="col-md-4">
                <strong>📞 Contact</strong>
                <div>{bank.contact || "Not available"}</div>
              </div>
              <div className="col-md-4">
                <strong>🩸 Total Units</strong>
                <div>{totalUnits}</div>
              </div>
              <div className="col-md-4">
                <strong>⏱ Last Updated</strong>
                <div>{new Date(bank.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <h5 className="mt-4">Blood Stock Availability</h5>
            <div className="row g-3 mt-2">
              {Object.entries(bank.stock).map(([group, units]) => {
                const glowColor = units > 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.7)";
                return (
                  <div key={group} className="col-6 col-md-3">
                    <div
                      className="p-3 rounded-3 text-center blood-box"
                      style={{
                        background: units > 0 ? "#fff5f5" : "#f2f2f2",
                        border: "1px solid #f0caca",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                        // dynamic glow on hover
                        "--glow-color": glowColor
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = `0 0 20px 3px var(--glow-color)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.05)";
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{group}</div>
                      <div style={{ color: units > 0 ? "#b71c1c" : "#777" }}>
                        {units} units
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Link to="/dashboard" className="btn btn-outline-danger">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
