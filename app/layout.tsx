import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AppStateProvider } from "@/lib/store";

// KORRIGIERT (11.07.2026): "Peter's Team" entfernt (war Platzhalter-Name,
// nicht generisch). Q7 ist mandantenfähig (siehe Q7_Tenant_Modell_v1.md) —
// die Beschreibung darf keinen konkreten Kundennamen hartkodieren.
export const metadata: Metadata = {
  title: "Q7 — KI-Betriebssystem",
  description: "Q7 GUI — internes KI-Betriebssystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="h-full antialiased text-[#0f172a] bg-white">
        <AppStateProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
