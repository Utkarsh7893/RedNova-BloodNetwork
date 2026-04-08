import React, { useEffect, useState, useRef } from "react";
import { fetchRandomImage } from "./api";
import * as THREE from "three";

const API_BASE = import.meta.env.VITE_API_URL;

export default function Events() {
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    (async () => setImageUrl(await fetchRandomImage()))();
  }, []);

  const [events, setEvents] = useState([]);
  const bgRef = useRef(null);

  /* ================= FETCH EVENTS ================= */
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setEvents(data);
        else {
          setEvents([
            {
              _id: "1",
              title: "Blood Donation Camp – City Hospital",
              date: "2025-02-12",
              location: "City Hospital, Main Block",
              description:
                "A community-driven event to raise awareness and support emergency patients.",
              image:
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
            },
            {
              _id: "2",
              title: "Health & Wellness Marathon",
              date: "2025-03-05",
              location: "Central Stadium",
              description:
                "A charity marathon to promote fitness and encourage people to donate blood regularly.",
              image:
                "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf",
            },
            {
              _id: "3",
              title: "College Awareness Seminar",
              date: "2025-03-20",
              location: "Govt. Engineering College",
              description:
                "Educating youth about blood donation & medical emergency readiness.",
              image:
                "https://images.unsplash.com/photo-1529070538774-1843cb3265df",
            },
          ]);
        }
      } catch (err) {
        console.error("Events fetch failed:", err);
      }
    }
    loadEvents();
  }, []);

  /* ================= THREE BACKGROUND ================= */
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xb71c1c,
      size: 0.13,
      opacity: 0.9,
      transparent: true,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    let raf;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0009 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <style>{`

        html, body {
            height: auto !important;
            overflow-y: auto !important;
        }
        .events-page {
          min-height: 100vh;
          padding-bottom: 60px;
          font-family: Inter, system-ui, -apple-system, Roboto;
          background:
            radial-gradient(circle at top left, rgba(255,180,180,0.35), transparent 45%),
            linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
        }

        .events-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .events-content {
          position: relative;
          z-index: 5;
          max-width: 1560px;
          margin: auto;
          padding: 36px 22px 70px;
        }

        .events-hero {
          height: 360px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 28px 70px rgba(0,0,0,0.28);
          animation: glowPulse 6s ease-in-out infinite;
        }

        .events-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .events-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55));
        }

        .events-hero-text {
          position: absolute;
          bottom: 36px;
          left: 40px;
          color: white;
          z-index: 2;
        }

        .events-section-title {
          font-weight: 800;
          color: #6b1414;
          margin-bottom: 18px;
        }

        /* ===== EVENT CARD FIX ===== */
        .event-card {
          height: 100%;
          display: flex;
          flex-direction: column;

          border-radius: 18px;
          padding: 16px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.65),
            rgba(255,220,220,0.45)
          );
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 45px rgba(0,0,0,0.18);
          transition: 0.25s ease;
        }

        .event-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 26px 65px rgba(0,0,0,0.28);
          animation: glowPulse 2.5s ease-in-out infinite;
        }

        .event-img {
          height: 190px;
          border-radius: 14px;
          object-fit: cover;
          margin-bottom: 12px;
        }

        .event-title {
          font-size: 20px;
          font-weight: 800;
          color: #b71c1c;
        }

        .event-meta {
          font-size: 14px;
          color: #7b1e1e;
          margin-bottom: 8px;
        }

        .event-cta {
          margin-top: auto;
          padding: 12px 16px;
          border-radius: 14px;
          border: none;
          cursor: pointer;

          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          color: white;
          font-weight: 700;
          font-size: 14px;

          box-shadow:
            0 10px 26px rgba(183,28,28,0.45),
            inset 0 -2px 0 rgba(0,0,0,0.15);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            filter 0.25s ease;
        }

        /* ✨ Hover state */
        .event-cta:hover {
          transform: translateY(-3px);
          filter: brightness(1.05);

          box-shadow:
            0 18px 45px rgba(183,28,28,0.65),
            0 0 22px rgba(255,120,120,0.55),
            inset 0 -2px 0 rgba(0,0,0,0.2);
        }

        /* 🔘 Click / press */
        .event-cta:active {
          transform: translateY(0) scale(0.97);

          box-shadow:
            0 8px 18px rgba(183,28,28,0.45),
            inset 0 2px 4px rgba(0,0,0,0.25);
        }

        .event-cta {
          animation: ctaPulse 4s ease-in-out infinite;
        }

        @keyframes ctaPulse {
          0%, 100% {
            box-shadow: 0 10px 26px rgba(183,28,28,0.45);
          }
          50% {
            box-shadow: 0 14px 36px rgba(255,120,120,0.6);
          }
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 rgba(255,120,120,0.2); }
          50% { box-shadow: 0 0 40px rgba(255,120,120,0.45); }
          100% { box-shadow: 0 0 0 rgba(255,120,120,0.2); }
        }
      `}</style>

      <div className="events-page">
        <div ref={bgRef} className="events-bg" />

        <div className="events-content">
          <div className="events-hero mb-4">
            <img src={imageUrl} />
            <div className="events-hero-text">
              <h2>Upcoming Events</h2>
              <div>Donate • Volunteer • Save Lives</div>
            </div>
          </div>

          <h4 className="events-section-title">Live & Upcoming Events</h4>

          <div className="row g-4">
            {events.map(ev => (
              <div className="col-md-4" key={ev._id}>
                <div className="event-card">
                  <img src={ev.image} className="event-img" />
                  <div className="event-title">{ev.title}</div>
                  <div className="event-meta">
                    📅 {new Date(ev.date).toLocaleDateString()} • 📍 {ev.location}
                  </div>
                  <p className="text-muted small">{ev.description}</p>
                  <button className="event-cta">🎟️ Register for Event</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
