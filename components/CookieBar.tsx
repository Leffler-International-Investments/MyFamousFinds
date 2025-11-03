// FILE: /components/CookieBar.tsx
import { useEffect, useState } from "react";
import styles from "../styles/home.module.css";

export function CookieBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("ff_cookie_ok")) setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div className={styles.cookieBar}>
      <p>This website uses cookies to improve your experience.</p>
      <button
        className={styles.ctaPrimary}
        onClick={() => { localStorage.setItem("ff_cookie_ok", "1"); setOpen(false); }}
      >Accept</button>
    </div>
  );
}
