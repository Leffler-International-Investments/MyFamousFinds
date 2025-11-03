// FILE: /components/ProductCard.tsx
import Link from "next/link";
import styles from "../styles/home.module.css";

type Props = {
  id: string; brand: string; name: string; price: string; img: string; compact?: boolean;
};

export function ProductCard({ id, brand, name, price, img, compact }: Props) {
  return (
    <Link href={`/product/${id}`} className={compact ? styles.cardCompact : styles.card}>
      <img src={img} alt={`${brand} ${name}`} />
      <div className={styles.cardInfo}>
        <div className={styles.brand}>{brand}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.price}>{price}</div>
      </div>
    </Link>
  );
}
