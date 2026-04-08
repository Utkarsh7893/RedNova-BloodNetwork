import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

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
    <div style={{ position: "relative", height: "100vh", width: "100vw", backgroundColor: "#fff5e0" }}>
      {/* Three.js Background */}
      <div ref={mountRef} style={{ position: "absolute", top: 0, left: 0 }}></div>

      {/* Forgot Password Form */}
      <div
        className="d-flex align-items-center justify-content-center vh-100"
        style={{ position: "relative", zIndex: 1 }}
      >
        <form
          className="p-5 shadow rounded"
          style={{
            width: "420px",
            background: "rgba(255, 240, 230, 0.95)",
            borderRadius: "15px",
            border: "1px solid rgba(255, 200, 180, 0.6)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
          onSubmit={handleSubmit}
        >
          <h2 className="text-center text-danger mb-4">Forgot Password</h2>
          <p className="text-center text-muted">
            Enter your email address below and we'll send you instructions to reset your password.
          </p>

          <div className="d-flex flex-column">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger w-100 mt-3"
            style={{ fontWeight: "600" }}
          >
            Send Reset Link
          </button>

          <div className="text-center mt-2">
            <a href="/login" className="text-danger text-decoration-none">
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
