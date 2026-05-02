import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useTheme } from '../src/ThemeContext.jsx';
import Navbar from './Navbar.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

const PROFILE_FIELDS = [
  { key: 'name', label: '👤 Full Name', type: 'text' },
  { key: 'email', label: '📧 Email', type: 'email', disabled: true },
  { key: 'bloodgroup', label: '🩸 Blood Group', type: 'select', options: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  { key: 'gender', label: '⚧ Gender', type: 'select', options: ['', 'Male', 'Female', 'Other'] },
  { key: 'dob', label: '🎂 Date of Birth', type: 'date' },
  { key: 'contact', label: '📱 Phone Number', type: 'tel' },
  { key: 'address', label: '🏠 Address', type: 'text' },
  { key: 'city', label: '🏙️ City', type: 'text' },
  { key: 'state', label: '🗺️ State', type: 'text' },
  { key: 'pincode', label: '📮 Pincode', type: 'text' },
  { key: 'emergencyContact', label: '🚨 Emergency Contact', type: 'tel' },
  { key: 'bio', label: '✍️ Bio', type: 'textarea' },
  { key: 'lastDonation', label: '💉 Last Donation Date', type: 'date' },
  { key: 'medicalConditions', label: '🏥 Medical Conditions', type: 'text' },
];

const COMPLETABLE_KEYS = ['name', 'email', 'bloodgroup', 'gender', 'dob', 'contact', 'address', 'city', 'state', 'pincode', 'emergencyContact', 'bio', 'profilePhoto'];

function calcCompletion(profile) {
  if (!profile) return 0;
  let filled = 0;
  for (const key of COMPLETABLE_KEYS) {
    if (profile[key] && String(profile[key]).trim()) filled++;
  }
  return Math.round((filled / COMPLETABLE_KEYS.length) * 100);
}

export default function ProfilePage() {
  const { isDark } = useTheme();
  const mountRef = useRef(null);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('ls_token');

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Fetch profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile(data); })
      .catch(console.error);
  }, [token]);

  // Three.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xb71c1c, size: 0.08, opacity: 0.5, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    let raf;
    const animate = () => { pts.rotation.y += 0.0005; pts.rotation.x += 0.0003; renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
    animate();
    const resize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); geo.dispose(); mat.dispose(); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, []);

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSaved(true);
        showNotif('Profile saved successfully!');
        // Update stored user data
        localStorage.setItem('ls_user', JSON.stringify(data.user));
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch(`${API_BASE}/api/profile/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
        showNotif('Photo updated!');
        // Update stored user
        const storedUser = JSON.parse(localStorage.getItem('ls_user') || '{}');
        storedUser.profilePhoto = data.profilePhoto;
        localStorage.setItem('ls_user', JSON.stringify(storedUser));
      }
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const completion = calcCompletion(profile);
  const photoSrc = profile?.profilePhoto ? `${API_BASE}${profile.profilePhoto}` : null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ls-bg)', color: 'var(--ls-text)' }}>
        <div className="text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <h2 className="text-2xl font-black mb-2">Please Login First</h2>
          <Link to="/login" className="text-red-500 font-bold underline">Go to Login →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300" style={{ background: 'var(--ls-bg)', color: 'var(--ls-text)' }}>
      {/* BG */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 opacity-60 mix-blend-luminosity"
        style={{ backgroundImage: `url(${isDark ? '/img/dash_bg_dark.png' : '/img/dash_bg_light.png'})` }} />
      <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-50"><Navbar /></div>

      {/* Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] font-bold text-sm text-center" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', borderWidth: '1px', color: 'var(--ls-text)' }}>
          ✨ {notification}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 max-w-3xl">

        {/* Profile Completion Bar */}
        <div className="backdrop-blur-2xl border rounded-2xl p-5 mb-6 shadow-xl" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm" style={{ color: 'var(--ls-text)' }}>
              {completion === 100 ? '🎉 Profile Complete!' : '📋 Profile Completion'}
            </span>
            <span className="font-black text-sm" style={{ color: completion === 100 ? '#22c55e' : '#ef4444' }}>{completion}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--ls-bg-alt)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${completion}%`,
                background: completion === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : completion > 60 ? 'linear-gradient(90deg, #eab308, #f59e0b)' : 'linear-gradient(90deg, #ef4444, #dc2626)'
              }}
            />
          </div>
          {completion < 100 && (
            <p className="text-xs mt-2" style={{ color: 'var(--ls-text-sub)' }}>
              Complete your profile to help blood banks reach you faster in emergencies.
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="backdrop-blur-2xl border rounded-[28px] p-6 md:p-8 shadow-2xl" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>

          {/* Photo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative w-28 h-28 rounded-full border-4 overflow-hidden cursor-pointer group shadow-lg mb-4"
              style={{ borderColor: completion === 100 ? '#22c55e' : '#ef4444' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--ls-bg-alt)' }}>
                  👤
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-bold">{uploading ? '⏳' : '📷 Change'}</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--ls-text)' }}>{profile?.name || 'Your Profile'}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ls-text-sub)' }}>{profile?.email}</p>
            {profile?.isDonor && (
              <span className="mt-2 text-xs font-black bg-green-500 text-white px-3 py-1 rounded-full shadow-md">✅ Registered Donor</span>
            )}
          </div>

          {/* Donor Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border mb-6" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)' }}>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--ls-text)' }}>💪 Register as Donor</span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ls-text-sub)' }}>
                {profile?.isDonor ? 'You are a registered donor ✅' : 'Complete donor registration to activate'}
              </p>
            </div>
            <button
              onClick={() => {
                if (!profile?.isDonor) {
                  navigate('/registerdonor');
                }
              }}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{ background: profile?.isDonor ? '#22c55e' : 'var(--ls-border)', cursor: profile?.isDonor ? 'default' : 'pointer' }}
            >
              <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300"
                style={{ transform: profile?.isDonor ? 'translateX(28px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROFILE_FIELDS.map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold mb-1.5 tracking-wide" style={{ color: 'var(--ls-text-sub)' }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={profile?.[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className="w-full border text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all"
                    style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
                  >
                    {field.options.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={profile?.[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full border text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all resize-none"
                    style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={profile?.[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    disabled={field.disabled}
                    className={`w-full border text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all ${field.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 font-bold py-4 rounded-xl text-center transition-all duration-500 shadow-md flex justify-center items-center gap-3 ${
                saved
                  ? 'bg-green-500 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)]'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-[0_8px_20px_rgba(220,38,38,0.3)]'
              }`}
              style={{ color: '#ffffff', textDecoration: 'none' }}
            >
              {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
            </button>
            <Link
              to="/dashboard"
              className="flex-1 font-bold py-4 rounded-xl text-center transition-all border flex justify-center items-center gap-3 hover:-translate-y-0.5 shadow-sm"
              style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
