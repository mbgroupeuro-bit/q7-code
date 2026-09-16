"use server";

import { revalidatePath } from "next/cache";
import {
  projektUmbenennen,
  projektAnheften,
  projektLoeschen,
  kontextDateiHinzufuegen,
  kontextDateiEntfernen,
} from "@/lib/projekt";

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
