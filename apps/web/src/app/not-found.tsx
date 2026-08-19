import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[12px] font-medium uppercase tracking-wide text-subtle-foreground">404</p>
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        The page you are looking for does not exist or you no longer have access to it.
      </p>
      <Link href="/projects" className="mt-2 text-[13px] font-medium text-primary hover:underline">
        Back to projects
      </Link>
    </div>
  );
}
