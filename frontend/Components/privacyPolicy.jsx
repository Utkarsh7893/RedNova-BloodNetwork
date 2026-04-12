import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const mountRef = useRef(null);
  const [accepted, setAccepted] = useState(false);
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
    const count = 200;
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

        .pp-page {
          min-height: 100vh;
          position: relative;
          z-index: 1;
          padding: 80px 20px;
        }

        .pp-card {
          position: relative;
          max-width: 1100px;
          margin: auto;
          padding: 60px;
          border-radius: 30px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.95),
            rgba(255,215,215,0.6)
          );
          backdrop-filter: blur(18px);
          border: 2px solid rgba(255,60,60,0.65);
          box-shadow:
            0 0 35px rgba(255,0,0,0.45),
            0 0 90px rgba(183,28,28,0.45),
            0 35px 120px rgba(0,0,0,0.35);
        }

        .pp-card::before {
          content: "";
          position: absolute;
          inset: -25px;
          border-radius: 38px;
          background: radial-gradient(circle, rgba(255,0,0,0.5), transparent 70%);
          filter: blur(45px);
          z-index: -1;
        }

        .pp-title {
          color: #b71c1c;
          font-weight: 900;
          font-size: 34px;
          margin-bottom: 6px;
          text-align: center;
        }

        .pp-date {
          text-align: center;
          color: #666;
          margin-bottom: 36px;
        }

        .pp-section h6 {
          margin-top: 26px;
          font-weight: 800;
          color: #b71c1c;
        }

        .pp-section p {
          color: #555;
          font-size: 15px;
          line-height: 1.8;
          margin-top: 6px;
        }

        .accept-box {
          margin-top: 36px;
          padding: 20px;
          border-radius: 14px;
          background: #fff3f3;
          border: 1px solid #f0bcbc;
        }

        .btn-back {
          margin-top: 40px;
          padding: 14px 30px;
          border-radius: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          border: none;
          box-shadow: 0 18px 55px rgba(183,28,28,0.55);
        }

        .btn-back:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="pp-page">
        <div className="pp-card">
          <h2 className="pp-title">🔐 Privacy Policy</h2>
          <p className="pp-date">
            Effective Date: {new Date().toLocaleDateString()}
          </p>

          <div className="pp-section">
            <h6>1. Introduction</h6>
            <p>
              BloodCare is committed to protecting your privacy and personal data.
              This policy explains how information is collected, processed, and
              safeguarded across the platform.
            </p>

            <h6>2. Information We Collect</h6>
            <p>
              We may collect personal details such as name, contact information,
              location, blood group, donation history, and relevant medical data
              strictly for donation and emergency matching purposes.
            </p>

            <h6>3. Use of Information</h6>
            <p>
              Data is used to connect donors with recipients, respond to urgent
              blood requests, enhance system functionality, and meet regulatory
              requirements.
            </p>

            <h6>4. Data Security</h6>
            <p>
              Industry-standard safeguards are applied to protect your data from
              unauthorized access, disclosure, or misuse.
            </p>

            <h6>5. Data Sharing</h6>
            <p>
              Information is shared only with verified blood banks, hospitals,
              and authorized medical staff. We never sell or rent personal data.
            </p>

            <h6>6. User Rights</h6>
            <p>
              You may access, update, or request deletion of your personal data,
              subject to legal and medical obligations.
            </p>

            <h6>7. Policy Updates</h6>
            <p>
              This policy may be updated periodically. Continued use of the
              platform indicates acceptance of the revised terms.
            </p>
          </div>

          <div className="accept-box">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="acceptPolicy"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="acceptPolicy">
                I have read and understood the Privacy Policy
              </label>
            </div>
          </div>

          <div className="text-center">
            <button
              className="btn btn-back text-white"
              disabled={!accepted}
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
