import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function ForgotPage() {
  const navigate=useNavigate();
  const [email, setEmail] = useState('');
  const mountRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    if (!email) {
      alert("Please enter your email.");
      return;
    }
    // Send the form data to your backend
    try {
      await fetch(`${API_BASE}/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      // Show alert
      alert(`Email sent to ${email}!`);

      // Clear the form
      setEmail('');

    //   navigate('/login');

    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    }
  };

  useEffect(() => {
    // Three.js setup (same as before)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xfff5e0, 1); // creamy background
    mountRef.current.appendChild(renderer.domElement);

    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff4d4d,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const animate = () => {
      requestAnimationFrame(animate);
      geometry.attributes.position.array.forEach((_, idx) => {
        if (idx % 3 === 1) {
          geometry.attributes.position.array[idx] -= 0.02;
          if (geometry.attributes.position.array[idx] < -3) {
            geometry.attributes.position.array[idx] = 6;
          }
        }
      });
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw", background: "var(--ls-bg)", overflow: 'hidden', display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={mountRef} style={{ position: "absolute", top: 0, left: 0 }}></div>
      
      {/* Brand & Back Button */}
      <div style={{ position: 'absolute', top: 20, left: 28, display: 'flex', alignItems: 'center', gap: 16, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
          ←
        </button>
        <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, background: 'var(--ls-grad-crimson)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>lifeStream 🩸</div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <form
          className="p-4"
          style={{ width: "400px", background: "var(--ls-surface)", backdropFilter: "blur(20px) saturate(160%)", borderRadius: "20px", border: "1px solid var(--ls-border)", boxShadow: "var(--ls-shadow-lg)", display: "flex", flexDirection: "column", gap: "16px" }}
          onSubmit={handleSubmit}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--ls-text)' }}>Forgot Password?</div>
            <p style={{ fontSize: 13, color: 'var(--ls-text-muted)', margin: '8px 0 0' }}>Enter your email and we'll send you a reset link.</p>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ls-text-sub)', display: 'block', marginBottom: 6 }}>Email address</label>
            <input type="email" id="email" className="ls-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" style={{ padding: '13px', borderRadius: 12, border: 'none', background: 'var(--ls-grad-crimson)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 28px rgba(198,40,40,0.35)' }}>
            Send Reset Link
          </button>
          <div className="text-center" style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--ls-crimson)', fontWeight: 600, fontSize: 14 }}>← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
