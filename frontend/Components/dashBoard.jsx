import React, { useEffect, useRef, useState } from "react";
import { fetchRandomImage1, fetchRandomImage2, fetchRandomImage3 } from './api';
import * as THREE from "three";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useTheme } from '../src/ThemeContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

export default function DashBoard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const socketRef = useRef(null);

  const [imageUrl1, setImageUrl1] = useState("https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&q=80");
  const [imageUrl2, setImageUrl2] = useState("https://images.unsplash.com/photo-1576671494552-5a6d9d87c000?w=800&q=80");
  const [imageUrl3, setImageUrl3] = useState("https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80");

  useEffect(() => {
    const fetchImages = async () => {
      try { const img = await fetchRandomImage1(); if (img) setImageUrl1(img); } catch (e) {}
      try { const img = await fetchRandomImage2(); if (img) setImageUrl2(img); } catch (e) {}
      try { const img = await fetchRandomImage3(); if (img) setImageUrl3(img); } catch (e) {}
    };
    fetchImages();
  }, []);

  const carouselImages = [imageUrl1, imageUrl2, imageUrl3];
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [banks, setBanks] = useState([]);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [liveNowCount, setLiveNowCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Subscriptions and Events
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [notification, setNotification] = useState("");

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real User Location for Distance Calc
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  }, []);

  const formatClock = (date) => {
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      fullDate: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  };
  const clockData = formatClock(currentTime);

  const campaigns = [
    { id: 1, name: "City Center Blood Drive", location: "Downtown Plaza", urgency: "urgent", need: "High (All Types)", instructions: "Please drink plenty of water before arriving.", start: "Oct 25, 2026 09:00 AM", end: "Oct 25, 2026 05:00 PM" },
    { id: 2, name: "Community Health Camp", location: "Northside Community Hall", urgency: "moderate", need: "Moderate (O-, B-)", instructions: "Bring an ID. Free checkups available.", start: "Nov 02, 2026 10:00 AM", end: "Nov 02, 2026 04:00 PM" },
    { id: 3, name: "University Campus Run", location: "Main Library Square", urgency: "relaxed", need: "Low (General Stock)", instructions: "Walk-ins welcome all day.", start: "Nov 15, 2026 08:00 AM", end: "Nov 15, 2026 06:00 PM" }
  ];

  // Show Soft Popup Notification
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const token = localStorage.getItem('ls_token');
      if (!token) {
        showNotification("Please login to subscribe");
        setIsSubscribing(false);
        return;
      }
      
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.isSubscribedToAlerts);
        showNotification(data.isSubscribedToAlerts ? "Subscribed! An email has been sent to you." : "Unsubscribed from alerts.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubscribing(false);
  };

  const handleRegisterEvent = async (event) => {
    if (registeredEvents.includes(String(event.id))) return;
    
    try {
      const token = localStorage.getItem('ls_token');
      if (!token) {
        showNotification("Please login to register");
        return;
      }

      setRegisteredEvents(prev => [...prev, String(event.id)]); // Optimistic UI
      showNotification(`Registered for "${event.name}"! Event on ${event.start}. Credentials will be emailed shortly.`);

      await fetch(`${API_BASE}/api/register-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: event.id, eventName: event.name, eventStart: event.start, eventEnd: event.end })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('ls_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [banksRes, statsRes, meRes] = await Promise.all([
          fetch(`${API_BASE}/api/banks`).then(r => r.json()),
          fetch(`${API_BASE}/api/stats`).then(r => r.json()),
          token ? fetch(`${API_BASE}/api/me`, { headers }).then(r => r.ok ? r.json() : null) : Promise.resolve(null)
        ]);

        setBanks(banksRes || []);
        animateCounters(statsRes || {});
        
        if (meRes) {
          setIsSubscribed(meRes.isSubscribedToAlerts || false);
          // Extract event IDs from the dedicated EventRegistration collection
          const regEventIds = (meRes.eventRegistrations || []).map(r => String(r.eventId));
          setRegisteredEvents(regEventIds);

          // Profile completion check (one-time notification)
          const profileKeys = ['name', 'email', 'bloodgroup', 'gender', 'dob', 'contact', 'address', 'city', 'state', 'pincode', 'emergencyContact', 'bio', 'profilePhoto'];
          let filled = 0;
          for (const k of profileKeys) {
            if (meRes[k] && String(meRes[k]).trim()) filled++;
          }
          const pct = Math.round((filled / profileKeys.length) * 100);
          const alreadyNotified = sessionStorage.getItem('ls_profile_notified');
          if (pct < 100 && !alreadyNotified) {
            sessionStorage.setItem('ls_profile_notified', 'true');
            setTimeout(() => showNotification(`Your profile is ${pct}% complete. Complete it to help blood banks reach you faster!`), 2000);
          }
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    }
    load();
  }, []);

  // Socket.io
  useEffect(() => {
    socketRef.current = io(API_BASE);
    const s = socketRef.current;
    s.on("bankUpdated", (p) => setBanks(prev => prev.map(b => String(b._id) === String(p.bankId) ? { ...b, stock: p.stock } : b)));
    return () => s.disconnect();
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos =>
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {}
    );
  }, []);

  // Three.js
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

  // Auto-rotate main carousel
  useEffect(() => {
    const id = setInterval(() => {
      setCarouselIndex(p => (p + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(id);
  }, [carouselImages.length]);

  // Auto-rotate impact carousel
  const impactImages = ['/img/impact_1.png', '/img/impact_2.png', '/img/impact_3.png', '/img/impact_4.png'];
  const [impactIndex, setImpactIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setImpactIndex(p => (p + 1) % impactImages.length);
    }, 3500);
    return () => clearInterval(id);
  }, [impactImages.length]);

  function animateCounters(targets = {}) {
    const startTime = performance.now();
    const duration = 1400;
    const to = { u: targets.totalUsers || 0, d: targets.totalDonationsLiters || 0, l: targets.liveNow || 0 };
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = x => 1 - Math.pow(1 - x, 3);
      setUsersCount(Math.floor(ease(t) * to.u));
      setDonationsCount(Math.floor(ease(t) * to.d));
      setLiveNowCount(Math.floor(ease(t) * to.l));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function calcDistanceKm(userLat, userLng, bankCoords) {
    const toRad = d => (d * Math.PI) / 180;
    const [lng, lat] = bankCoords;
    const R = 6371;
    const a = Math.sin(toRad(lat - userLat) / 2) ** 2
      + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(toRad(lng - userLng) / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const fmt = n => (n || 0).toLocaleString();

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden selection:bg-red-500/30 transition-colors duration-300" style={{ background: 'var(--ls-bg)', color: 'var(--ls-text)' }}>
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

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] font-bold text-sm text-center flex items-center justify-center animate-[bounce_1s_ease-in-out_infinite]" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', borderWidth: '1px', color: 'var(--ls-text)' }}>
          ✨ {notification}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="backdrop-blur-xl border rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center text-center transform transition-transform hover:scale-[1.02]" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
            <div className="font-semibold text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--ls-text-sub)' }}>Registered Users</div>
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{fmt(usersCount)}</div>
          </div>
          <div className="backdrop-blur-xl border rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center text-center transform transition-transform hover:scale-[1.02]" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
            <div className="font-semibold text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--ls-text-sub)' }}>Liters Donated</div>
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{fmt(donationsCount)}</div>
          </div>
          <div className="backdrop-blur-xl border rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center text-center transform transition-transform hover:scale-[1.02]" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
            <div className="font-semibold text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--ls-text-sub)' }}>People Online Now</div>
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">{fmt(liveNowCount)}</div>
          </div>
        </div>

        {/* MAIN GRID - Using flex on mobile for custom ordering, and CSS Grid for desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start relative">
          
          {/* 1. CLOCK (Mobile: Order 1, Desktop: Right Column Row 1) */}
          <div className="order-1 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 w-full">
            <div className="backdrop-blur-xl border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <div className="text-4xl font-black tracking-tight mb-1" style={{ color: 'var(--ls-text)' }}>{clockData.time}</div>
              <div className="text-sm font-medium text-red-500 uppercase tracking-widest">{clockData.day}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--ls-text-sub)' }}>{clockData.fullDate}</div>
            </div>
          </div>

          {/* 2. IMPACT CAROUSEL (Mobile: Order 2, Desktop: Right Column Row 2) */}
          <div className="order-2 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-2 w-full">
            <div className="relative w-full h-[220px] rounded-3xl overflow-hidden shadow-2xl border" style={{ borderColor: 'var(--ls-border)', background: 'var(--ls-bg-alt)' }}>
              {impactImages.map((src, i) => (
                <img 
                  key={i} 
                  src={src} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === impactIndex ? 'opacity-100' : 'opacity-0'}`} 
                  alt={`Impact Slide ${i}`} 
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5 pointer-events-none">
                <h3 className="text-xl font-black text-white tracking-tight">Every Drop Matters</h3>
                <p className="text-zinc-300 text-xs mt-1">Your donation is their survival.</p>
              </div>
            </div>
          </div>

          {/* 3. CAROUSEL (Mobile: Order 3, Desktop: Left Column Row 1) */}
          <div className="order-3 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-1 w-full">
            <div className="relative w-full h-[260px] md:h-[400px] rounded-[32px] overflow-hidden shadow-2xl border" style={{ borderColor: 'var(--ls-border)', background: 'var(--ls-bg-alt)' }}>
              {carouselImages.map((src, i) => (
                <img 
                  key={i} 
                  src={src} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === carouselIndex ? 'opacity-100' : 'opacity-0'}`} 
                  alt={`Slide ${i}`} 
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10 pointer-events-none">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Save Lives Today</h2>
                <p className="text-zinc-300 md:text-lg max-w-lg">Your blood donation can give a precious smile to someone's face. Connect instantly with local blood banks.</p>
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {carouselImages.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCarouselIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === carouselIndex ? 'w-8 bg-red-500' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 4. CAMPAIGNS (Mobile: Order 4, Desktop: Right Column Row 3) */}
          <div className="order-4 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-3 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--ls-text)' }}>📣 Active Campaigns</h3>
              {registeredEvents.length > 0 && (
                <span className="text-xs font-black bg-red-500 text-white px-2 py-1 rounded-full shadow-md animate-pulse">
                  {registeredEvents.length} Pending
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              {campaigns.map(c => {
                const isReg = registeredEvents.includes(String(c.id));
                return (
                <div key={c.id} className="backdrop-blur-md border rounded-2xl p-5 shadow-lg" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold" style={{ color: 'var(--ls-text)' }}>{c.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                      c.urgency === 'urgent' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 
                      c.urgency === 'moderate' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' : 
                      'bg-green-500/10 text-green-500 border border-green-500/30'
                    }`}>
                      {c.urgency}
                    </span>
                  </div>
                  <div className="text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--ls-text-sub)' }}><span>📍</span> {c.location}</div>
                  <div className="text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--ls-text-sub)' }}><span>⏱️</span> Starts: {c.start}</div>
                  <div className="text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--ls-text-sub)' }}><span>⏳</span> Ends: {c.end}</div>
                  <div className="text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--ls-text-sub)' }}><span>🩸</span> {c.need}</div>
                  <button 
                    onClick={() => handleRegisterEvent(c)}
                    disabled={isReg}
                    className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-all border ${isReg ? 'opacity-90 cursor-default shadow-inner' : 'hover:shadow-md'}`}
                    style={{ 
                      background: isReg ? '#22c55e' : 'var(--ls-bg-alt)', 
                      color: isReg ? '#fff' : 'var(--ls-text)', 
                      borderColor: isReg ? '#22c55e' : 'var(--ls-border)' 
                    }}>
                    {isReg ? 'Registered ✓' : 'Register Interest'}
                  </button>
                </div>
              )})}
            </div>
          </div>

          {/* 5. BLOOD BANKS (Mobile: Order 5, Desktop: Left Column Row 2 spanning down) */}
          <div className="order-5 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:row-span-4 w-full">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <h2 className="text-xl font-bold" style={{ color: 'var(--ls-text)' }}>Nearby Blood Banks</h2>
              </div>
            </div>
            
            {banks.length === 0 ? (
              <div className="text-center py-8 rounded-3xl border" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', color: 'var(--ls-text-sub)' }}>No banks found in your area.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {banks.map((b, idx) => {
                  const dist = userLocation
                    ? calcDistanceKm(userLocation.lat, userLocation.lng, b.location.coordinates).toFixed(1) + ' km'
                    : '—';
                  const totalUnits = Object.values(b.stock || {}).reduce((a, c) => a + (c || 0), 0);
                  const isHiddenOnMobile = !showAllBanks && idx >= 3;
                  
                  return (
                    <div 
                      key={b._id} 
                      onClick={() => navigate(`/bloodbank/${b._id}`)}
                      className={`backdrop-blur-md border rounded-2xl p-4 sm:p-5 justify-between items-start cursor-pointer transition-all duration-200 group shadow-lg hover:scale-[1.01] ${isHiddenOnMobile ? 'hidden lg:flex' : 'flex gap-3 sm:gap-4'}`}
                      style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-bold text-base sm:text-lg group-hover:text-red-500 transition-colors truncate" style={{ color: 'var(--ls-text)' }}>{b.name}</span>
                        <span className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: 'var(--ls-text-sub)' }}>{b.address}</span>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 gap-1.5">
                        <span className="font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">{totalUnits} units</span>
                        <span className="text-[11px] sm:text-xs font-semibold flex items-center gap-1 whitespace-nowrap" style={{ color: 'var(--ls-text-sub)' }}>📍 {dist}</span>
                      </div>
                    </div>
                  );
                })}
                
                {banks.length > 3 && (
                  <button 
                    onClick={() => setShowAllBanks(!showAllBanks)}
                    className="lg:hidden mt-2 text-sm font-semibold py-3 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-md flex justify-center items-center gap-2"
                    style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}
                  >
                    {showAllBanks ? (
                      <><span>View Less</span><span>↑</span></>
                    ) : (
                      <><span>View More Blood Banks ({banks.length - 3}+)</span><span>↓</span></>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 7. QUICK ACTIONS (Mobile: Order 7, Desktop: Right Column Row 5, Sticky on Desktop) */}
          <div className="order-7 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-5 w-full lg:sticky lg:top-24">
            <div className="backdrop-blur-xl border rounded-3xl p-6 shadow-xl" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ls-text)' }}>⚡ Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <Link to="/requestblood" className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 font-bold py-3.5 px-6 rounded-xl text-center transition-all shadow-[0_8px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_12px_25px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 flex justify-center items-center gap-2" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  🩸 Request Blood
                </Link>
                <Link to="/registerdonor" className="font-bold py-3.5 px-6 rounded-xl text-center transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2 border hover:shadow-md" style={{ background: 'var(--ls-bg-alt)', borderColor: 'var(--ls-border)', color: 'var(--ls-text)' }}>
                  ➕ Register as Donor
                </Link>
              </div>
            </div>
          </div>

          {/* 6. ALERTS (Mobile: Order 6, Desktop: Right Column Row 4) */}
          <div className="order-6 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-4 w-full">
            <div className="backdrop-blur-xl border rounded-3xl p-6 shadow-xl text-center" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
              <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2" style={{ color: 'var(--ls-text)' }}>💌 Campaign Alerts</h3>
              <p className="text-xs mb-4 px-2" style={{ color: 'var(--ls-text-sub)' }}>Receive detailed emails about urgent blood needs in your area.</p>
              
              <button 
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className={`w-full font-bold py-3 rounded-xl transition-all duration-500 shadow-md transform ${
                  isSubscribed 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)]' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_8px_20px_rgba(220,38,38,0.3)]'
                }`}
              >
                {isSubscribing ? 'Processing...' : isSubscribed ? 'Subscribed ✓' : 'Subscribe to Alerts'}
              </button>
            </div>
          </div>

        </div>

        {/* INFO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
          {[
            { icon: '💡', title: 'How it works', body: 'Register, find donors or blood banks, book an appointment, and donate to save lives.' },
            { icon: '✅', title: 'Eligibility', body: '18–65 yrs old, healthy, minimum weight ~50 kg. Check with local guidelines before donating.' },
            { icon: '🚨', title: 'Emergency', body: 'Use "Request Blood" to instantly notify nearby donors and blood banks in real-time.' },
          ].map(c => (
            <div key={c.title} className="backdrop-blur-sm border rounded-2xl p-6 flex flex-col shadow-lg" style={{ background: 'var(--ls-surface)', borderColor: 'var(--ls-border)' }}>
              <div className="text-3xl mb-3">{c.icon}</div>
              <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--ls-text)' }}>{c.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ls-text-sub)' }}>{c.body}</p>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium" style={{ borderColor: 'var(--ls-border)', color: 'var(--ls-text-sub)' }}>
          <div className="flex flex-col items-center md:items-start gap-1">
            <div>© {new Date().getFullYear()} lifeStream Blood Network. All rights reserved.</div>
            <div className="flex gap-4 mt-2">
              <a href="https://privacy-policy-five-topaz.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">Terms & Conditions</a>
              <span className="opacity-50">•</span>
              <a href="https://deletion-instructions.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">Account Deletion</a>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2.5">
            <div className="flex items-center gap-1.5 bg-red-500/10 px-5 py-2 rounded-full border border-red-500/20 shadow-sm transition-all hover:bg-red-500/20">
              <span>Created by</span>
              <span className="text-red-500 font-black tracking-wide ml-0.5">Utkarsh Raj</span>
              <a 
                href="https://www.linkedin.com/in/utkarsh-raj-877bb4298/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 hover:scale-110 transition-transform flex items-center justify-center bg-white rounded-sm p-[1px]"
                aria-label="LinkedIn Profile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
            <div className="text-[11px] text-center md:text-right font-medium tracking-wide">
              Computer Science Engineer <br className="md:hidden" />
              <span className="opacity-70">(Specialised in MERN and PERN)</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}