import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Portal
        </div>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
