'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Locale } from '@/lib/domain';
import { messages, type MessageKey } from '@/i18n/messages';
import { initialState, type ActionState } from '@/lib/action-state';
export type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;
function Submit({ locale, text, disabled }: { locale: Locale; text: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button primary" type="submit" disabled={disabled || pending}>
      {pending ? messages[locale].saving : text}
    </button>
  );
}
export function ActionForm({
  action,
  locale,
  children,
  submit = 'save',
  disabled = false,
  className = '',
}: {
  action: FormAction;
  locale: Locale;
  children: React.ReactNode;
  submit?: MessageKey;
  disabled?: boolean;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const m = messages[locale];
  return (
    <form action={formAction} className={`action-form ${className}`}>
      <fieldset disabled={disabled}>{children}</fieldset>
      {state.error && (
        <div role="alert" className="notice error">
          {m[state.error]}
          {state.fields?.length ? (
            <ul>
              {state.fields.map((f) => (
                <li key={f}>{m[f as MessageKey] || f}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {state.ok && (
        <div role="status" className="notice success">
          {m[state.message || 'saved']}
        </div>
      )}
      <Submit locale={locale} text={m[submit]} disabled={disabled} />
    </form>
  );
}
