import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "If Ensurance Staff",
  description: "If staff dashboard: Care Score and premium math, customers, partners and tier rewards.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable} antialiased`}>
      <body className="min-h-screen md:flex">
        <Nav />
        <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-9">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
