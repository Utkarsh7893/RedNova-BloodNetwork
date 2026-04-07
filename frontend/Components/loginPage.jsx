import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

const API_BASE = "import.meta.env.VITE_API_URL";

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

  const mountRef = useRef(null);

  const handdleLogin = async (e) => {
    e.preventDefault();

    if (!Vemail || !Vpassword) {
      alert("Kindly fill all the required details");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: Vemail,
          password: Vpassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        navigate("/about");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert(err.res.data.message);
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

    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap');

    * {
      font-family: Inter, system-ui, -apple-system, Roboto, "Segoe UI", Arial;
    }

    .forgot-link {
      color: #ff4d4d;
      cursor: pointer;
      font-weight: 500;
      transition: 0.25s ease-in-out;
    }

    .forgot-link:hover {
      color: #ff0000;
      text-shadow: 0 0 10px rgba(255,0,0,0.75);
    }

    .btn-danger {
      background: linear-gradient(135deg, #b71c1c, #ff4d4d);
      border: none;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(183, 28, 28, 0.35);
    }

    .btn-danger:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 40px rgba(183, 28, 28, 0.45);
    }

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

      <div
        style={{
          height: "100vh",
          width: "100vw",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, rgba(255, 180, 180, 0.35), transparent 45%)," +
            "linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* THREE.js BACKGROUND */}
        <div
          ref={mountRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />

        {/* Centering wrapper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
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
                className="p-5 shadow rounded"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,215,215,0.55))",
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  backdropFilter: "blur(14px) saturate(140%)",
                  boxShadow: "0 18px 45px rgba(183, 28, 28, 0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
                onSubmit={handdleLogin}
              >
                <h2 className="text-center text-danger mb-4">
                  Login
                </h2>

                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={Vemail}
                  onChange={(e) =>
                    setVemail(e.target.value)
                  }
                />

                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={Vpassword}
                  onChange={(e) =>
                    setVpassword(e.target.value)
                  }
                />

                <button
                  type="submit"
                  className="btn btn-danger w-100 mt-3"
                >
                  Sign In
                </button>

                <p className="text-center mt-2">
                  <span
                    className="text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={handdleNavigate}
                  >
                    Forgot Password?
                  </span>
                </p>

                <p className="text-center mt-2">
                  Don't have an account?{" "}
                  <span
                    className="text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setShowSignup(true)
                    }
                  >
                    Sign Up
                  </span>
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
                className="p-5 shadow rounded"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,215,215,0.55))",
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  backdropFilter: "blur(14px) saturate(140%)",
                  boxShadow: "0 18px 45px rgba(183, 28, 28, 0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
                onSubmit={handleSubmit}
              >
                <h2 className="text-center text-danger mb-4">
                  Sign Up
                </h2>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

                <select
                  className="form-control"
                  value={bloodgrp}
                  onChange={(e) =>
                    setBloodgrp(e.target.value)
                  }
                >
                  <option value="">
                    Select Blood Group
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Address"
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                />

                <input
                  type="text"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  className="form-control"
                  placeholder="PinCode"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(e.target.value)
                  }
                />

                <input
                  type="tel"
                  maxLength={10}
                  className="form-control"
                  placeholder="Contact No."
                  value={contact}
                  onChange={(e) =>
                    setContact(e.target.value)
                  }
                />

                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm Password"
                  value={Cpassword}
                  onChange={(e) =>
                    setCpassword(e.target.value)
                  }
                />

                <button
                  type="submit"
                  className="btn btn-danger w-100 mt-3"
                >
                  Create Account
                </button>

                <p className="text-center mt-2">
                  Already have an account?{" "}
                  <span
                    className="text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setShowSignup(false)
                    }
                  >
                    Login
                  </span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
