"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getVapi } from "@/lib/vapi";

type Service = { id: number; name: string; emoji: string; price: string; duration: string };
type FAQ = { q: string; a: string };
type Business = {
  id: string;
  type?: string;
  name: string;
  hours?: string;
  address?: string;
  color?: string;
  light?: string;
  emoji?: string;
  greeting?: string;
  slug: string;
  vapi_assistant_id?: string | null;
  services?: Service[];
  faqs?: FAQ[];
};

type UsageInfo = {
  minutesUsed: number;
  effectiveLimit: number;
  remaining: number;
  blocked: boolean;
  plan?: string;
  periodResetAt?: string;
};

function formatServices(services: Service[] = []) {
  return services.map((s) => `${s.emoji || ""} ${s.name} - ${s.price} (${s.duration})`).join("\n");
}
function formatFaqs(faqs: FAQ[] = []) {
  return faqs.map((f) => `Question: ${f.q}\nAnswer: ${f.a}`).join("\n\n");
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
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(0);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const businessRef = useRef<Business | null>(null);
  const vapiRef = useRef<ReturnType<typeof getVapi> | null>(null);
  const maxDurationRef = useRef(0);

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

  // Authorize call + load business via server (enforces minute limit)
  useEffect(() => {
    if (!slug || slug === "null") {
      setLoading(false);
      setError("Missing business slug. Open /voice?slug=your-slug");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/vapi/start-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!res.ok || data.allowed === false) {
          setError(
            data.error ||
              "Monthly voice limit reached. Upgrade your plan or buy more minutes."
          );
          if (data.usage) setUsage(data.usage);
          setLoading(false);
          return;
        }
        setBusiness(data.business);
        setUsage(data.usage);
        setMaxDurationSeconds(data.maxDurationSeconds || 0);
        maxDurationRef.current = data.maxDurationSeconds || 0;
        setAssistantId(data.assistantId);
      } catch (err: any) {
        setError(err.message || "Failed to load");
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
        // Refresh usage after call (webhook also updates server)
        if (slug) {
          fetch(`/api/vapi/usage?slug=${encodeURIComponent(slug)}`)
            .then((r) => r.json())
            .then((u) => u && setUsage(u))
            .catch(() => {});
        }
      };
      const onError = () => {
        setCalling(false);
        setCallStatus("ended");
        stopTimer();
      };
      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("error", onError);
      return () => {
        vapi.off?.("call-start", onCallStart);
        vapi.off?.("call-end", onCallEnd);
        vapi.off?.("error", onError);
        stopTimer();
      };
    } catch {
      return;
    }
  }, [slug]);

  async function startCall() {
    const activeBusiness = businessRef.current;
    if (!activeBusiness) return;
    if (usage?.blocked || maxDurationRef.current <= 0) {
      setError("No voice minutes remaining. Upgrade or buy a minutes pack.");
      return;
    }

    // Re-check server right before start (prevents race)
    try {
      const gate = await fetch("/api/vapi/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: activeBusiness.slug }),
      });
      const gateData = await gate.json();
      if (!gate.ok || gateData.allowed === false) {
        setError(gateData.error || "Voice limit reached");
        if (gateData.usage) setUsage(gateData.usage);
        return;
      }
      maxDurationRef.current = gateData.maxDurationSeconds || 0;
      setMaxDurationSeconds(gateData.maxDurationSeconds || 0);
      setUsage(gateData.usage);
      if (gateData.assistantId) setAssistantId(gateData.assistantId);
    } catch {
      setError("Could not authorize call");
      return;
    }

    try {
      const vapi = vapiRef.current ?? getVapi();
      vapiRef.current = vapi;
      setCalling(true);
      setCallStatus("connecting");
      setError("");

      const aid =
        assistantId ||
        activeBusiness.vapi_assistant_id ||
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
        "";

      await vapi.start(aid, {
        // Hard cap: cannot exceed remaining minutes
        maxDurationSeconds: maxDurationRef.current,
        metadata: {
          slug: activeBusiness.slug,
          businessId: activeBusiness.id,
        },
        variableValues: {
          slug: activeBusiness.slug,
          businessId: activeBusiness.id,
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
      setError(
        "Voice call failed. Check NEXT_PUBLIC_VAPI_PUBLIC_KEY and assistant id."
      );
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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0D0C",
          color: "#fff",
        }}
      >
        Loading…
      </div>
    );
  }

  if (error && !business) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0D0C",
          color: "#fff",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40 }}>📞</div>
        <div style={{ fontWeight: 700, maxWidth: 320 }}>{error}</div>
        {usage && (
          <div style={{ fontSize: 13, opacity: 0.6 }}>
            {usage.minutesUsed} / {usage.effectiveLimit} minutes used
          </div>
        )}
        <a href="/pricing" style={{ color: "#00E5A0", marginTop: 8 }}>
          Upgrade / buy minutes →
        </a>
        <a href="/bookai.html" style={{ color: "rgba(255,255,255,0.5)" }}>
          Back to BookAI
        </a>
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
      : usage?.blocked
      ? "No minutes left"
      : "Ready to call";

  const pct =
    usage && usage.effectiveLimit > 0
      ? Math.min(100, Math.round((usage.minutesUsed / usage.effectiveLimit) * 100))
      : 0;

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
      <div
        style={{
          alignSelf: "flex-start",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: 0.5,
        }}
      >
        BOOKAI VOICE
      </div>

      <div style={{ textAlign: "center", width: "100%", maxWidth: 320 }}>
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
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {business?.name || "BookAI"}
        </h1>
        <p style={{ opacity: 0.6, margin: 0 }}>{statusLabel}</p>
        {error && (
          <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>
        )}

        {usage && (
          <div
            style={{
              marginTop: 18,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "12px 14px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                opacity: 0.5,
                marginBottom: 6,
              }}
            >
              VOICE MINUTES
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {usage.minutesUsed} / {usage.effectiveLimit} used
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 4,
                background: "rgba(255,255,255,0.1)",
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background:
                    pct >= 100 ? "#E53935" : pct >= 80 ? "#F59E0B" : "#25D366",
                }}
              />
            </div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>
              {usage.remaining} min remaining
              {maxDurationSeconds > 0 && callStatus === "idle"
                ? ` · max this call ${Math.floor(maxDurationSeconds / 60)}m`
                : ""}
            </div>
          </div>
        )}
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
            disabled={!!usage?.blocked || maxDurationSeconds <= 0}
            style={{
              ...circleBtn,
              width: 84,
              height: 84,
              background:
                usage?.blocked || maxDurationSeconds <= 0
                  ? "rgba(255,255,255,0.15)"
                  : "#25D366",
              boxShadow:
                usage?.blocked || maxDurationSeconds <= 0
                  ? "none"
                  : "0 8px 28px -6px rgba(37,211,102,0.55)",
              cursor:
                usage?.blocked || maxDurationSeconds <= 0
                  ? "not-allowed"
                  : "pointer",
              opacity: usage?.blocked || maxDurationSeconds <= 0 ? 0.5 : 1,
            }}
            aria-label="Start call"
          >
            📞
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, opacity: 0.4 }}>
        {calling
          ? "Tap red to end"
          : usage?.blocked
          ? "Upgrade to continue AI calls"
          : "Green = start · Red = end"}
      </p>
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
