'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Auth runs entirely client-side (not a Server Action): the app has no
 * server-rendered pages that need the session, and a Server Action's
 * signInWithPassword/signUp would set the session in the *server's* cookie
 * jar without the already-running browser Supabase instance ever finding
 * out — so `authStore` would never update without a full page reload.
 * Calling the browser client directly fires `onAuthStateChange` immediately,
 * which `useAuthInit` is already listening for.
 */
export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setPending(true);
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    setPending(false);
    if (authError) setError(authError.message);
    else onOpenChange(false);
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const username = String(formData.get('username') ?? '').trim();
    if (!email || !password || !username) {
      setError('Email, username, and password are all required.');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setError('Username must be 3-20 characters: letters, numbers, and underscores only.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setPending(true);
    const { data, error: authError } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setPending(false);
    if (authError) {
      setError(
        authError.message.toLowerCase().includes('duplicate') || authError.code === '23505'
          ? 'That username is already taken.'
          : authError.message
      );
    } else if (!data.session) {
      // Email confirmation is required on this Supabase project: signUp
      // creates the user but returns no session, so there's nothing for
      // onAuthStateChange to fire on yet — closing the dialog here would
      // silently drop the user with no feedback that they aren't logged in.
      setNotice(`Check ${email} for a confirmation link, then log in.`);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          setNotice(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Log in' : 'Create an account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Log in to save mazes to the community gallery and appear on leaderboards.'
              : 'Pick a username — this is what shows up on leaderboards, not your email.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as 'login' | 'signup');
            setError(null);
            setNotice(null);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Logging in…' : 'Log in'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-username">Username</Label>
                <Input id="signup-username" name="username" required minLength={3} maxLength={20} autoComplete="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Creating account…' : 'Sign up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
