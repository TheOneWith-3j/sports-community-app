import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="text-heading-md text-foreground underline-offset-4 hover:underline"
          >
            RallyNook
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
