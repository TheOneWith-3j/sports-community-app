import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/events", label: "Events" },
  { href: "/community", label: "Community" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card/60 p-5 md:block">
      <p className="mb-6 text-overline uppercase text-muted-foreground">RallyNook</p>
      <nav aria-label="Primary navigation" className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-xl px-3 py-2 text-label text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
