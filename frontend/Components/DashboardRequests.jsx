import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams, Link } from "react-router-dom";
import * as THREE from "three";

// CONFIG
const API_BASE = "import.meta.env.VITE_API_URL";

export default function DashboardRequests() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fulfilled, setFulfilled] = useState(false);
  const [error, setError] = useState(null);

  const mountRef = useRef(null);
  const socketRef = useRef(null);
  const rendererRef = useRef(null);

  // Fetch single request
  const fetchRequest = async () => {
    if (!requestId) return;
    try {
      setError(null);
      const res = await axios.get(`${API_BASE}/api/requests/${requestId}`);
      setRequest(res.data);
      setFulfilled(false);
    } catch (err) {
      console.error("Error fetching request", err);
      setRequest(null);
      setError(err);
    }
  };

  // Socket setup
  useEffect(() => {
    socketRef.current = io(API_BASE, { autoConnect: true });
    const socket = socketRef.current;

    socket.on("connect", () => console.log("socket connected", socket.id));
    socket.on("requestCreated", fetchRequest);
    socket.on("requestClosed", ({ requestId: closedId }) => {
      if (closedId === requestId) {
        setFulfilled(true);
        setRequest(null);
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [requestId]);

  // Fetch when route changes
  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  // THREE.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    if (rendererRef.current) {
      const rr = rendererRef.current;
      if (el.contains(rr.domElement)) el.removeChild(rr.domElement);
      rr.dispose();
      rendererRef.current = null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.zIndex = "0"; // behind content
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particlesCount = 160;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ size: 0.12, transparent: true, opacity: 0.85, color: 0xaa2b2b });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let raf = null;
    const animate = () => {
      frame += 0.005;
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.002 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Fulfill the request
  const fulfillRequest = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      await axios.patch(`${API_BASE}/api/requests/${requestId}/close`, { bankId: "69391e0d1628e4f76968631e" });
      setFulfilled(true);
      setRequest(null);
    } catch (err) {
      console.error("Failed to fulfill request", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: Inter, system-ui, Roboto;
          background: linear-gradient(180deg, #ffe6e6 0%, #f7caca 45%, #f2b6b6 100%);
          min-height: 100%;
        }
        .three-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          pointer-events: none;
        }
        .container {
          position: relative;
          z-index: 1;
          padding: 50px 15px;
        }
        .card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,220,220,0.55));
          backdrop-filter: blur(14px);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .card-header {
          border-bottom: none;
          font-weight: 700;
          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          color: white;
          border-radius: 20px 20px 0 0;
          padding: 10px 15px;
        }
        .btn-custom-danger {
          background: linear-gradient(135deg, #b71c1c, #ff6b6b);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 600;
          padding: 10px 18px;
        }
        .btn-custom-outline {
          border: 2px solid #b71c1c;
          color: #b71c1c;
          border-radius: 14px;
          font-weight: 600;
          padding: 10px 18px;
        }
      `}</style>

      {/* THREE.js background */}
      <div ref={mountRef} className="three-bg" />

      <div className="container">
        {fulfilled ? (
          <div className="card text-center border-success">
            <div className="card-body">
              <h4 className="text-success">Request Fulfilled</h4>
              <p>The request has been successfully fulfilled and the database has been updated.</p>
              <Link to="/dashboard" className="btn btn-success me-2">Back to Dashboard</Link>
              <button className="btn btn-outline-success" onClick={() => { setFulfilled(false); fetchRequest(); }}>View Again</button>
            </div>
          </div>
        ) : !request ? (
          <div className="card text-center border-danger">
            <div className="card-body">
              <h4 className="text-danger">Request Not Found</h4>
              <p>This request may have been removed or deleted. Try returning to the dashboard.</p>
              <Link to="/dashboard" className="btn btn-danger">Back to Dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Request Details</h5>
              <small>ID: {requestId}</small>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Name: {request.requesterName}</h5>
                  <p className="mb-1">{request.hospital}</p>
                  <p className="mb-0"><small>Requested: {new Date(request.createdAt).toLocaleString()}</small></p>
                </div>
                <div className="col-md-6 text-end">
                  <p className="mb-1"><strong>Blood Group:</strong> {request.bloodGroup}</p>
                  <p className="mb-0"><strong>Units:</strong> {request.units} unit(s)</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-0">{request.location?.coordinates ? `${request.location.coordinates[1]}, ${request.location.coordinates[0]}` : "No location"}</p>
                  <p className="mb-0">{request.phone || ""}</p>
                </div>
                <div className="col-md-6 text-end">
                  <Link to="/dashboard" className="btn btn-custom-outline me-2">Back</Link>
                  <button className="btn btn-custom-danger" onClick={fulfillRequest} disabled={loading}>
                    {loading ? "Processing..." : "Fulfill Request"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-warning mt-3">
                  <strong>Error:</strong> {error.message || "Something went wrong."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
