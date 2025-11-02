// FILE: components/Layout.tsx
import Link from 'next/link'
import Head from 'next/head'


export default function Layout({ title = 'FamousFinds — US fashion marketplace', children }: any) {
return (
<div className="min-h-screen flex flex-col">
<Head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="US‑only marketplace for new & pre‑loved fashion, bags, jewelry, shoes, party dresses, and more." />
<link rel="manifest" href="/manifest.json" />
<title>{title}</title>
</Head>
<header className="border-b">
<div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
<Link href="/" className="text-xl font-bold">FamousFinds</Link>
<nav className="flex gap-4 text-sm">
<Link href="/categories/women">Women</Link>
<Link href="/categories/men">Men</Link>
<Link href="/categories/shoes">Shoes</Link>
<Link href="/categories/bags">Bags</Link>
<Link href="/categories/jewelry">Jewelry</Link>
<Link href="/categories/party-dresses">Party Dresses</Link>
<Link className="font-semibold" href="/sell">Sell</Link>
</nav>
</div>
</header>
<main className="flex-1">{children}</main>
<footer className="border-t text-sm text-center p-6">© {new Date().getFullYear()} FamousFinds • US‑only</footer>
</div>
)
}
