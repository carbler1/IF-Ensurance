import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { COOKIE, verify } from "@/lib/session";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Fraunces sets only the page titles (h1, weight 500), so load that one static face, not the variable font with italics.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: "500" });

export const metadata: Metadata = {
  title: "If Ensurance Staff",
  description: "If staff dashboard: Care Score and premium math, customers, partners and tier rewards.",
};

async function SignedInNav() {
  return <Nav company={await verify((await cookies()).get(COOKIE)?.value)} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable} antialiased`}>
      <body className="min-h-screen md:flex">
        <Suspense>
          <SignedInNav />
        </Suspense>
        <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-10 xl:px-14">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
