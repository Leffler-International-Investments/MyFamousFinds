// FILE: /pages/seller/banking.tsx
// ⬇️ inside the component, replace your current `handleOpenStripeSetup` function:

const handleOpenStripeSetup = async () => {
  try {
    // Basic env sanity check – these ENV NAMES must match your .env & Vercel
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
        !process.env.STRIPE_SECRET_KEY ||
        !process.env.STRIPE_CONNECT_CLIENT_ID) {
      alert("Stripe Connect is missing configuration on the server. Please contact Famous Finds support.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/seller/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // seller is taken from auth / session on the backend
    });

    const data = await res.json();

    if (!res.ok || !data?.url) {
      console.error("Onboard error", data);
      alert("Could not start Stripe onboarding. Please try again or contact support.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    console.error("Onboard error", err);
    alert("Could not start Stripe onboarding. Please try again later.");
  } finally {
    setLoading(false);
  }
};
