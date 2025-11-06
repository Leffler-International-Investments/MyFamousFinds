// FILE: /pages/management/support.tsx

// Re-use the support tickets implementation so the dashboard link
// does not 404 and receives the same server-side data.
export { default, getServerSideProps } from "./support-tickets";
