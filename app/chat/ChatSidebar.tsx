import type { ChatKanalDto, MitarbeiterDto } from "@/lib/chat/types";

type AktiveAnsicht = { typ: "kanal"; id: string; name: string } | { typ: "direkt"; id: string; name: string };

interface Props {
  kanaele: ChatKanalDto[];
  mitarbeiterListe: MitarbeiterDto[];
  aktiveAnsicht: AktiveAnsicht | null;
  onKanalWaehlen: (kanal: ChatKanalDto) => void;
  onMitarbeiterWaehlen: (mitarbeiter: MitarbeiterDto) => void;
}

export default function ChatSidebar({
  kanaele,
  mitarbeiterListe,
  aktiveAnsicht,
  onKanalWaehlen,
  onMitarbeiterWaehlen,
}: Props) {
  return (
    <div
      style={{
        width: 220,
        backgroundColor: "#0f1c3d",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "0 16px 16px", fontWeight: 500, fontSize: 16 }}>
        <span style={{ color: "#f0a63a" }}>Q7</span> Chat
      </div>

      <div style={{ padding: "8px 16px 4px", fontSize: 12, color: "#9aa4c2" }}>Bereiche</div>
      {kanaele.map((kanal) => {
        const aktiv = aktiveAnsicht?.typ === "kanal" && aktiveAnsicht.id === kanal.id;
        return (
          <button
            key={kanal.id}
            onClick={() => onKanalWaehlen(kanal)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              fontSize: 14,
              background: aktiv ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: aktiv ? "#fff" : "#c7cee3",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
          >
            # {kanal.name}
          </button>
        );
      })}

      <div style={{ padding: "16px 16px 4px", fontSize: 12, color: "#9aa4c2" }}>Direktnachrichten</div>
      {mitarbeiterListe.map((mitarbeiter) => {
        const aktiv = aktiveAnsicht?.typ === "direkt" && aktiveAnsicht.id === mitarbeiter.id;
        return (
          <button
            key={mitarbeiter.id}
            onClick={() => onMitarbeiterWaehlen(mitarbeiter)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              fontSize: 14,
              background: aktiv ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: aktiv ? "#fff" : "#c7cee3",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9aa4c2", display: "inline-block" }} />
            {mitarbeiter.name}
          </button>
        );
      })}
    </div>
  );
}
