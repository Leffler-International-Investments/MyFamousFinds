// FILE: /pages/management/listing-review.tsx

// Re-use the listing queue implementation so the listing review route:
//
//   /management/listing-review
//
// has the same layout AND the same server-side data as
//   /management/listing-queue
//
// This prevents client-side crashes caused by missing props.

export { default, getServerSideProps } from "./listing-queue";
