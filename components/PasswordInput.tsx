/* FILE: /styles/globals.css */

/* !! THE FIX: 
  You MUST add these three lines to the very top of this file.
  This is why your boxes, centering, and styles are not appearing.
*/
@tailwind base;
@tailwind components;
@tailwind utilities;


/* Basic reset */
* { box-sizing: border-box; }
html, body { 
  margin: 0; 
  padding: 0; 
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 
  /* !! FIX: 
     REMOVED 'background:#0b0b0b' and 'color:#eee' from here.
     This stops the global dark theme from overriding your dashboard components.
     We will add the dark background back *selectively* to other pages.
  */
}
a { color: inherit; text-decoration: none; } /* Added this from your previous file for convenience */

/*
  !! ADD THIS:
  Create a new class to apply the
  dark theme ONLY to pages that need it
  (like your homepage), but NOT your dashboards.
*/
.dark-theme-page {
  background: #0b0b0b;
  color: #eee;
  min-height: 100vh; /* Ensures it covers the full page */
}


/* Hero */
.hero { background:#0b0b0b url('/hero.jpg') center/cover no-repeat; min-height: 48vh; display:flex; align-items:center; }
.hero-inner { padding: 56px 20px; max-width: 1200px; margin: 0 auto; }
.hero h1 { letter-spacing: 0.4rem; font-weight: 800; margin: 0 0 8px; }
.hero p { opacity: .85; margin: 0 0 20px; }
.cta { display:inline-block; padding:10px 16px; border:1px solid #fff; border-radius:999px; text-decoration:none; color:#fff; }

/* Sections */
.section { max-width:1200px; margin: 28px auto; padding: 0 16px; }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
.section-header h2 { margin:0; font-size: 20px; letter-spacing:.02em; }

/* Grid */
.grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
@media (min-width: 720px) { .grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }

/* Category tiles */
.grid-cats .cat { position:relative; display:flex; align-items:center; justify-content:center; padding: 20px; height: 120px; background-size: cover; background-position: center; border-radius: 12px; overflow: hidden; }
.grid-cats .cat::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, #000000 0%, #00000040 50%, #000000 100%); opacity: .5; }
.grid-cats .cat span { position:relative; z-index:1; font-weight:600; font-size:15px; color:#fff; }

/* Product tiles */
.grid-prods .prod { border: 1px solid #1f1f1f; border-radius:12px; overflow:hidden; }
.grid-prods .img { position:relative; background:#111; aspect-ratio: 1 / 1; }
.grid-prods .img img { display:block; width:100%; height:100%; object-fit:cover; }
.badge { position:absolute; left:8px; top:8px; font-size:11px; padding:4px 8px; background:#ffffff14; border:1px solid #ffffff2a; border-radius:999px; }
.meta { padding:10px; }
.brand { font-size:12px; opacity:.8; }
.title { font-size:13px; margin:2px 0 8px; }
.row { display:flex; gap:8px; align-items:center; justify-content:space-between; }
.price { font-weight:700; }
.cond { font-size:11px; opacity:.75; }
.loc { margin-top:6px; font-size:11px; opacity:.7; }

/* Footer */
.footer { max-width:1200px; margin: 40px auto; padding: 20px 16px; opacity:.7; font-size:12px; border-top:1px solid #1b1b1b; }

/* Auth layouts for login / signup */
.auth-page {
  min-height: 100vh;
  background: #000;
  color: #f9fafb;
  display: flex;
  flex-direction: column;
}

.auth-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #111827;
  border-radius: 16px;
  border: 1px solid #1f2937;
  padding: 24px 24px 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.auth-card h1 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}

.auth-card p.auth-subtitle {
  margin: 0 0 12px;
  font-size: 12px;
  text-align: center;
  color: #9ca3af;
}

.auth-fields {
  margin-top: 12px;
}

.auth-field {
  margin-bottom: 10px;
}

.auth-field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.auth-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #020617;
  padding: 8px 10px;
  font-size: 14px;
  color: #e5e7eb;
}

.auth-input::placeholder {
  color: #6b7280;
}

.auth-input:focus {
  outline: none;
  border-color: #f9fafb;
  box-shadow: 0 0 0 1px rgba(249, 250, 251, 0.2);
}

.auth-button-primary {
  width: 100%;
  margin-top: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  border: none;
  background: #f9fafb;
  color: #000;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.auth-button-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.auth-secondary-link,
.auth-secondary-link-inline {
  margin-top: 10px;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}

.auth-secondary-link a,
.auth-secondary-link-inline a,
.auth-secondary-link-inline button {
  color: #e5e7eb;
  text-decoration: none;
}

.auth-secondary-link-inline button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.auth-secondary-link a:hover,
.auth-secondary-link-inline a:hover,
.auth-secondary-link-inline button:hover {
  text-decoration: underline;
}

.auth-error {
  margin-top: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #f97373;
  background: #7f1d1d;
  color: #fee2e2;
  font-size: 12px;
}

.auth-info {
  margin-top: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #047857;
  background: #064e3b;
  color: #bbf7d0;
  font-size: 12px;
}

.auth-code-input {
  letter-spacing: 0.35em;
  text-align: center;
}

/* Password input layout */
.password-input-row {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #020617;
  overflow: hidden;
}

.password-input-row .auth-input {
  border: none;
  border-radius: 0;
  flex: 1;
  padding-right: 0;
}

.password-toggle {
  padding: 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: #e5e7eb;
  background: transparent;
  border: none;
  cursor: pointer;
}

.password-toggle:hover {
  color: #ffffff;
}

.password-strength {
  margin-top: 6px;
  font-size: 11px;
}

.password-strength-weak {
  color: #f97373;
}

.password-strength-ok {
  color: #facc15;
}

.password-strength-strong {
  color: #4ade80;
}

.password-strength-very-strong {
  color: #22c55e;
}
