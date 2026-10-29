"use client";

import Link from "next/link";
import { CalendarDays, LayoutDashboard, Settings, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/community", label: "Community", icon: UsersRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/60 p-5 md:block">
      <p className="mb-6 px-3 text-overline uppercase text-muted-foreground">Your clubhouse</p>
      <nav aria-label="Primary navigation" className="space-y-1.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-label transition-colors ${
              active
                ? "bg-brand-primary/10 text-brand-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-brand-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
            {label}
          </Link>
          );
        })}
      </nav>
    </aside>
  );
}
