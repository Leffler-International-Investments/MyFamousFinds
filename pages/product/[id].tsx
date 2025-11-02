// FILE: pages/product/[id].tsx
import Image from 'next/image'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { findById } from '@/lib/sampleProducts'


export default function ProductPage(){
const { query } = useRouter()
const id = String(query.id||'')
const p = id ? findById(id) : undefined
if (!p) return <Layout><div className="max-w-4xl mx-auto p-8">Loading…</div></Layout>
return (
<Layout title={`${p.title} — FamousFinds`}>
<div className="max-w-5xl mx-auto p-4 grid md:grid-cols-2 gap-8">
<div className="relative w-full h-96 border rounded-xl overflow-hidden">
<Image src={p.images[0]} alt={p.title} fill className="object-cover" />
</div>
<div>
<h1 className="text-2xl font-semibold">{p.title}</h1>
<div className="mt-2 text-lg">${p.price} USD</div>
<div className="mt-1 text-sm text-gray-600">Condition: {p.condition}</div>
<p className="mt-4 text-sm leading-6">{p.description}</p>
<div className="mt-6 flex gap-3">
<button className="px-5 py-3 rounded border">Buy Now (stub)</button>
<button className="px-5 py-3 rounded border">Make an Offer (stub)</button>
</div>
<p className="mt-4 text-xs text-gray-500">US buyers & shipping only.</p>
</div>
</div>
</Layout>
)
}
