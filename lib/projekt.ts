/**
 * lib/projekt.ts
 *
 * Backend-CRUD für "Projekte" (Claude.ai-Projects-Analog, Ausbaustufe 1:
 * Kontext-Dateien + Grundgerüst für nächtliches Memory).
 *
 * Kontext-Dateien: Upload läuft über den bestehenden Ablage-Mechanismus
 * (lib/ablage.ts, speichereAblageDatei()) — hier wird NUR die bereits
 * existierende ablage_id mit einem Projekt verknüpft, kein eigener
 * Upload-Pfad (Checkpoint-Entscheidung Weg A, 14.09.2026).
 *
 * Das "space"-Feld in AblageEintrag bleibt bewusst unberührt — pausierte,
 * andere Architektur, keine Vermischung mit der Projekt-Kontext-Anbindung.
 *
 * ANNAHME (bitte prüfen): Prisma-Client wird wie im übrigen Codebase
 * über einen zentralen Singleton importiert. Pfad hier angenommen als
 * "./prisma" (export const prisma = new PrismaClient()). Falls der
 * tatsächliche Pfad/Exportname abweicht, bitte den Import unten anpassen.
 */

import { prisma } from "./prisma";

export interface ProjektErstellenEingabe {
  mitarbeiterId: string;
  name: string;
  beschreibung?: string;
}

/**
 * Legt ein neues Projekt an.
 */
export async function projektErstellen(eingabe: ProjektErstellenEingabe) {
  const { mitarbeiterId, name, beschreibung } = eingabe;

  if (!name || !name.trim()) {
    throw new Error("Projektname darf nicht leer sein.");
  }

  return prisma.projekt.create({
    data: {
      mitarbeiter_id: mitarbeiterId,
      name: name.trim(),
      beschreibung: beschreibung?.trim() || null,
    },
  });
}

/**
 * Listet alle Projekte eines Mitarbeiters, angeheftete zuerst,
 * danach nach letzter Aktualisierung absteigend sortiert
 * (analog "Zuletzt verwendet" im Referenz-Screenshot).
 */
export async function projekteListenFuerMitarbeiter(mitarbeiterId: string) {
  return prisma.projekt.findMany({
    where: { mitarbeiter_id: mitarbeiterId },
    orderBy: [{ angeheftet: "desc" }, { aktualisiert_am: "desc" }],
  });
}

/**
 * Ruft ein einzelnes Projekt mit vollem Detailinhalt ab
 * (für die Projekt-Detailseite: Chats, Kontext-Dateien, Erinnerung).
 */
export async function projektAbrufen(projektId: string) {
  const projekt = await prisma.projekt.findUnique({
    where: { id: projektId },
    include: {
      chats: {
        orderBy: { aktualisiert_am: "desc" },
      },
      kontextDateien: {
        orderBy: { hinzugefuegt_am: "desc" },
      },
      erinnerung: true,
    },
  });

  if (!projekt) {
    throw new Error(`Projekt '${projektId}' nicht gefunden.`);
  }

  return projekt;
}

export interface ProjektUmbenennenEingabe {
  name?: string;
  beschreibung?: string;
}

/**
 * Ändert Name und/oder Beschreibung eines Projekts.
 */
export async function projektUmbenennen(
  projektId: string,
  eingabe: ProjektUmbenennenEingabe
) {
  const { name, beschreibung } = eingabe;

  if (name !== undefined && !name.trim()) {
    throw new Error("Projektname darf nicht leer sein.");
  }

  return prisma.projekt.update({
    where: { id: projektId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(beschreibung !== undefined ? { beschreibung: beschreibung.trim() || null } : {}),
    },
  });
}

/**
 * Setzt oder entfernt die Pin-Markierung eines Projekts.
 */
export async function projektAnheften(projektId: string, angeheftet: boolean) {
  return prisma.projekt.update({
    where: { id: projektId },
    data: { angeheftet },
  });
}

/**
 * Löscht ein Projekt.
 *
 * Checkpoint-Entscheidung (14.09.2026): Zugeordnete AgentChats werden
 * NICHT mitgelöscht, sondern nur entkoppelt (projekt_id -> null) —
 * Chat-Inhalte bleiben erhalten, auch wenn das Projekt selbst verschwindet.
 * ProjektKontextDatei-Verknüpfungen werden gelöscht, die physischen
 * Dateien in der Ablage (lib/ablage.ts) bleiben davon unberührt — nur
 * die Verknüpfung zum Projekt verschwindet, die Datei selbst bleibt
 * in der Ablage bestehen.
 */
export async function projektLoeschen(projektId: string): Promise<void> {
  await prisma.$transaction([
    prisma.agentChat.updateMany({
      where: { projekt_id: projektId },
      data: { projekt_id: null },
    }),
    prisma.projektKontextDatei.deleteMany({
      where: { projekt_id: projektId },
    }),
    prisma.projektErinnerung.deleteMany({
      where: { projekt_id: projektId },
    }),
    prisma.projekt.delete({
      where: { id: projektId },
    }),
  ]);
}

/**
 * Verknüpft eine bereits in der Ablage vorhandene Datei (ablage_id) mit
 * einem Projekt. Der Upload selbst läuft vorher ganz normal über
 * speichereAblageDatei() aus lib/ablage.ts — hier passiert NUR die
 * Verknüpfung, kein eigener Datei-Umgang.
 */
export async function kontextDateiHinzufuegen(projektId: string, ablageId: string) {
  return prisma.projektKontextDatei.create({
    data: {
      projekt_id: projektId,
      ablage_id: ablageId,
    },
  });
}

/**
 * Entfernt die Verknüpfung einer Kontext-Datei vom Projekt.
 * Löscht NICHT die physische Datei in der Ablage — nur die Zuordnung.
 * Falls die Datei selbst gelöscht werden soll, muss zusätzlich
 * loescheAblageDatei() aus lib/ablage.ts aufgerufen werden (bewusst
 * getrennt, damit eine Datei, die evtl. in mehreren Kontexten verwendet
 * wird, nicht versehentlich global gelöscht wird).
 */
export async function kontextDateiEntfernen(projektKontextDateiId: string): Promise<void> {
  await prisma.projektKontextDatei.delete({
    where: { id: projektKontextDateiId },
  });
}
