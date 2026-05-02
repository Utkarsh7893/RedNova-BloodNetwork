import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../src/ThemeContext.jsx';

const NAV_LINKS = [
  { to: '/dashboard',    icon: '🏠', label: 'Dashboard',         mobileLabel: 'Your Personal Hub' },
  { to: '/donors',       icon: '🤝', label: 'Find Donors',       mobileLabel: 'Meet Local Donors' },
  { to: '/bloodbank',    icon: '🏥', label: 'Check Blood Banks', mobileLabel: 'Explore Blood Banks' },
  { to: '/events',       icon: '📅', label: 'Campaigns',         mobileLabel: 'Join Life-saving Camps' },
  { to: '/about',        icon: 'ℹ️', label: 'About Us',          mobileLabel: 'Discover Our Mission' },
  { to: '/contact',      icon: '✉️', label: 'Contact',           mobileLabel: 'Get Urgent Support' },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Try localStorage first for instant render
    const stored = localStorage.getItem('ls_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch(e) {}
    }
    // Then refresh from API
    const token = localStorage.getItem('ls_token');
    if (token) {
      fetch(`${API_BASE}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUser(data);
            localStorage.setItem('ls_user', JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, []);

  const photoSrc = user?.profilePhoto ? `${API_BASE}${user.profilePhoto}` : null;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <>
      <style>{`
        .ls-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--ls-surface);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border-bottom: 1px solid var(--ls-border);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          transition: background 0.3s ease;
        }

        .ls-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: 16px;
        }

        .ls-brand {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.03em;
          background: var(--ls-grad-crimson);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .ls-brand:hover { opacity: 0.82; }

        .ls-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ls-nav-link {
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14.5px;
          color: var(--ls-text-sub);
          text-decoration: none;
          transition: background 0.2s ease, color 0.2s ease;
          white-space: nowrap;
        }
        .ls-nav-link:hover,
        .ls-nav-link.active {
          background: rgba(198, 40, 40, 0.10);
          color: var(--ls-crimson);
        }
        .ls-nav-link.active {
          font-weight: 600;
        }

        .ls-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .ls-theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          cursor: pointer;
          font-size: 17px;
          transition: all 0.2s ease;
          color: var(--ls-text);
        }
        .ls-theme-btn:hover {
          border-color: var(--ls-crimson);
          background: rgba(198, 40, 40, 0.08);
          transform: scale(1.08);
        }

        .ls-cta-btn {
          padding: 8px 20px;
          border-radius: 10px;
          border: none;
          background: var(--ls-grad-crimson);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 18px rgba(198,40,40,0.30);
          white-space: nowrap;
        }
        .ls-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(198,40,40,0.45);
          color: #fff;
        }

        /* Hamburger */
        .ls-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          border: 1.5px solid var(--ls-border);
          background: var(--ls-bg-alt);
          transition: background 0.2s;
        }
        .ls-hamburger:hover { background: rgba(198,40,40,0.08); }
        .ls-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--ls-text);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* Mobile menu */
        .ls-mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: var(--ls-surface);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid var(--ls-border);
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          z-index: 999;
          
          /* Smooth Animation */
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s;
        }
        .ls-mobile-menu.open { 
          opacity: 1; 
          visibility: visible;
          transform: translateY(0); 
        }
        .ls-mobile-link {
          padding: 14px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15.5px;
          color: var(--ls-text-sub);
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .ls-mobile-link:hover,
        .ls-mobile-link.active {
          background: rgba(198,40,40,0.08);
          color: var(--ls-crimson);
          transform: translateX(4px);
        }
        .ls-mobile-link.active { font-weight: 700; }

        @media (max-width: 900px) {
          .ls-nav-links { display: none; }
          .ls-hamburger { display: flex; }
        }
        @media (max-width: 480px) {
          .ls-cta-btn { display: none; }
        }

        .ls-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--ls-crimson);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .ls-avatar:hover {
          transform: scale(1.1);
          box-shadow: 0 0 12px rgba(198,40,40,0.4);
        }
        .ls-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ls-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ls-crimson);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
        }
      `}</style>

      <nav className="ls-navbar" style={{ position: 'sticky', top: 0 }}>
        <div className="ls-nav-inner">
          {/* Brand */}
          <Link to="/" className="ls-brand">lifeStream 🩸</Link>

          {/* Desktop links */}
          <ul className="ls-nav-links">
            {NAV_LINKS.map(({ to, icon, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`ls-nav-link${location.pathname === to ? ' active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="ls-nav-actions">
            {/* Profile Avatar */}
            {user && (
              <Link to="/profile" className="ls-avatar" title="My Profile">
                {photoSrc ? (
                  <img src={photoSrc} alt={user.name} />
                ) : (
                  <div className="ls-avatar-fallback">{initials}</div>
                )}
              </Link>
            )}
            <button
              className="ls-theme-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#4DB6AC' }}>
                  <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#C62828' }}>
                  <path d="M12 21a7 7 0 0 0 7-7c0-4-7-11-7-11S5 10 5 14a7 7 0 0 0 7 7z"/>
                </svg>
              )}
            </button>
            <Link to="/requestblood" className="ls-cta-btn">🩸 Request Blood</Link>

            {/* Hamburger */}
            <button
              className="ls-hamburger"
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Toggle menu"
            >
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`ls-mobile-menu${menuOpen ? ' open' : ''}`}>
          {/* Profile link at top of mobile menu */}
          {user && (
            <Link
              to="/profile"
              className={`ls-mobile-link${location.pathname === '/profile' ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ borderBottom: '1px solid var(--ls-border)', paddingBottom: '14px', marginBottom: '6px' }}
            >
              <span style={{ display: 'inline-block', width: '24px', textAlign: 'center', fontSize: '18px', flexShrink: 0 }}>👤</span>
              <span style={{ lineHeight: '1.3' }}>My Profile</span>
            </Link>
          )}
          {NAV_LINKS.map(({ to, icon, mobileLabel }) => (
            <Link
              key={to}
              to={to}
              className={`ls-mobile-link${location.pathname === to ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ display: 'inline-block', width: '24px', textAlign: 'center', fontSize: '18px', flexShrink: 0 }}>{icon}</span>
              <span style={{ lineHeight: '1.3' }}>{mobileLabel}</span>
            </Link>
          ))}
          <Link
            to="/requestblood"
            className="ls-cta-btn mt-2 text-center"
            onClick={() => setMenuOpen(false)}
            style={{ display: 'block' }}
          >
            🩸 Request Blood
          </Link>
        </div>
      </nav>
    </>
  );
}
