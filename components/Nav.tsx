"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/best-team", label: "Best XI" },
  { href: "/worst-team", label: "Worst XI" },
  { href: "/upcoming-games", label: "Upcoming" },
  { href: "/results", label: "Results" },
  { href: "/players", label: "Players" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:gap-2">
        <Link
          href="/best-team"
          className="mr-4 flex items-center gap-2 text-[color:var(--color-gold)] font-bold text-base shrink-0"
        >
          <span className="text-xl">⚽</span>
          <span className="hidden sm:inline">Dream Team</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                path === href
                  ? "bg-[color:var(--color-gold)] text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
