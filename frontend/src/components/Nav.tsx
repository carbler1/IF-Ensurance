"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Calculator, FlaskConical, Home, Store, Users } from "lucide-react";
import { signOut } from "@/app/login/actions";
import mark from "./mark.png";

// Grouped by task: what staff configure, then where they check the result.
const groups = [
  { title: null, links: [{ href: "/", label: "Overview", Icon: Home }] },
  {
    title: "Set the rules",
    links: [
      { href: "/scoring", label: "Score & pricing", Icon: Calculator },
      { href: "/tiers", label: "Tiers & rewards", Icon: Award },
      { href: "/partners", label: "Partners", Icon: Store },
    ],
  },
  {
    title: "See the result",
    links: [
      { href: "/simulator", label: "Simulator", Icon: FlaskConical },
      { href: "/customers", label: "Customers", Icon: Users },
    ],
  },
];

export function Nav({ company }: { company: string | null }) {
  const pathname = usePathname();
  if (!company) return null; // signed out: the sign-in page has no nav
  return (
    // Phones: the links in a grid above the page. Tablets (md): an icon rail. Desktops (lg): the full side menu.
    <nav className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-[4.5rem] md:shrink-0 md:border-r md:border-b-0 lg:w-64">
      <div className="px-5 pt-5 pb-4 md:px-4 md:pt-6 md:pb-8 lg:px-5">
        <Link href="/" className="flex items-center gap-3">
          {/* The If disc mark. */}
          <Image src={mark} alt="If" width={40} height={40} priority className="h-10 w-10 shrink-0" />
          <span className="md:hidden lg:block">
            <span className="block text-xl leading-tight font-semibold tracking-[-0.02em]">Ensurance</span>
            <span className="block text-sm text-muted-foreground">Staff dashboard</span>
          </span>
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-1 px-3 pb-3 sm:grid-cols-3 md:block md:space-y-1">
        {groups.flatMap((g) => [
          g.title && <li key={g.title} className="hidden px-3 pt-4 pb-1 text-sm font-medium text-muted-foreground lg:block">{g.title}</li>,
          ...g.links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                className={`flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[0.9375rem] font-medium transition-colors md:h-11 md:justify-center md:px-0 lg:justify-start lg:gap-3 lg:px-3 lg:text-base ${active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate md:sr-only lg:not-sr-only">{label}</span>
              </Link>
            </li>
          );
          }),
        ])}
      </ul>
      <form action={signOut} className="mx-3 mt-1 mb-4 border-t px-2 pt-4 text-sm md:hidden lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:block lg:px-3">
        <p className="truncate font-medium" title={company}>{company}</p>
        <button className="mt-0.5 rounded text-muted-foreground underline underline-offset-2 hover:text-foreground">Sign out</button>
      </form>
    </nav>
  );
}
