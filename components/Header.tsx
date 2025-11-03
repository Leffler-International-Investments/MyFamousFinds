// FILE: /components/Header.tsx
import Link from "next/link";
import styles from "../styles/home.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>FAMOUS FINDS</Link>
      <nav className={styles.nav}>
        <Link href="/shop">Shop</Link>
        <Link href="/sell">Sell</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
