import type { Metadata } from "next";
import { Suspense } from "react";
import { Figtree, Fraunces } from "next/font/google";
import { connection } from "next/server";
import { isReadOnly } from "@/config";
import { ReadOnlyProvider } from "@/components/form";
import { Nav } from "@/components/Nav";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Fraunces sets only the page titles (h1, weight 500), so load that one static face, not the variable font with italics.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: "500" });

export const metadata: Metadata = {
  title: "If Ensurance Staff",
  description: "If staff dashboard: Care Score and premium math, customers, partners and tier rewards.",
};

async function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection(); // the switch is read per request, not frozen at build
  const readOnly = isReadOnly();
  return (
    <ReadOnlyProvider value={readOnly}>
      {readOnly && (
        <p role="status" className="fixed right-2 bottom-2 md:top-2 md:bottom-auto z-50 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-soft">
          Editing is disabled to prevent sabotage.
        </p>
      )}
      <Nav />
      <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-10 xl:px-14">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </ReadOnlyProvider>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable} antialiased`}>
      <body className="min-h-screen md:flex">
        <Suspense>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
