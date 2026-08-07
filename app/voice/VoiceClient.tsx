"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getVapi } from "@/lib/vapi";

type Service = { id: number; name: string; emoji: string; price: string; duration: string };
type FAQ = { q: string; a: string };
type Business = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  hours: string;
  address: string;
  color: string;
  light: string;
  emoji: string;
  greeting: string;
  slug: string;
  vapi_assistant_id: string | null;
  services: Service[];
  faqs: FAQ[];
};

function formatServices(services: Service[]) {
  return (services || []).map((s) => `${s.emoji || ""} ${s.name} - ${s.price} (${s.duration})`).join("\n");
}
function formatFaqs(faqs: FAQ[]) {
  return (faqs || []).map((f) => `Question: ${f.q}\nAnswer: ${f.a}`).join("\n\n");
}
function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type CallStatus = "idle" | "connecting" | "connected" | "ended";

export default function VoiceClient() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const businessRef = useRef<Business | null>(null);
  const vapiRef = useRef<ReturnType<typeof getVapi> | null>(null);

  function startTimer() {
    stopTimer();
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    businessRef.current = business;
  }, [business]);

  useEffect(() => {
    if (!slug || slug === "null") {
      setLoading(false);
      setError("Missing business slug. Open /voice?slug=your-slug");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/business?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Business not found");
        const data = await res.json();
        setBusiness(data);
      } catch (err: any) {
        setError(err.message || "Failed to load business");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    try {
      const vapi = getVapi();
      vapiRef.current = vapi;
      const onCallStart = () => {
        setCallStatus("connected");
        startTimer();
      };
      const onCallEnd = () => {
        setCalling(false);
        setCallStatus("ended");
        stopTimer();
      };
      const onError = () => {
        setCalling(false);
        setCallStatus("ended");
        stopTimer();
      };
      const onSpeechStart = () => setAiSpeaking(false);
      const onSpeechEnd = () => setAiSpeaking(true);
      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("error", onError);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("speech-end", onSpeechEnd);
      return () => {
        vapi.off?.("call-start", onCallStart);
        vapi.off?.("call-end", onCallEnd);
        vapi.off?.("error", onError);
        vapi.off?.("speech-start", onSpeechStart);
        vapi.off?.("speech-end", onSpeechEnd);
        stopTimer();
      };
    } catch {
      // Vapi key missing — page still renders
      return;
    }
  }, []);

  async function startCall() {
    const activeBusiness = businessRef.current;
    if (!activeBusiness) return;
    try {
      const vapi = vapiRef.current ?? getVapi();
      vapiRef.current = vapi;
      setCalling(true);
      setCallStatus("connecting");
      await vapi.start(activeBusiness.vapi_assistant_id || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "", {
        variableValues: {
          slug: activeBusiness.slug,
          businessName: activeBusiness.name ?? "",
          greeting: activeBusiness.greeting ?? "",
          hours: activeBusiness.hours ?? "",
          address: activeBusiness.address ?? "",
          services: formatServices(activeBusiness.services),
          faqs: formatFaqs(activeBusiness.faqs),
        },
      });
    } catch (err) {
      console.error(err);
      setCalling(false);
      setCallStatus("ended");
      stopTimer();
      setError("Voice call failed. Check NEXT_PUBLIC_VAPI_PUBLIC_KEY and assistant id.");
    }
  }

  function stopCall() {
    try {
      (vapiRef.current ?? getVapi()).stop();
    } catch {}
    setCalling(false);
    setCallStatus("idle");
    stopTimer();
  }

  function toggleMute() {
    try {
      const vapi = vapiRef.current ?? getVapi();
      setMuted((prev) => {
        const next = !prev;
        vapi.setMuted?.(next);
        return next;
      });
    } catch {}
  }

  const accent = business?.color || "#1FAE7A";
  const accentSoft = business?.light || "rgba(31,174,122,0.18)";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0D0C", color: "#fff" }}>
        Loading business…
      </div>
    );
  }

  if (error && !business) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0A0D0C", color: "#fff", gap: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>📞</div>
        <div style={{ fontWeight: 700 }}>{error}</div>
        <a href="/bookai.html" style={{ color: "#00E5A0" }}>Back to BookAI</a>
      </div>
    );
  }

  const statusLabel =
    callStatus === "connecting"
      ? "Calling…"
      : callStatus === "connected"
      ? formatDuration(callDuration)
      : callStatus === "ended"
      ? "Call ended"
      : "Ready to call";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 20px 40px",
        background: `radial-gradient(circle at 50% 15%, ${accentSoft}, #0A0D0C 55%)`,
        color: "#F5F7F6",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.5 }}>BOOKAI VOICE</div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            background: `linear-gradient(160deg, ${accent}, #0A0D0C)`,
          }}
        >
          {business?.emoji || "📞"}
        </div>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{business?.name || "BookAI"}</h1>
        <p style={{ opacity: 0.6, margin: 0 }}>{statusLabel}</p>
        {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {calling ? (
          <>
            <button onClick={toggleMute} style={circleBtn}>
              {muted ? "🔇" : "🎤"}
            </button>
            <button
              onClick={stopCall}
              style={{
                ...circleBtn,
                width: 72,
                height: 72,
                background: "#E53935",
                boxShadow: "0 8px 24px -6px rgba(229,57,53,0.55)",
              }}
              aria-label="End call"
            >
              📵
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            style={{
              ...circleBtn,
              width: 84,
              height: 84,
              background: "#25D366",
              boxShadow: "0 8px 28px -6px rgba(37,211,102,0.55)",
            }}
            aria-label="Start call"
          >
            📞
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, opacity: 0.4 }}>{calling ? "Tap red to end" : "Tap to start call"}</p>
    </div>
  );
}

const circleBtn: React.CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 22,
  color: "#fff",
  background: "rgba(255,255,255,0.08)",
};
