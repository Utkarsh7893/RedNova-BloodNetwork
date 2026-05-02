import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { FiArrowLeft, FiActivity } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

const IMAGES = [
  "/img/login_carousel_1_1777551484998.png",
  "/img/login_carousel_2_1777551500588.png",
  "/img/login_carousel_3_1777551532337.png"
];

export default function ForgotPage() {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const int = setInterval(() => {
      setCarouselIdx(p => (p + 1) % IMAGES.length);
    }, 4000);
    return () => clearInterval(int);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email.");
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) throw new Error("Failed to send");

      setShowSuccess(true);
      setEmail('');
      
      // Auto-hide popup and redirect after 4 seconds
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/login');
      }, 4000);

    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const styleTag = `
    @keyframes slide-up-form {
      from { opacity: 0; transform: translateY(60px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in-carousel {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes popup-fade-in {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes ls-spin {
      to { transform: rotate(360deg); }
    }
    .ls-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: ls-spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes form-switch {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .forgot-link {
      color: var(--ls-crimson);
      cursor: pointer;
      font-weight: 500;
      transition: 0.2s;
    }
    .forgot-link:hover {
      color: var(--ls-crimson-lt);
    }
    .btn-danger {
      background: var(--ls-grad-crimson);
      border: none;
      font-weight: 700;
      box-shadow: 0 10px 28px rgba(198, 40, 40, 0.35);
      border-radius: 12px;
      padding: 12px;
      font-size: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(198, 40, 40, 0.50);
    }
    .btn-danger:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    .ls-form-input {
      width: 100%; padding: 12px 16px; border-radius: 11px;
      border: 1.5px solid var(--ls-border); background: var(--ls-bg-alt); color: var(--ls-text);
      font-size: 14.5px; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
      margin-bottom: 4px;
    }
    .ls-form-input:focus { border-color: var(--ls-crimson); box-shadow: 0 0 0 3px rgba(198,40,40,0.15); }
    .ls-form-input::placeholder { color: var(--ls-text-muted); }
    
    .eye-icon { position: absolute; right: 14px; top: 12px; cursor: pointer; color: var(--ls-text-sub); }
    
    .login-container { 
      display: flex; 
      height: 100vh; 
      width: 100vw; 
      overflow: hidden; 
      background: var(--ls-bg);
      position: relative; 
    }

    .desktop-bg-layer { display: none; }
    .desktop-bg-overlay { display: none; }
    @media(min-width: 900px) {
      .desktop-bg-layer {
        display: block; position: absolute; inset: 0; z-index: 0;
        background: url('/img/front_blood_bg_1777551469033.png') center/cover no-repeat;
      }
      .desktop-bg-overlay {
        display: block; position: absolute; inset: 0; z-index: 0;
        background: var(--ls-bg); opacity: 0.85;
      }
    }
    
    .three-canvas-container {
      position: absolute; pointer-events: none; z-index: 1; overflow: hidden;
    }
    @media(min-width: 900px) {
      .three-canvas-container { top: 0; bottom: 0; right: 0; width: 50%; }
    }
    @media(max-width: 899px) {
      .three-canvas-container { bottom: 0; left: 0; right: 0; height: 65vh; }
    }

    .carousel-col { flex: 1; display: none; position: relative; overflow: hidden; }
    @media(min-width: 900px) { .carousel-col { display: block; } }
    .carousel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease; }
    .carousel-img.active { opacity: 1; }
    .carousel-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }
    
    .form-col { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; padding: 20px; }

    .form-card {
      width: 100%; max-width: 460px; background: var(--ls-surface);
      backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-radius: 20px; border: 1px solid var(--ls-border); box-shadow: var(--ls-shadow-lg);
      display: flex; flex-direction: column; gap: 12px; padding: 24px;
      animation: form-switch 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .back-home-btn {
      position: absolute; top: 18px; right: 24px; z-index: 30; display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 50px; border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(0, 0, 0, 0.35); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; text-decoration: none; transition: all 0.3s ease;
    }
    .back-home-btn:hover { background: rgba(198,40,40,0.5); border-color: #FF1744; transform: translateX(-4px); }

    .mobile-carousel-bg { display: none; }
    @media(max-width: 899px) {
      .login-container { flex-direction: column; overflow: hidden; position: relative; height: 100vh; height: 100dvh; }
      .mobile-carousel-bg { display: block; position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; animation: fade-in-carousel 1.2s ease both; }
      .mobile-carousel-bg .carousel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1.2s ease; }
      .mobile-carousel-bg .carousel-img.active { opacity: 1; }
      .mobile-carousel-fade { position: absolute; inset: 0; z-index: 2; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.5) 55%, var(--ls-bg) 85%); }
      .mobile-carousel-headline { position: absolute; top: 60px; left: 20px; right: 20px; z-index: 5; animation: fade-in-carousel 1.5s 0.3s ease both; }
      .mobile-carousel-headline h3 { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 22px; color: #fff; margin: 0 0 6px 0; text-shadow: 0 2px 12px rgba(0,0,0,0.5); line-height: 1.3; }
      .mobile-carousel-headline p { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; max-width: 280px; text-shadow: 0 1px 6px rgba(0,0,0,0.3); }
      .mobile-carousel-dots { position: absolute; top: 20px; left: 20px; z-index: 10; display: flex; gap: 6px; }
      .mobile-carousel-dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: all 0.3s; }
      .mobile-carousel-dots span.active { background: #FF1744; width: 22px; border-radius: 4px; }
      
      .form-col {
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; padding: 30px 20px 40px;
        max-height: calc(100dvh - 165px); display: block; overflow-y: auto; -webkit-overflow-scrolling: touch;
        animation: slide-up-form 0.8s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 20px, black 70px, black 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 20px, black 70px, black 100%);
      }
      .form-card { max-width: 100%; margin: 0 auto; gap: 10px; padding: 20px 18px; }
      .back-home-btn { top: 14px; right: 14px; padding: 8px 16px; font-size: 13px; }
    }
  `;

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pointLight = new THREE.PointLight(0xFF1744, 1.5, 20);
    pointLight.position.set(0, 4, 4);
    scene.add(pointLight);

    const dropGroup = new THREE.Group();
    scene.add(dropGroup);
    const dropCount = 150;
    const dropGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const dropMat = new THREE.MeshPhongMaterial({
      color: 0xB71C1C, emissive: 0x7f0000, emissiveIntensity: 0.3,
      shininess: 90, transparent: true, opacity: 0.75,
    });

    const drops = [];
    for (let i = 0; i < dropCount; i++) {
      const mesh = new THREE.Mesh(dropGeo, dropMat.clone());
      mesh.position.set((Math.random() - 0.5) * 14, Math.random() * 10 - 2, (Math.random() - 0.5) * 6);
      mesh.material.opacity = 0.45 + Math.random() * 0.45;  
      const scale = 0.6 + Math.random() * 1.5;
      mesh.scale.set(scale, scale * 1.4, scale); 
      mesh.userData = { speed: 0.005 + Math.random() * 0.015, drift: (Math.random() - 0.5) * 0.003, wobble: Math.random() * Math.PI * 2 };
      dropGroup.add(mesh);
      drops.push(mesh);
    }

    const glowCount = 120;
    const glowPositions = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount; i++) {
      glowPositions[i * 3] = (Math.random() - 0.5) * 16;
      glowPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      glowPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    const glowMat = new THREE.PointsMaterial({ color: 0xE57373, size: 0.06, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Points(glowGeo, glowMat));

    let frame = 0;
    const animate = () => {
      frame += 0.01;
      drops.forEach(d => {
        d.position.y -= d.userData.speed;
        d.position.x += Math.sin(frame * 2 + d.userData.wobble) * d.userData.drift;
        d.rotation.z = Math.sin(frame + d.userData.wobble) * 0.15;
        if (d.position.y < -6) { d.position.y = 8; d.position.x = (Math.random() - 0.5) * 14; }
      });
      const arr = glowGeo.attributes.position.array;
      for (let i = 0; i < glowCount; i++) {
        arr[i * 3 + 1] += Math.sin(frame + i) * 0.0005 - 0.001;
        if (arr[i * 3 + 1] < -6) arr[i * 3 + 1] = 6;
      }
      glowGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <style>{styleTag}</style>

      <div className="login-container">
        <div className="desktop-bg-layer" />
        <div className="desktop-bg-overlay" />
        <div ref={mountRef} className="three-canvas-container" />

        <div style={{ position: 'absolute', top: 20, left: 28, fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, background: 'var(--ls-grad-crimson)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiActivity size={24} style={{ color: '#FF1744' }} /> lifeStream
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>
          <FiArrowLeft size={18} /> Back to Home
        </button>

        <div className="mobile-carousel-bg">
          {IMAGES.map((img, idx) => (
            <img key={img} src={img} className={`carousel-img ${idx === carouselIdx ? 'active' : ''}`} alt="Blood Donation" />
          ))}
          <div className="mobile-carousel-fade" />
          <div className="mobile-carousel-headline">
            <h3>Save Lives,<br />Join lifeStream</h3>
            <p>Your donation connects patients, donors, and hospitals instantly.</p>
          </div>
          <div className="mobile-carousel-dots">
            {IMAGES.map((_, idx) => (
              <span key={idx} className={idx === carouselIdx ? 'active' : ''} />
            ))}
          </div>
        </div>

        <div className="carousel-col">
          {IMAGES.map((img, idx) => (
            <img key={img} src={img} className={`carousel-img ${idx === carouselIdx ? 'active' : ''}`} alt="Blood Donation" />
          ))}
          <div className="carousel-overlay">
            <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '3rem', marginBottom: '10px' }}>Save Lives, Join lifeStream</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '500px' }}>
              Your contribution connects patients, donors, and hospitals instantly. Together, we can ensure blood is always available where it's needed most.
            </p>
          </div>
        </div>

        <div className="form-col">
          <form className="form-card" onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--ls-text)' }}>
                Forgot Password?
              </div>
              <div style={{ fontSize: 13, color: 'var(--ls-text-muted)', marginTop: 4 }}>Enter your email and we'll send you a reset link.</div>
            </div>

            <input type="email" className="ls-form-input mt-2" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            
            <button type="submit" className="btn btn-danger w-100 mt-2" disabled={isLoading}>
              {isLoading ? <><span className="ls-spinner" style={{ marginRight: 8 }}></span> Sending...</> : "Send Reset Link"}
            </button>

            <p className="text-center" style={{ textAlign: 'center', margin: '8px 0 0', fontSize: 14, color: 'var(--ls-text-sub)' }}>
              <span className="forgot-link" onClick={() => navigate('/login')}>← Back to Login</span>
            </p>
          </form>
        </div>
      </div>

      {/* SUCCESS POPUP OVERLAY */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fade-in-carousel 0.4s ease' }}>
          <div style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '24px', padding: '32px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 24px 48px rgba(255,23,68,0.25)', animation: 'popup-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨💌</div>
            <h3 style={{ margin: '0 0 12px 0', fontFamily: "'Manrope', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--ls-text)' }}>Check your inbox!</h3>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--ls-text-sub)', lineHeight: 1.5 }}>
              You'll receive a secure reset link within a few minutes.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
