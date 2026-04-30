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

export default function LoginSignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bloodgrp, setBloodgrp] = useState("Select Blood Group");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [Cpassword, setCpassword] = useState("");

  const [Vemail, setVemail] = useState("");
  const [Vpassword, setVpassword] = useState("");

  const [showSignup, setShowSignup] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const mountRef = useRef(null);

  // Auto-rotate carousel
  useEffect(() => {
    const int = setInterval(() => {
      setCarouselIdx(p => (p + 1) % IMAGES.length);
    }, 4000);
    return () => clearInterval(int);
  }, []);

  // Load Remember Me
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setVemail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handdleLogin = async (e) => {
    e.preventDefault();

    if (!Vemail || !Vpassword) {
      alert("Kindly fill all the required details");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: Vemail, password: Vpassword }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) localStorage.setItem("ls_token", data.token);
        if (data.user) localStorage.setItem("ls_user", JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", Vemail);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        alert("Login successful");
        navigate("/dashBoard");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !name ||
      !email ||
      bloodgrp === "Select Blood Group" ||
      !address ||
      !contact ||
      !password
    ) {
      alert("Kindly fill all the required details");
      return;
    }

    if (password !== Cpassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          bloodgrp,
          address,
          pincode,
          contact,
          password,
          Cpassword,
        }),
      });

      const data = await res.json();

      // ❌ Account already exists
      if (!res.ok) {
        alert(data.message || "Account already exists. Please login.");
        setShowSignup(false); // 👈 swivel back to login
        return;
      }


      // ✅ Successful signup
      alert(`Welcome ${name}`);

      setName("");
      setEmail("");
      setBloodgrp("Select Blood Group");
      setAddress("");
      setPincode("");
      setContact("");
      setPassword("");
      setCpassword("");
      setShowSignup(false);
    } catch (error) {
      alert("Server error. Please try again later.");
    }
  };


  const handdleNavigate = () => {
    navigate("/forgot");
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
    }
    .btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(198, 40, 40, 0.50);
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

    /* Desktop Image Background matching Front Page */
    .desktop-bg-layer {
      display: none;
    }
    .desktop-bg-overlay {
      display: none;
    }
    @media(min-width: 900px) {
      .desktop-bg-layer {
        display: block;
        position: absolute;
        inset: 0;
        z-index: 0;
        background: url('/img/front_blood_bg_1777551469033.png') center/cover no-repeat;
      }
      .desktop-bg-overlay {
        display: block;
        position: absolute;
        inset: 0;
        z-index: 0;
        background: var(--ls-bg);
        opacity: 0.85; /* Light/Dark tint matching front page */
      }
    }
    
    /* Three.js Container constrained to form area */
    .three-canvas-container {
      position: absolute;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }
    @media(min-width: 900px) {
      .three-canvas-container {
        top: 0;
        bottom: 0;
        right: 0;
        width: 50%; /* Right half */
      }
    }
    @media(max-width: 899px) {
      .three-canvas-container {
        bottom: 0;
        left: 0;
        right: 0;
        height: 65vh; /* Bottom 65% matching form height */
      }
    }

    /* Desktop carousel */
    .carousel-col { flex: 1; display: none; position: relative; overflow: hidden; }
    @media(min-width: 900px) { .carousel-col { display: block; } }
    .carousel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease; }
    .carousel-img.active { opacity: 1; }
    .carousel-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }
    
    .form-col { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; padding: 20px; }

    /* Form card shared style */
    .form-card {
      width: 100%;
      max-width: 460px;
      background: var(--ls-surface);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-radius: 20px;
      border: 1px solid var(--ls-border);
      box-shadow: var(--ls-shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
      animation: form-switch 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Back to Home button */
    .back-home-btn {
      position: absolute;
      top: 18px;
      right: 24px;
      z-index: 30;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .back-home-btn:hover {
      background: rgba(198,40,40,0.5);
      border-color: #FF1744;
      color: #fff;
      transform: translateX(-4px);
      box-shadow: 0 4px 16px rgba(255,23,68,0.4);
    }

    /* Mobile carousel - FULL BACKGROUND */
    .mobile-carousel-bg {
      display: none;
    }
    @media(max-width: 899px) {
      .login-container {
        flex-direction: column;
        overflow: hidden; /* No scrolling at all */
        position: relative;
        height: 100vh;
        height: 100dvh;
      }
      /* Full-screen carousel as background */
      .mobile-carousel-bg {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        animation: fade-in-carousel 1.2s ease both;
      }
      .mobile-carousel-bg .carousel-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 1.2s ease;
      }
      .mobile-carousel-bg .carousel-img.active {
        opacity: 1;
      }
      /* Gradient overlay: transparent at top → dark at bottom */
      .mobile-carousel-fade {
        position: absolute;
        inset: 0;
        z-index: 2;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0,0,0,0.15) 25%,
          rgba(0,0,0,0.5) 55%,
          var(--ls-bg) 85%
        );
      }
      /* Carousel headline overlay */
      .mobile-carousel-headline {
        position: absolute;
        top: 60px;
        left: 20px;
        right: 20px;
        z-index: 5;
        animation: fade-in-carousel 1.5s 0.3s ease both;
      }
      .mobile-carousel-headline h3 {
        font-family: 'Poppins', sans-serif;
        font-weight: 800;
        font-size: 22px;
        color: #fff;
        margin: 0 0 6px 0;
        text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        line-height: 1.3;
      }
      .mobile-carousel-headline p {
        font-size: 13px;
        color: rgba(255,255,255,0.8);
        margin: 0;
        max-width: 280px;
        text-shadow: 0 1px 6px rgba(0,0,0,0.3);
      }
      /* Dots */
      .mobile-carousel-dots {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 10;
        display: flex;
        gap: 6px;
      }
      .mobile-carousel-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.4);
        transition: all 0.3s;
      }
      .mobile-carousel-dots span.active {
        background: #FF1744;
        width: 22px;
        border-radius: 4px;
      }
      /* Form column — locked in viewport, scrollable internally */
      .form-col {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
        padding: 0 20px 24px;
        max-height: 65vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        animation: slide-up-form 0.8s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        /* Smooth fade mask at top edge to hide harsh clip */
        mask-image: linear-gradient(to bottom, transparent 0%, black 24px, black 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 24px, black 100%);
      }
      .form-card {
        max-width: 100%;
        gap: 10px;
        padding: 20px 18px;
      }
      .back-home-btn {
        top: 14px;
        right: 14px;
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  `;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );

    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Soft ambient light for depth on plasma drops
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pointLight = new THREE.PointLight(0xFF1744, 1.5, 20);
    pointLight.position.set(0, 4, 4);
    scene.add(pointLight);

    // Create plasma-like droplets — thick, rigid, visible
    const dropGroup = new THREE.Group();
    scene.add(dropGroup);

    const dropCount = 150; // Increased density
    const dropGeo = new THREE.SphereGeometry(0.06, 12, 12); // Back to small size
    const dropMat = new THREE.MeshPhongMaterial({
      color: 0xB71C1C,
      emissive: 0x7f0000,
      emissiveIntensity: 0.3,
      shininess: 90,
      transparent: true,
      opacity: 0.75,
    });

    const drops = [];
    for (let i = 0; i < dropCount; i++) {
      const mesh = new THREE.Mesh(dropGeo, dropMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 14,
        Math.random() * 10 - 2,
        (Math.random() - 0.5) * 6
      );
      mesh.material.opacity = 0.45 + Math.random() * 0.45;  
      const scale = 0.6 + Math.random() * 1.5;  // Smaller scale multiplier
      mesh.scale.set(scale, scale * 1.4, scale); 
      mesh.userData = {
        speed: 0.005 + Math.random() * 0.015,
        drift: (Math.random() - 0.5) * 0.003,
        wobble: Math.random() * Math.PI * 2,
      };
      dropGroup.add(mesh);
      drops.push(mesh);
    }

    // Soft ambient glow particles
    const glowCount = 120;
    const glowPositions = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount; i++) {
      glowPositions[i * 3] = (Math.random() - 0.5) * 16;
      glowPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      glowPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    const glowMat = new THREE.PointsMaterial({
      color: 0xE57373,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
    });
    scene.add(new THREE.Points(glowGeo, glowMat));

    let frame = 0;
    const animate = () => {
      frame += 0.01;

      // Animate plasma drops falling
      drops.forEach(d => {
        d.position.y -= d.userData.speed;
        d.position.x += Math.sin(frame * 2 + d.userData.wobble) * d.userData.drift;
        d.rotation.z = Math.sin(frame + d.userData.wobble) * 0.15;

        // Reset to top when out of view
        if (d.position.y < -6) {
          d.position.y = 8;
          d.position.x = (Math.random() - 0.5) * 14;
        }
      });

      // Slowly drift ambient glow
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

      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, []);

  return (
    <>
      <style>{styleTag}</style>

      <div className="login-container">
        {/* Desktop Front-Page Match BG */}
        <div className="desktop-bg-layer" />
        <div className="desktop-bg-overlay" />

        {/* THREE.js BACKGROUND — Constrained to form side */}
        <div ref={mountRef} className="three-canvas-container" />

        {/* Brand top-left */}
        <div style={{ position: 'absolute', top: 20, left: 28, fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, background: 'var(--ls-grad-crimson)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiActivity size={24} style={{ color: '#FF1744' }} /> lifeStream
        </div>

        {/* Back to Home */}
        <button className="back-home-btn" onClick={() => navigate('/')}>
          <FiArrowLeft size={18} /> Back to Home
        </button>

        {/* Mobile: Full-screen carousel background */}
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

        {/* Desktop Carousel Column */}
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

        {/* Form Column */}
        <div className="form-col">
          {!showSignup ? (
            /* LOGIN FORM */
            <form
              key="login"
              className="form-card"
              onSubmit={handdleLogin}
            >
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--ls-text)' }}>
                  Welcome back 👋
                </div>
                <div style={{ fontSize: 13, color: 'var(--ls-text-muted)', marginTop: 4 }}>Sign in to lifeStream</div>
              </div>

              <input type="email" className="ls-form-input" placeholder="Email address" value={Vemail} onChange={(e) => setVemail(e.target.value)} />
              
              <div style={{ position: 'relative', width: '100%' }}>
                <input type={showPassword ? "text" : "password"} className="ls-form-input" style={{ width: '100%' }} placeholder="Password" value={Vpassword} onChange={(e) => setVpassword(e.target.value)} />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, padding: '0 4px', color: 'var(--ls-text-sub)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <span className="forgot-link" onClick={handdleNavigate}>Forgot Password?</span>
              </div>

              <button type="submit" className="btn btn-danger w-100 mt-2">Sign In</button>

              <p className="text-center" style={{ margin: 0, fontSize: 14, color: 'var(--ls-text-sub)' }}>
                Don't have an account? <span className="forgot-link" onClick={() => setShowSignup(true)}>Sign Up</span>
              </p>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form
              key="signup"
              className="form-card"
              onSubmit={handleSubmit}
            >
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--ls-text)' }}>
                  Create Account
                </div>
                <div style={{ fontSize: 13, color: 'var(--ls-text-muted)', marginTop: 4 }}>Join lifeStream today</div>
              </div>

              <input type="text" className="ls-form-input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="email" className="ls-form-input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="ls-form-input" value={bloodgrp} onChange={(e) => setBloodgrp(e.target.value)}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
              <input type="text" className="ls-form-input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input type="text" pattern="[0-9]{6}" maxLength="6" className="ls-form-input" placeholder="PinCode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              <input type="tel" maxLength={10} className="ls-form-input" placeholder="Contact No." value={contact} onChange={(e) => setContact(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} className="ls-form-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
              </div>
              <input type={showPassword ? "text" : "password"} className="ls-form-input" placeholder="Confirm Password" value={Cpassword} onChange={(e) => setCpassword(e.target.value)} />
              <button type="submit" className="btn btn-danger w-100">Create Account</button>
              <p className="text-center" style={{ margin: 0, fontSize: 14, color: 'var(--ls-text-sub)' }}>
                Already have an account? <span className="forgot-link" onClick={() => setShowSignup(false)}>Login</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
