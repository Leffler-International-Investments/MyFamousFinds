// FILE: /pages/designers/index.tsx

import Link from "next/link";

export default function DesignersPage() {
  const designers = [
    "Chanel",
    "Louis Vuitton",
    "Prada",
    "Gucci",
    "Hermès",
    "Fendi",
    "Dior",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6 tracking-wide">
        Designers
      </h1>

      <p className="mb-6 text-gray-600">
        Browse items by your favourite luxury designers.
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {designers.map((d) => (
          <li key={d}>
            <Link
              href={`/designers/${d.toLowerCase().replace(" ", "-")}`}
              className="block px-4 py-3 border rounded-lg hover:bg-gray-50 hover:border-black transition"
            >
              {d}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
