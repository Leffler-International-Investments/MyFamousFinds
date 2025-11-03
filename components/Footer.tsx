// FILE: /components/Footer.tsx
import Link from "next/link";
import styles from "../styles/home.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerCols}>
        <div>
          <div className={styles.logoSmall}>FAMOUS FINDS</div>
          <p>Certified & authenticated luxury resale in Australia.</p>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/help/buying">Buying</Link>
          <Link href="/help/selling">Selling</Link>
          <Link href="/help/shipping">Shipping</Link>
          <Link href="/help/returns">Returns</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className={styles.copy}>© {new Date().getFullYear()} Famous Finds</div>
    </footer>
  );
}
