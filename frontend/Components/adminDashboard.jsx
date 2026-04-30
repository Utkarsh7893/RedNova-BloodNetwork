import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('ls_token');
        if (!token) throw new Error("No token found");

        const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 403) throw new Error("Access Denied: Admin Privileges Required.");
          throw new Error("Failed to fetch admin stats.");
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <style>{`
        .admin-page {
          min-height: 100vh;
          background: var(--ls-bg);
        }
        .admin-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .admin-card {
          background: var(--ls-surface);
          border: 1px solid var(--ls-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--ls-shadow-sm);
        }
        .admin-stat {
          font-size: 32px;
          font-weight: 800;
          color: var(--ls-crimson);
          font-family: 'Manrope', sans-serif;
        }
      `}</style>
      <div className="admin-page">
        <Navbar />
        <div className="admin-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--ls-surface)', border: '1px solid var(--ls-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ls-text)' }}>
              ←
            </button>
            <h2 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: 'var(--ls-text)' }}>
              🛡️ Admin Control Panel
            </h2>
          </div>

          {loading ? (
            <div style={{ color: 'var(--ls-text-muted)' }}>Loading administrative data...</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ background: '#ffebee', color: '#c62828', padding: 16, borderRadius: 12, border: '1px solid #ffcdd2' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-md-3">
                <div className="admin-card text-center">
                  <div style={{ color: 'var(--ls-text-muted)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>Total Users</div>
                  <div className="admin-stat">{stats.totalUsers}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-card text-center">
                  <div style={{ color: 'var(--ls-text-muted)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>Total Banks</div>
                  <div className="admin-stat">{stats.totalBanks}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-card text-center">
                  <div style={{ color: 'var(--ls-text-muted)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>Total Requests</div>
                  <div className="admin-stat">{stats.totalRequests}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-card text-center">
                  <div style={{ color: 'var(--ls-text-muted)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>Total Liters Donated</div>
                  <div className="admin-stat">{stats.totalDonationsLiters}</div>
                </div>
              </div>

              <div className="col-12 mt-4">
                <div className="admin-card">
                  <h4 style={{ fontWeight: 800, marginBottom: 20 }}>System Activity</h4>
                  <p style={{ color: 'var(--ls-text-muted)' }}>
                    Here you can resolve requests, provide solutions, and manage privileges.
                    (Further detailed tables and management interfaces can be implemented below).
                  </p>
                  <button className="ls-btn-primary" onClick={() => alert('Feature coming soon!')}>Manage Users</button>
                  <button className="ls-btn-outline" style={{ marginLeft: 12 }} onClick={() => alert('Feature coming soon!')}>Resolve Blood Requests</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
