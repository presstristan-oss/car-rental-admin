"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== "/login") {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });

    // Listen for auth changes (e.g. sign-out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Show blank dark screen while checking auth (avoids flash of content)
  if (!ready && pathname !== "/login") {
    return <div className="min-h-screen bg-[#061224]" />;
  }

  return <>{children}</>;
}
