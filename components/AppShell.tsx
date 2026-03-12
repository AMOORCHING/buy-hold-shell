"use client";

import { useSession } from "next-auth/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <main className="h-[calc(100vh-3.5rem)] overflow-hidden px-4 py-3">
      {children}
    </main>
  );
}
