import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/community", label: "Community" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 p-2 backdrop-blur-md md:hidden"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl px-2 py-3 text-center text-body-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
