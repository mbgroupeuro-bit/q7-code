"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  projektErstellen,
  projektUmbenennen,
  projektAnheften,
  projektLoeschen,
  kontextDateiHinzufuegen,
  kontextDateiEntfernen,
} from "@/lib/projekt";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";

export async function erstellenAction(formData: FormData) {
  const zugriff = await pruefeAgentZugriff();
  if (!zugriff.erlaubt || !zugriff.kontext) {
    throw new Error("Kein Zugriff auf Projekte.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Projektname darf nicht leer sein.");
  }

  const projekt = await projektErstellen({
    mitarbeiterId: zugriff.kontext.mitarbeiterId,
    name,
  });

  revalidatePath("/projekte");
  redirect(`/projekte/${projekt.id}`);
}

export async function umbenennenAction(projektId: string, neuerName: string) {
  await projektUmbenennen(projektId, { name: neuerName });
  revalidatePath(`/projekte/${projektId}`);
  revalidatePath("/projekte");
}

export async function anheftenAction(projektId: string, angeheftet: boolean) {
  await projektAnheften(projektId, angeheftet);
  revalidatePath("/projekte");
  revalidatePath(`/projekte/${projektId}`);
}

export async function loeschenAction(projektId: string) {
  await projektLoeschen(projektId);
  revalidatePath("/projekte");
}

export async function kontextHinzufuegenAction(projektId: string, ablageId: string) {
  await kontextDateiHinzufuegen(projektId, ablageId);
  revalidatePath(`/projekte/${projektId}`);
}

export async function kontextEntfernenAction(projektId: string, kontextDateiId: string) {
  await kontextDateiEntfernen(kontextDateiId);
  revalidatePath(`/projekte/${projektId}`);
}
