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
    <nav className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-r md:border-b-0">
      <div className="px-4 pt-5 pb-3 md:pb-7">
        <Link href="/" className="flex items-center gap-3">
          {/* The monogram tile; src/app/favicon.ico and apple-icon.png are the same mark. */}
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.55rem] bg-primary pb-0.5 font-display text-lg font-semibold text-primary-foreground">If</span>
          <span>
            <span className="block font-display text-lg leading-tight font-semibold text-primary">If <span className="font-normal italic">Ensurance</span></span>
            <span className="block text-xs text-muted-foreground">Staff dashboard</span>
          </span>
        </Link>
      </div>
      <ul className="flex gap-0.5 overflow-x-auto px-3 pb-3 md:block md:space-y-0.5">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${active ? "bg-accent font-medium text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
