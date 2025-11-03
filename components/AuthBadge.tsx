// FILE: /components/AuthBadge.tsx
export default function AuthBadge({ verified=false }: { verified?: boolean }){
  if (!verified) return null;
  return (
    <span className="ab">Authenticated</span>
  );
}
// usage: <AuthBadge verified={product?.verified === true} />
