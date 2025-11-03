// FILE: /components/CategoryTile.tsx
import Link from "next/link";
import styles from "../styles/home.module.css";

export function CategoryTile({ title, img, href }:{
  title: string; img: string; href: string;
}) {
  return (
    <Link href={href} className={styles.catTile}>
      <img src={img} alt={title} />
      <span>{title}</span>
    </Link>
  );
}
