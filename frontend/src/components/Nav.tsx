"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Calculator, FlaskConical, Home, Store, Users } from "lucide-react";

const links = [
  { href: "/", label: "Overview", Icon: Home },
  { href: "/scoring", label: "Score & pricing", Icon: Calculator },
  { href: "/simulator", label: "Simulator", Icon: FlaskConical },
  { href: "/customers", label: "Customers", Icon: Users },
  { href: "/partners", label: "Partners", Icon: Store },
  { href: "/tiers", label: "Tiers & rewards", Icon: Award },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
      <div className="px-5 pt-6 pb-4 md:pb-8">
        <Link href="/" className="font-display text-xl font-semibold text-primary">
          If <span className="font-normal italic">Life Partner</span>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">Staff dashboard</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-3 transition-colors ${active ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon className="h-6 w-6" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
