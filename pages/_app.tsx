// FILE: pages/_app.tsx
import type { AppProps } from 'next/app'
import '@/styles/globals.css'
export default function App({ Component, pageProps }: AppProps) { return <Component {...pageProps} /> }


---


// FILE: pages/index.tsx
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { PRODUCTS, CATEGORIES } from '@/lib/sampleProducts'


export default function Home(){
return (
<Layout>
<section className="bg-gray-50 border-b">
<div className="max-w-6xl mx-auto px-4 py-12 text-center">
<h1 className="text-4xl font-bold">FamousFinds — US‑only Fashion Marketplace</h1>
<p className="mt-3 text-gray-600">New & pre‑loved fashion, bags, jewelry, shoes, and party dresses. US buyers & sellers only.</p>
<div className="mt-6 flex flex-wrap gap-3 justify-center">
{CATEGORIES.map(c => (
<Link key={c.slug} href={`/categories/${c.slug}`} className="px-4 py-2 rounded-full border hover:bg-black hover:text-white">{c.label}</Link>
))}
</div>
</div>
</section>


<section className="max-w-6xl mx-auto p-4">
<h2 className="text-2xl font-semibold mb-4">Latest picks</h2>
<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
{PRODUCTS.slice(0,6).map(p => (
<Link key={p.id} href={`/product/${p.id}`} className="border rounded-xl overflow-hidden hover:shadow">
<div className="relative h-56">
<Image src={p.images[0]} alt={p.title} fill className="object-cover" />
</div>
<div className="p-4">
<div className="font-semibold">{p.title}</div>
<div className="text-sm text-gray-600">${p.price} {p.currency}</div>
</div>
</Link>
))}
</div>
</section>
</Layout>
)
}
