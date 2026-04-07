import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const API_BASE = "import.meta.env.VITE_API_URL";

export default function Contact() {
  /* ================= THREE.JS BACKGROUND ================= */
  const bgRef = useRef(null);

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
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaa2b2b,
      size: 0.12,
      opacity: 0.85,
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
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
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
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitForm = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Your message has been sent successfully!");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMsg("Failed to send message. Please try again.");
      }
    } catch {
      setErrorMsg("Server error. Please try again later.");
    }
  };

  return (
    <>
      <style>{`
        .contact-page {
          min-height: 100vh;
          padding: 70px 20px;
          font-family: Inter, system-ui, -apple-system, Roboto;

          background:
            radial-gradient(circle at top left, rgba(255,180,180,0.35), transparent 45%),
            linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
        }

        .contact-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .contact-wrapper {
          position: relative;
          z-index: 5;
          max-width: 1100px;
          margin: auto;
        }

        .contact-card {
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.7),
            rgba(255,220,220,0.5)
          );
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25);
          animation: glowPulse 6s ease-in-out infinite;
        }

        .contact-title {
          color: #b71c1c;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .contact-subtitle {
          color: #7b1e1e;
          opacity: 0.85;
          margin-bottom: 28px;
        }

        .contact-info-box {
          background: rgba(255,245,245,0.8);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 28px;
        }

        .contact-info-item {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          font-size: 15px;
        }

        .contact-info-item a {
          color: #b71c1c;
          text-decoration: none;
        }

        .contact-info-item a:hover {
          text-decoration: underline;
        }

        .form-label {
          font-weight: 600;
          font-size: 14px;
          color: #6b1414;
        }

        .btn-main {
          margin-top: 16px;
          padding: 14px;
          border-radius: 14px;
          border: none;
          cursor: pointer;

          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          color: white;
          font-weight: 700;

          box-shadow:
            0 12px 28px rgba(183,28,28,0.45),
            inset 0 -2px 0 rgba(0,0,0,0.15);

          transition: all 0.25s ease;
        }

        .btn-main:hover {
          transform: translateY(-3px);
          box-shadow:
            0 18px 45px rgba(183,28,28,0.65),
            0 0 22px rgba(255,120,120,0.55);
        }

        .btn-main:active {
          transform: scale(0.97);
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 rgba(255,120,120,0.25); }
          50% { box-shadow: 0 0 45px rgba(255,120,120,0.45); }
          100% { box-shadow: 0 0 0 rgba(255,120,120,0.25); }
        }

        .whatsapp-float {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;

          width: 60px;
          height: 60px;
          border-radius: 50%;

          background: linear-gradient(135deg, #25d366, #1ebe57);
          color: white;
          font-size: 26px;

          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;

          box-shadow:
            0 12px 28px rgba(37, 211, 102, 0.55),
            0 0 0 rgba(37, 211, 102, 0.4);

          transition: all 0.3s ease;
          animation: whatsappPulse 3s infinite;
        }

        .whatsapp-float:hover {
          transform: translateY(-6px) scale(1.05);

          box-shadow:
            0 18px 45px rgba(37, 211, 102, 0.75),
            0 0 22px rgba(37, 211, 102, 0.7);
        }

        .whatsapp-float:active {
          transform: scale(0.95);
        }

        @keyframes whatsappPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5);
          }
          70% {
            box-shadow: 0 0 0 18px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }

        .whatsapp-tooltip {
          position: absolute;
          right: 70px;
          background: #1ebe57;
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 13px;
          white-space: nowrap;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.25s ease;
          pointer-events: none;
        }

        .whatsapp-float:hover .whatsapp-tooltip {
          opacity: 1;
          transform: translateY(0);
        }


      `}</style>

      <div className="contact-page">
        <div ref={bgRef} className="contact-bg" />

        <div className="contact-wrapper">
          <div className="contact-card">
            <h3 className="contact-title">Contact BloodCare</h3>
            <p className="contact-subtitle">
              We’re here to help. Reach out for support, partnerships, or urgent assistance.
            </p>

            <div className="contact-info-box">
              <div className="contact-info-item">🏢 123 Donation Street, Health City</div>
              <div className="contact-info-item">📩 support@bloodcare.org</div>
              <div className="contact-info-item">📞 +91 123 456 7890</div>
              <div className="contact-info-item">⏰ Mon – Sat, 9 AM – 7 PM</div>
            </div>

            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <form onSubmit={submitForm}>
              <input className="form-control mb-3" name="name" placeholder="Full Name" required value={form.name} onChange={update} />
              <input className="form-control mb-3" name="email" type="email" placeholder="Email Address" required value={form.email} onChange={update} />
              <input className="form-control mb-3" name="subject" placeholder="Subject" required value={form.subject} onChange={update} />
              <textarea className="form-control mb-3" rows="5" name="message" placeholder="Message" required value={form.message} onChange={update} />

              <button className="btn-main w-100">📤 Send Message</button>
            </form>
          </div>
        </div>
        <a
          href="https://wa.me/9219369399?text=Hello%20BloodCare,%20I%20need%20assistance."
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float"
        >
          <span className="whatsapp-tooltip">Chat with us</span>
          💬
        </a>
      </div>
      
    </>
  );
}
