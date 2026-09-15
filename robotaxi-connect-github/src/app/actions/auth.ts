'use server';
import { redirect, unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/server';
import { requireIdentity } from '@/lib/auth';
import { appUrl, registrationEnabled, isConfigured } from '@/lib/env';
import { registerSchema, credentialsSchema } from '@/lib/validation';
import { localeOf } from '@/lib/domain';
import { authRateLimit } from '@/lib/rate-limit';
import type { ActionState } from '@/lib/action-state';
export async function authAction(
  mode: string,
  lang: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const locale = localeOf(lang);
  if (!isConfigured()) return { error: 'unavailable' };
  try {
    await authRateLimit(mode);
    const db = await supabase();
    const input = Object.fromEntries(form.entries());
    if (mode === 'register') {
      if (!registrationEnabled()) return { error: 'legalNotReady' };
      const data = registerSchema.parse({
        ...input,
        locale,
        consent: form.get('consent') === 'on',
      });
      if (data.password !== form.get('confirm_password')) return { error: 'passwordMismatch' };
      const { error } = await db.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${appUrl()}/${locale}/auth/callback`,
          data: { first_name: data.first_name, last_name: data.last_name, locale },
        },
      });
      if (error) return { error: error.status === 429 ? 'rateLimited' : 'error' };
      redirect(`/${locale}/register/verify`);
    }
    if (mode === 'login') {
      const data = credentialsSchema.extend({ password: z.string().min(1).max(128) }).parse(input);
      const { error } = await db.auth.signInWithPassword(data);
      if (error) return { error: error.status === 429 ? 'rateLimited' : 'authError' };
      redirect(`/${locale}/portal`);
    }
    if (mode === 'forgot') {
      const email = z.email().max(254).parse(input.email);
      await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl()}/${locale}/auth/callback?next=reset-password`,
      });
      return { ok: true, message: 'resetSent' };
    }
    if (mode === 'resend') {
      const email = z.email().max(254).parse(input.email);
      await db.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${appUrl()}/${locale}/auth/callback` },
      });
      return { ok: true, message: 'checkEmail' };
    }
    if (mode === 'reset') {
      await requireIdentity(locale);
      const password = z.string().min(12).max(128).parse(input.password);
      if (password !== input.confirm_password) return { error: 'passwordMismatch' };
      const { error } = await db.auth.updateUser({ password });
      if (error) return { error: 'error' };
      return { ok: true, message: 'passwordChanged' };
    }
    return { error: 'error' };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof z.ZodError)
      return { error: 'invalid', fields: [...new Set(error.issues.map((i) => String(i.path[0])))] };
    return {
      error: error instanceof Error && error.message === 'RATE_LIMITED' ? 'rateLimited' : 'error',
    };
  }
}
export async function logoutAction(locale: string) {
  if (isConfigured()) {
    const db = await supabase();
    await db.auth.signOut();
  }
  redirect(`/${localeOf(locale)}/login`);
}
