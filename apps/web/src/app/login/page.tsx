import type { Metadata } from 'next';
import { Logo } from '@/components/layout/logo';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Logo />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to your workspace
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Use the account your workspace administrator created for you.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
