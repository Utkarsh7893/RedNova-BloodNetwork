import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as THREE from "three";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

export default function DonorProfile() {
  const { id } = useParams();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const bgRef = useRef(null);

  // Load donor data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/donors/${id}`).then(r => r.json());
        setDonor(res);
      } catch (err) {
        console.error("Failed to load donor", err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // Three.js Background
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    // Particles
    const particlesCount = 180;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaa2b2b, size: 0.12, opacity: 0.85, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    let rafId;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!donor) return <div className="text-center mt-5 text-danger">Donor not found</div>;

  return (
    <>
      <style>{`
        html, body { margin:0; padding:0; background: var(--ls-bg); min-height:100%; overflow-x:hidden; }
        .three-bg { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:0; pointer-events:none; }
        .db-page { position:relative; z-index:1; min-height:100vh; }
        .profile-content { max-width: 900px; margin: 0 auto; padding: 28px 20px 60px; }
        .profile-card {
          background: var(--ls-surface);
          backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid var(--ls-border);
          border-radius: 20px;
          padding: 28px;
          box-shadow: var(--ls-shadow-lg);
        }
        h2 { font-family: 'Manrope',sans-serif; color: var(--ls-text); font-weight: 800; margin-bottom: 6px; }
        .text-muted { color: var(--ls-text-muted) !important; }
        strong { color: var(--ls-text); }
        .bloodTag {
          padding: 8px 18px; border-radius: 12px; color: #fff;
          font-weight: 800; font-size: 16px;
          background: var(--ls-grad-crimson);
          box-shadow: 0 6px 18px rgba(198,40,40,0.35);
          display: inline-block;
        }
        a.btn-custom-danger {
          display: block; border-radius: 12px; padding: 10px 18px; margin-bottom: 10px; text-align: center;
          background: var(--ls-grad-crimson); color: white; text-decoration: none; font-weight: 700;
          box-shadow: 0 8px 22px rgba(198,40,40,0.30); transition: transform 0.2s;
        }
        a.btn-custom-danger:hover { transform: translateY(-2px); color: white; }
        a.btn-custom-outline {
          display: block; border-radius: 12px; padding: 9px 18px; text-align: center;
          border: 1.5px solid var(--ls-crimson); color: var(--ls-crimson); text-decoration: none; font-weight: 700;
          transition: all 0.2s;
        }
        a.btn-custom-outline:hover { background: var(--ls-grad-crimson); color: #fff; border-color: transparent; }
        .back-link { color: var(--ls-crimson); font-weight: 600; font-size: 14px; }
        @media (max-width:767px) { .d-flex { flex-direction:column !important; align-items:flex-start !important; } .col-md-4 { width:100% !important; margin-top:20px; } }
      `}</style>

      <div className="three-bg" ref={bgRef}></div>

      <div className="db-page">
        <Navbar />
        <div className="profile-content">
          <div className="profile-card">
            <div className="row d-flex">
              <div className="col-md-8">
                <h2>{donor.name}</h2>
                <div className="text-muted mb-2">{donor.age} yrs • {donor.gender}</div>
                <div className="mb-2" style={{ color: 'var(--ls-text-sub)' }}><strong>Location:</strong> {donor.city}, {donor.state}</div>
                <div className="mb-2" style={{ color: 'var(--ls-text-sub)' }}><strong>Phone:</strong> {donor.phone || "Not Provided"}</div>
                <div className="mb-2" style={{ color: 'var(--ls-text-sub)' }}><strong>Email:</strong> {donor.email || "Not Provided"}</div>
                <div className="mb-2" style={{ color: 'var(--ls-text-sub)' }}><strong>Last Donation:</strong> {new Date(donor.lastDonation).toLocaleDateString()}</div>
                <div className="mb-2">
                  <strong>About Donor:</strong>
                  <p className="text-muted small mt-1">{donor.healthInfo || "No additional information provided."}</p>
                </div>
              </div>
              <div className="col-md-4 d-flex flex-column align-items-end justify-content-start">
                <div className="bloodTag mb-3">{donor.bloodGroup}</div>
                {donor.phone && (
                  <a href={`tel:${donor.phone}`} className="btn-custom-danger mb-2">📞 Call Donor</a>
                )}
                {donor.email && (
                  <a href={`mailto:${donor.email}`} className="btn-custom-outline">📧 Send Email</a>
                )}
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <Link to="/donors" className="back-link">← Back to Donors List</Link>
          </div>
        </div>
      </div>
    </>
  );
}
