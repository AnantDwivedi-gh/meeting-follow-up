"use client";

import Dashboard from "@/components/Dashboard";
import FloatingWidget from "@/components/FloatingWidget";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Dashboard />
      <FloatingWidget />
    </main>
  );
}
