'use client';

import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) return <div className="h-8 w-16" />;

  if (!user) {
    return (
      <>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setDialogOpen(true)}>
          Log in
        </Button>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5" />}>
        <User className="h-3.5 w-3.5" />
        {user.username}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Signing out client-side (not a Server Action) so the browser's
            own Supabase instance fires onAuthStateChange immediately —
            a server-side signOut wouldn't be visible to the already-running
            client SDK until a full page reload. */}
        <DropdownMenuItem onClick={() => createClient().auth.signOut()}>
          <LogOut className="h-3.5 w-3.5" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
