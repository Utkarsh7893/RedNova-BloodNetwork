import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as THREE from "three";
import { useTheme } from '../src/ThemeContext.jsx';
import Navbar from './Navbar.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

export default function BloodBankDetails() {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mountRef = useRef(null);
  const { isDark } = useTheme();

  // fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation err:', err)
      );
    }
  }, []);

  // fetch bank data
  useEffect(() => {
    fetch(`${API_BASE}/api/banks/${id}`)
      .then(res => res.json())
      .then(setBank)
      .catch(console.error);
  }, [id]);

  // three.js background (Same as dashboard)
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    const count = 160;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xb71c1c, size: 0.08, opacity: 0.6, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let raf;
    const animate = () => {
      pts.rotation.y += 0.0006;
      pts.rotation.x += 0.0003;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);



  const totalUnits = bank ? Object.values(bank.stock || {}).reduce((a, b) => a + (b || 0), 0) : 0;
  const lastUpdated = bank ? new Date(bank.updatedAt).toLocaleString() : '';

  function calcDistanceKm(userLat, userLng, bankCoords) {
    if (!bankCoords || bankCoords.length < 2) return null;
    const toRad = d => (d * Math.PI) / 180;
    const [lng, lat] = bankCoords;
    const R = 6371;
    const a = Math.sin(toRad(lat - userLat) / 2) ** 2
      + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(toRad(lng - userLng) / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const distanceText = userLocation && bank?.location?.coordinates
    ? calcDistanceKm(userLocation.lat, userLocation.lng, bank.location.coordinates).toFixed(1) + ' km away'
    : 'Calculating distance...';

  const getStockStatus = (units) => {
    if (units < 5) return { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.4)', text: 'Critical' }; // Red
    if (units <= 15) return { color: '#eab308', shadow: 'rgba(234, 179, 8, 0.4)', text: 'Moderate' }; // Yellow
    return { color: '#22c55e', shadow: 'rgba(34, 197, 94, 0.4)', text: 'Sufficient' }; // Green
  };

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300" style={{ background: 'var(--ls-bg)', color: 'var(--ls-text)' }}>
      {/* Background Image & Three.js */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 opacity-60 mix-blend-luminosity"
        style={{ backgroundImage: `url(${isDark ? '/img/dash_bg_dark.png' : '/img/dash_bg_light.png'})` }}
      />
      <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 flex justify-center min-h-[60vh] items-center md:items-start">
        {!bank ? (
          <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
            <span className="text-6xl animate-bounce">🩸</span>
            <span className="font-black tracking-[0.2em] text-sm text-red-500 uppercase">Loading Data...</span>
          </div>
        ) : (
          <div className="w-full max-w-4xl backdrop-blur-2xl border rounded-[28px] md:rounded-[32px] p-5 md:p-8 shadow-2xl transition-all" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: 'var(--ls-text)' }}>{bank.name}</h1>
                <div className="flex flex-col gap-1">
                  <p className="text-sm md:text-base flex items-center gap-2 font-medium" style={{ color: 'var(--ls-text-sub)' }}>
                    <span>📍</span> {bank.address}
                  </p>
                  <p className="text-xs md:text-sm flex items-center gap-2 font-bold text-red-500">
                    <span>🛣️</span> {distanceText}
                  </p>
                </div>
              </div>
              <Link to="/dashboard" className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:-translate-y-0.5 shadow-sm" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}>
                ← Back to Dashboard
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              <div className="p-4 rounded-2xl border flex flex-col justify-center shadow-inner col-span-2 md:col-span-1" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)' }}>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--ls-text-sub)' }}>Contact Info</span>
                <span className="font-semibold text-base sm:text-lg">{bank.contact || "N/A"}</span>
              </div>
              <div className="p-4 rounded-2xl border flex flex-col justify-center shadow-inner" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)' }}>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--ls-text-sub)' }}>Total Units</span>
                <span className="font-black text-xl sm:text-2xl text-red-500">{totalUnits}</span>
              </div>
              <div className="p-4 rounded-2xl border flex flex-col justify-center shadow-inner relative overflow-hidden" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)' }}>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--ls-text-sub)' }}>
                  ⏱ Last Updated
                </span>
                <span className="font-semibold text-sm">{lastUpdated}</span>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ls-text)' }}>
                🩸 Live Blood Stock
              </h2>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(bank.stock || {}).map(([group, units]) => {
                  const status = getStockStatus(units);
                  return (
                    <div 
                      key={group}
                      className="relative group p-2 sm:p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center cursor-default"
                      style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = `0 0 15px 2px ${status.shadow}`;
                        e.currentTarget.style.borderColor = status.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'var(--ls-border)';
                      }}
                    >
                      <span className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: 'var(--ls-text)' }}>{group}</span>
                      <span className="text-xs sm:text-base font-bold" style={{ color: status.color }}>{units} Units</span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mt-1 px-2 py-0.5 rounded-full text-center leading-tight" style={{ background: status.shadow, color: status.color }}>{status.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 border-t pt-6" style={{ borderColor: 'var(--ls-border)' }}>
              <a 
                href={`mailto:${bank.email || 'contact@lifestream.com'}?subject=Urgent Blood Request via LifeStream`} 
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 font-bold py-3.5 rounded-xl text-sm sm:text-base text-center transition-all shadow-md flex justify-center items-center gap-5 md:gap-2"
                style={{ color: '#ffffff', textDecoration: 'none' }}
              >
                ✉️ Send Mail
              </a>
              <a 
                href={`tel:${bank.contact}`} 
                className="flex-1 font-bold py-3.5 rounded-xl text-sm sm:text-base text-center transition-all border flex justify-center items-center gap-5 md:gap-2 hover:-translate-y-0.5 shadow-sm"
                style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
              >
                📞 Call Directly
              </a>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${bank.location?.coordinates[1] || 0},${bank.location?.coordinates[0] || 0}`} 
                target="_blank" rel="noopener noreferrer"
                className="flex-1 font-bold py-3.5 rounded-xl text-sm sm:text-base text-center transition-all border flex justify-center items-center gap-5 md:gap-2 hover:-translate-y-0.5 shadow-sm hover:opacity-90"
                style={{ background: '#E3F2FD', borderColor: '#90CAF9', color: '#0D47A1' }}
              >
                🗺️ Locate on Maps
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
