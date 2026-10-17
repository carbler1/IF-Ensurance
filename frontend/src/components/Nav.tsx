"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/customers", label: "Customers" },
  { href: "/partners", label: "Partners & prices" },
  { href: "/tiers", label: "Tiers & rewards" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:block md:px-6 md:py-8">
        <Link href="/" className="font-display text-xl font-semibold">
          If <span className="font-normal italic">Life Partner</span>
          <span className="mt-1 block font-sans text-xs font-medium uppercase tracking-[0.14em] text-sidebar-foreground/60">Staff</span>
        </Link>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-sidebar-foreground/12 text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground"}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
