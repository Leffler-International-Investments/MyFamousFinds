// FILE: pages/categories/[slug].tsx
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { byCategory, CATEGORIES, PRODUCTS } from '@/lib/sampleProducts'
import { useRouter } from 'next/router'


export default function Category(){
const { query } = useRouter()
const slug = String(query.slug||'')
const items = slug ? byCategory(slug) : PRODUCTS
const label = CATEGORIES.find(c=>c.slug===slug)?.label || 'Category'
return (
<Layout title={`${label} — FamousFinds`}>
<div className="max-w-6xl mx-auto p-4">
<h1 className="text-2xl font-semibold mb-4">{label}</h1>
<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
{items.map(p => (
<Link key={p.id} href={`/product/${p.id}`} className="border rounded-xl overflow-hidden hover:shadow">
<div className="relative h-56">
<Image src={p.images[0]} alt={p.title} fill className="object-cover" />
</div>
<div className="p-4">
<div className="font-semibold">{p.title}</div>
<div className="text-sm text-gray-600">${p.price} USD</div>
</div>
</Link>
))}
</div>
</div>
</Layout>
)
}
