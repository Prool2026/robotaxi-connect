import { useId } from 'react';
import type { Locale } from '@/lib/domain';
import { label, messages, type MessageKey } from '@/i18n/messages';
type FieldProps = {
  name: string;
  locale: Locale;
  labelKey?: MessageKey;
  value?: string | number | null;
  required?: boolean;
  type?: string;
  options?: readonly string[];
  choices?: { value: string; label: string }[];
  hint?: MessageKey;
  min?: number;
  max?: number;
  step?: string;
  wide?: boolean;
  autoComplete?: string;
  readOnly?: boolean;
};
export function Field({
  name,
  locale,
  labelKey,
  value,
  required = false,
  type = 'text',
  options,
  choices,
  hint,
  min,
  max,
  step,
  wide,
  autoComplete,
  readOnly,
}: FieldProps) {
  const title = label(locale, labelKey || name);
  const generatedId = useId();
  const id = `field-${name}-${generatedId}`;
  return (
    <div className={`field ${wide ? 'full' : ''}`}>
      <label htmlFor={id}>
        {title}
        {required && <span className="required"> *</span>}
      </label>
      {options || choices ? (
        <select id={id} name={name} defaultValue={String(value ?? '')} required={required}>
          {(choices || options!.map((v) => ({ value: v, label: label(locale, v) }))).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          defaultValue={value ?? ''}
          required={required}
          rows={4}
          maxLength={max || 5000}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={value ?? ''}
          required={required}
          min={min}
          max={max}
          step={step}
          maxLength={type === 'number' ? undefined : max || 200}
          autoComplete={autoComplete}
          readOnly={readOnly}
        />
      )}{' '}
      {hint && <small>{messages[locale][hint]}</small>}
    </div>
  );
}
export function Checkbox({
  name,
  locale,
  text,
  checked = false,
  required = false,
}: {
  name: string;
  locale: Locale;
  text: MessageKey;
  checked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="checkbox">
      <input name={name} type="checkbox" defaultChecked={checked} required={required} />
      <span>{messages[locale][text]}</span>
    </label>
  );
}
