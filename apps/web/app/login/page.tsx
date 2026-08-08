"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>HealthOS login</h1>
      {status === "sent" ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ display: "block", width: "100%", marginBottom: "0.75rem", padding: "0.5rem" }}
          />
          <button type="submit" disabled={status === "sending"} style={{ padding: "0.5rem 1rem" }}>
            {status === "sending" ? "Sending..." : "Send magic link"}
          </button>
          {status === "error" && <p style={{ color: "crimson" }}>Something went wrong. Try again.</p>}
        </form>
      )}
    </main>
  );
}
