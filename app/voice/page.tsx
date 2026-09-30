"use client";

import { Suspense } from "react";
import VoiceClient from "./VoiceClient";

export default function VoicePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0D0C", color: "#fff" }}>
          Loading…
        </div>
      }
    >
      <VoiceClient />
    </Suspense>
  );
}
