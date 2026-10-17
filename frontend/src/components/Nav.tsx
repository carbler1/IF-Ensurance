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
    // Phones: the links in a grid above the page. Tablets (md): an icon rail. Desktops (lg): the full side menu.
    <nav className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-[4.5rem] md:shrink-0 md:border-r md:border-b-0 lg:w-64">
      <div className="px-5 pt-5 pb-4 md:px-4 md:pt-6 md:pb-8 lg:px-5">
        <Link href="/" className="flex items-center gap-3">
          {/* The monogram tile; src/app/favicon.ico and apple-icon.png are the same mark. */}
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.6rem] bg-primary pb-0.5 font-display text-xl font-semibold text-primary-foreground">If</span>
          <span className="md:hidden lg:block">
            <span className="block font-display text-xl leading-tight font-semibold text-primary">If <span className="font-normal italic">Ensurance</span></span>
            <span className="block text-sm text-muted-foreground">Staff dashboard</span>
          </span>
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-1 px-3 pb-3 sm:grid-cols-3 md:block md:space-y-1">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                className={`flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[0.9375rem] transition-colors md:h-11 md:justify-center md:px-0 lg:justify-start lg:gap-3 lg:px-3 lg:text-base ${active ? "bg-accent font-medium text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate md:sr-only lg:not-sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
