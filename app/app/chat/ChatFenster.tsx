import { useEffect, useRef, useState } from "react";
import type { ChatNachrichtDto } from "@/lib/chat/types";

interface Props {
  typ: "kanal" | "direkt";
  zielId: string;
  titel: string;
}

const POLLING_INTERVALL_MS = 4000;

export default function ChatFenster({ typ, zielId, titel }: Props) {
  const [nachrichten, setNachrichten] = useState<ChatNachrichtDto[]>([]);
  const [text, setText] = useState("");
  const [datei, setDatei] = useState<File | null>(null);
  const letzteIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setNachrichten([]);
    letzteIdRef.current = undefined;
    ladeNachrichten();

    const intervall = setInterval(ladeNachrichten, POLLING_INTERVALL_MS);
    return () => clearInterval(intervall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typ, zielId]);

  async function ladeNachrichten() {
    const params = new URLSearchParams(
      typ === "kanal" ? { kanalId: zielId } : { mitEmpfaengerId: zielId }
    );
    if (letzteIdRef.current) params.set("seitId", letzteIdRef.current);

    const res = await fetch(`/api/chat/nachrichten?${params.toString()}`);
    if (!res.ok) return;
    const neue: ChatNachrichtDto[] = await res.json();
    if (neue.length > 0) {
      setNachrichten((bisherige) => [...bisherige, ...neue]);
      letzteIdRef.current = neue[neue.length - 1].id;
    }
  }

  async function nachrichtSenden() {
    if (text.trim().length === 0) return;

    let anhaenge;
    if (datei) {
      const formData = new FormData();
      formData.append("datei", datei);
      const uploadRes = await fetch("/api/chat/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        anhaenge = [await uploadRes.json()];
      }
    }

    const res = await fetch("/api/chat/nachrichten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        kanalId: typ === "kanal" ? zielId : undefined,
        empfaengerId: typ === "direkt" ? zielId : undefined,
        anhaenge,
      }),
    });

    if (res.ok) {
      const neueNachricht: ChatNachrichtDto = await res.json();
      setNachrichten((bisherige) => [...bisherige, neueNachricht]);
      letzteIdRef.current = neueNachricht.id;
      setText("");
      setDatei(null);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #e5e3dc", fontWeight: 500, fontSize: 15 }}>
        {titel}
      </div>

      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {nachrichten.map((n) => (
          <div key={n.id} style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#e6f1fb",
                color: "#0c447c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {n.absenderName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{n.absenderName}</span>{" "}
                <span style={{ color: "#888780", fontSize: 12 }}>
                  {new Date(n.erstelltAm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{n.text}</div>
              {n.anhaenge.map((a) => (
                <a
                  key={a.id}
                  href={`/api/chat/datei/${a.id}`}
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "0.5px solid #e5e3dc",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "#1a1a1a",
                  }}
                >
                  {a.dateiname}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e5e3dc", display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="file"
          id="chat-datei-input"
          style={{ display: "none" }}
          onChange={(e) => setDatei(e.target.files?.[0] ?? null)}
        />
        <label htmlFor="chat-datei-input" style={{ cursor: "pointer", fontSize: 18 }} title="Datei anhängen">
          📎
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && nachrichtSenden()}
          placeholder={typ === "kanal" ? `Nachricht an ${titel}...` : `Nachricht an ${titel}...`}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #d3d1c7" }}
        />
        {datei && <span style={{ fontSize: 12, color: "#5f5e5a" }}>{datei.name}</span>}
        <button
          onClick={nachrichtSenden}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#f0a63a",
            border: "none",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
