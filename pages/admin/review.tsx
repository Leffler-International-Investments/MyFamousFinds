// FILE: pages/admin/review.tsx
import Layout from '@/components/Layout'
// Simulated queue view
export default function AdminReview(){
return (
<Layout title="Admin Review — FamousFinds">
<div className="max-w-5xl mx-auto p-6">
<h1 className="text-2xl font-semibold">Admin Review (Simulated)</h1>
<p className="mt-2 text-sm text-gray-600">This MVP screen demonstrates the vetting queue. Hook to your backend when ready.</p>
<div className="mt-6 border rounded-xl p-4">
<div className="font-medium">Example Submission</div>
<div className="text-sm text-gray-600">Rose Satin Party Dress • $129 • Like New</div>
<div className="mt-3 flex gap-2">
<button className="px-3 py-2 border rounded">Approve</button>
<button className="px-3 py-2 border rounded">Reject</button>
</div>
</div>
</div>
</Layout>
)
}
