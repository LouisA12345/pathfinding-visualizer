'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

/**
 * Establishes the client-side auth session once, and keeps `authStore` in
 * sync with Supabase's own auth state changes (login/logout/token refresh)
 * for the lifetime of the app. Call once, near the root (`AppShell`).
 */
export function useAuthInit(): void {
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadUser(userId: string, email: string) {
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
      if (active) useAuthStore.getState().setUser({ id: userId, email, username: profile?.username ?? email });
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) loadUser(data.user.id, data.user.email ?? '');
      else useAuthStore.getState().setUser(null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user.id, session.user.email ?? '');
      else useAuthStore.getState().setUser(null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);
}
