// FILE: lib/sampleProducts.ts
export type Product = {
  id: string;
  title: string;
  price: number;
  currency: 'USD';
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  images: string[];
  description: string;
  gender?: 'Women' | 'Men' | 'Unisex';
};

export const PRODUCTS: Product[] = [
  {
    id: 'party-dress-rose-001',
    title: 'Rose Satin Party Dress',
    price: 129,
    currency: 'USD',
    category: 'party-dresses',
    condition: 'Like New',
    gender: 'Women',
    images: [
      'https://images.unsplash.com/photo-1542060748-10c28b62716c?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Elegant satin cocktail dress in rose pink. Knee-length, flattering fit.'
  },
  {
    id: 'mens-tux-jet-002',
    title: 'Jet Black Tuxedo (Mens)',
    price: 259,
    currency: 'USD',
    category: 'party-dresses',
    condition: 'Good',
    gender: 'Men',
    images: [
      'https://images.unsplash.com/photo-1520975845256-2f6828f3ed0e?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Classic single-breasted tuxedo. Includes jacket & trousers.'
  },
  {
    id: 'bag-tote-caramel-003',
    title: 'Caramel Leather Tote Bag',
    price: 180,
    currency: 'USD',
    category: 'bags',
    condition: 'Like New',
    gender: 'Women',
    images: [
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Spacious everyday tote in premium leather. Fits 13" laptop.'
  },
  {
    id: 'sneaker-white-004',
    title: 'White Court Sneakers',
    price: 79,
    currency: 'USD',
    category: 'shoes',
    condition: 'Good',
    gender: 'Unisex',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Minimalist white sneakers. Comfortable everyday wear.'
  },
  {
    id: 'jewelry-gold-hoops-005',
    title: '14k Gold Hoop Earrings',
    price: 95,
    currency: 'USD',
    category: 'jewelry',
    condition: 'Like New',
    gender: 'Women',
    images: [
      'https://images.unsplash.com/photo-1617038260897-3d08a5f2fa3f?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Classic small gold hoops. Timeless and elegant.'
  },
  {
    id: 'men-oxford-006',
    title: 'Brown Leather Oxford Shoes (Mens)',
    price: 110,
    currency: 'USD',
    category: 'shoes',
    condition: 'Good',
    gender: 'Men',
    images: [
      'https://images.unsplash.com/photo-1511381939415-c1f52f94c5a9?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'Polished leather oxfords for formal occasions.'
  }
];

export function byCategory(slug: string) {
  return PRODUCTS.filter((p) => p.category === slug);
}

export function findById(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export const CATEGORIES = [
  { slug: 'women', label: 'Women' },
  { slug: 'men', label: 'Men' },
  { slug: 'shoes', label: 'Shoes' },
  { slug: 'bags', label: 'Bags' },
  { slug: 'jewelry', label: 'Jewelry' },
  { slug: 'party-dresses', label: 'Party Dresses' }
];
