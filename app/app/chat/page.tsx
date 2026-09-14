"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatFenster from "./ChatFenster";
import type { ChatKanalDto, MitarbeiterDto } from "@/lib/chat/types";

type AktiveAnsicht = { typ: "kanal"; id: string; name: string } | { typ: "direkt"; id: string; name: string };

export default function ChatSeite() {
  const [kanaele, setKanaele] = useState<ChatKanalDto[]>([]);
  const [mitarbeiterListe, setMitarbeiterListe] = useState<MitarbeiterDto[]>([]);
  const [aktiveAnsicht, setAktiveAnsicht] = useState<AktiveAnsicht | null>(null);

  useEffect(() => {
    fetch("/api/chat/kanaele")
      .then((res) => res.json())
      .then((daten: ChatKanalDto[]) => {
        setKanaele(daten);
        if (daten.length > 0 && !aktiveAnsicht) {
          setAktiveAnsicht({ typ: "kanal", id: daten[0].id, name: daten[0].name });
        }
      });

    fetch("/api/chat/mitarbeiter")
      .then((res) => res.json())
      .then(setMitarbeiterListe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "600px" }}>
      <ChatSidebar
        kanaele={kanaele}
        mitarbeiterListe={mitarbeiterListe}
        aktiveAnsicht={aktiveAnsicht}
        onKanalWaehlen={(kanal) => setAktiveAnsicht({ typ: "kanal", id: kanal.id, name: kanal.name })}
        onMitarbeiterWaehlen={(mitarbeiter) =>
          setAktiveAnsicht({ typ: "direkt", id: mitarbeiter.id, name: mitarbeiter.name })
        }
      />
      {aktiveAnsicht ? (
        <ChatFenster
          key={`${aktiveAnsicht.typ}-${aktiveAnsicht.id}`}
          typ={aktiveAnsicht.typ}
          zielId={aktiveAnsicht.id}
          titel={aktiveAnsicht.typ === "kanal" ? `# ${aktiveAnsicht.name}` : aktiveAnsicht.name}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#888780" }}>
          Kein Kanal oder Kollege ausgewählt.
        </div>
      )}
    </div>
  );
}
