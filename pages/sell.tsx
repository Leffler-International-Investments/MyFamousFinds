// FILE: pages/sell.tsx
import Layout from '@/components/Layout'
import { useState } from 'react'


export default function Sell(){
const [sent, setSent] = useState(false)
async function onSubmit(e:any){
e.preventDefault()
const fd = new FormData(e.target)
// Simulate submit; in MVP we do not persist server-side.
await fetch('/api/sell', { method: 'POST', body: fd })
setSent(true)
}
return (
<Layout title="Sell — FamousFinds">
<div className="max-w-xl mx-auto p-6">
<h1 className="text-2xl font-semibold">Sell an Item</h1>
{sent ? (
<p className="mt-6">Thanks! Your item was submitted for review (simulation). Our US team will vet it shortly.</p>
) : (
<form onSubmit={onSubmit} className="mt-6 space-y-4">
<input required name="title" placeholder="Title" className="w-full border p-3 rounded" />
<select required name="category" className="w-full border p-3 rounded">
<option value="party-dresses">Party Dresses</option>
<option value="shoes">Shoes</option>
<option value="bags">Bags</option>
<option value="jewelry">Jewelry</option>
<option value="women">Women</option>
<option value="men">Men</option>
</select>
<select required name="condition" className="w-full border p-3 rounded">
<option>New</option>
<option>Like New</option>
<option>Good</option>
<option>Fair</option>
</select>
<input required type="number" name="price" placeholder="Price (USD)" className="w-full border p-3 rounded" />
<input required name="image" placeholder="Image URL (https://...)" className="w-full border p-3 rounded" />
<textarea required name="description" placeholder="Description" className="w-full border p-3 rounded" rows={4} />
<button className="w-full border rounded p-3">Submit for Review</button>
<p className="text-xs text-gray-500">Submissions are reviewed for US sale only. No bank details collected here; payouts handled later via Stripe Connect.</p>
</form>
)}
</div>
</Layout>
)
}
