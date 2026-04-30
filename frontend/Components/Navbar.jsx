import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../src/ThemeContext.jsx';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/donors',       label: 'Donors' },
  { to: '/bloodbank',    label: 'Blood Banks' },
  { to: '/events',       label: 'Events' },
  { to: '/about',        label: 'About' },
  { to: '/contact',      label: 'Contact' },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
          display: none;
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: var(--ls-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--ls-border);
          padding: 12px 20px 16px;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
          z-index: 999;
        }
        .ls-mobile-menu.open { display: flex; }
        .ls-mobile-link {
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 500;
          font-size: 15px;
          color: var(--ls-text-sub);
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .ls-mobile-link:hover,
        .ls-mobile-link.active {
          background: rgba(198,40,40,0.10);
          color: var(--ls-crimson);
        }
        .ls-mobile-link.active { font-weight: 600; }

        @media (max-width: 900px) {
          .ls-nav-links { display: none; }
          .ls-hamburger { display: flex; }
        }
        @media (max-width: 480px) {
          .ls-cta-btn { display: none; }
        }
      `}</style>

      <nav className="ls-navbar" style={{ position: 'sticky', top: 0 }}>
        <div className="ls-nav-inner">
          {/* Brand */}
          <Link to="/" className="ls-brand">lifeStream 🩸</Link>

          {/* Desktop links */}
          <ul className="ls-nav-links">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`ls-nav-link${location.pathname === to ? ' active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="ls-nav-actions">
            <button
              className="ls-theme-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
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
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`ls-mobile-link${location.pathname === to ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
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
