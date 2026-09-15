"use server";

import { revalidatePath } from "next/cache";
import {
  projektUmbenennen,
  projektAnheften,
  projektLoeschen,
  kontextDateiHinzufuegen,
  kontextDateiEntfernen,
} from "@/lib/projekt";

// ANNAHME: exakte Signaturen (Parameter-Reihenfolge/-Namen) laut
// lib/projekt.ts (9/9 getestet) â€” bitte gegen Original prÃ¼fen, falls
// TypeScript-Fehler beim Build auftreten.

export async function umbenennenAction(projektId: string, neuerName: string) {
  await projektUmbenennen(projektId, neuerName);
  revalidatePath(`/projekte/${projektId}`);
  revalidatePath("/projekte");
}

export async function anheftenAction(projektId: string) {
  await projektAnheften(projektId);
  revalidatePath("/projekte");
}

export async function loeschenAction(projektId: string) {
  await projektLoeschen(projektId);
  revalidatePath("/projekte");
}

export async function kontextHinzufuegenAction(projektId: string, ablageId: string) {
  await kontextDateiHinzufuegen(projektId, ablageId);
  revalidatePath(`/projekte/${projektId}`);
}

export async function kontextEntfernenAction(projektId: string, dateiId: string) {
  await kontextDateiEntfernen(projektId, dateiId);
  revalidatePath(`/projekte/${projektId}`);
}
