import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

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
    
    .login-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; background: var(--ls-bg); position: relative; }
    
    .carousel-col { flex: 1; display: none; position: relative; overflow: hidden; }
    @media(min-width: 900px) { .carousel-col { display: block; } }
    .carousel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease; }
    .carousel-img.active { opacity: 1; }
    .carousel-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }
    
    .form-col { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; padding: 20px; }
  `;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0xaa2b2b, // dashboard particle red
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
        {/* THREE.js BACKGROUND */}
        <div ref={mountRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }} />

        {/* Brand top-left */}
        <div style={{ position: 'absolute', top: 20, left: 28, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 22, background: 'var(--ls-grad-crimson)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', zIndex: 10 }}>lifeStream 🩸</div>

        {/* Carousel Column */}
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
          {/* FLIP CONTAINER */}
          <div
            style={{
              width: "460px",
              height: "auto",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s ease",
              transform: showSignup
                ? "rotateY(180deg)"
                : "rotateY(0deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* LOGIN FORM */}
            <div
              style={{
                width: "100%",
                backfaceVisibility: "hidden",
              }}
            >
              <form
                className="p-4 shadow rounded"
                style={{
                  background: "var(--ls-surface)",
                  backdropFilter: "blur(20px) saturate(160%)",
                  WebkitBackdropFilter: "blur(20px) saturate(160%)",
                  borderRadius: "20px",
                  border: "1px solid var(--ls-border)",
                  boxShadow: "var(--ls-shadow-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  minWidth: 320,
                }}
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
            </div>

            {/* SIGNUP FORM */}
            <div
              style={{
                width: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                position: "absolute",
              }}
            >
              <form
                className="p-4 shadow rounded"
                style={{
                  background: "var(--ls-surface)",
                  backdropFilter: "blur(20px) saturate(160%)",
                  WebkitBackdropFilter: "blur(20px) saturate(160%)",
                  borderRadius: "20px",
                  border: "1px solid var(--ls-border)",
                  boxShadow: "var(--ls-shadow-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  minWidth: 320,
                }}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
