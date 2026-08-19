'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        The page could not be displayed. Try again, and if the problem persists reload the
        application.
      </p>
      <Button className="mt-2" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
