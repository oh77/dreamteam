"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Primary links stay as direct pills everywhere (incl. mobile); the rest
// collapse into a "More" dropdown on mobile and show inline on desktop.
const primary = [
  { href: "/best-team", label: "Best XI" },
  { href: "/worst-team", label: "Worst XI" },
  { href: "/results", label: "Results" },
];
const rest = [
  { href: "/upcoming-games", label: "Upcoming" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/predictions", label: "AI Picks" },
];

function pillClass(active: boolean) {
  return `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[color:var(--color-gold)] text-black"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const restActive = rest.some((l) => l.href === path);

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

        {/* Always-visible primary links */}
        <div className="flex items-center gap-1">
          {primary.map(({ href, label }) => (
            <Link key={href} href={href} className={pillClass(path === href)}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop: rest inline */}
        <div className="hidden items-center gap-1 sm:flex">
          {rest.map(({ href, label }) => (
            <Link key={href} href={href} className={pillClass(path === href)}>
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile: rest collapsed into a dropdown */}
        <div className="relative ml-auto sm:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className={`flex items-center gap-1 ${pillClass(restActive)}`}
          >
            More
            <span
              className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>

          {open && (
            <>
              {/* click-away backdrop */}
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                // biome-ignore lint/a11y/useSemanticElements: menu of links
                role="menu"
                className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-black/90 p-1 shadow-xl backdrop-blur-md"
              >
                {rest.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      path === href
                        ? "bg-[color:var(--color-gold)] text-black"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
