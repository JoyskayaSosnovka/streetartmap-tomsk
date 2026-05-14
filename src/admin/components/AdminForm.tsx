import type { ComponentChildren, JSX } from 'preact';
import './AdminForm.css';

interface FieldProps {
  label: string;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ComponentChildren;
}

export function Field({ label, error, required, children }: FieldProps): JSX.Element {
  return (
    <div class={`admin-field${error ? ' admin-field--error' : ''}`}>
      <label class="admin-field__label">
        {label}
        {required && <span class="admin-field__required">*</span>}
      </label>
      {children}
      {error && <span class="admin-field__error">{error}</span>}
    </div>
  );
}

interface InputProps {
  value?: string | undefined;
  type?: string | undefined;
  error?: boolean | undefined;
  disabled?: boolean | undefined;
  autoFocus?: boolean | undefined;
  placeholder?: string | undefined;
  class?: string | undefined;
  style?: JSX.CSSProperties | undefined;
  onInput?: JSX.GenericEventHandler<HTMLInputElement> | undefined;
  onBlur?: JSX.FocusEventHandler<HTMLInputElement> | undefined;
  onChange?: JSX.GenericEventHandler<HTMLInputElement> | undefined;
  id?: string | undefined;
  name?: string | undefined;
  min?: string | number | undefined;
  max?: string | number | undefined;
  step?: string | number | undefined;
}

export function Input({ error, class: cls, ...rest }: InputProps): JSX.Element {
  return (
    <input
      class={`admin-input${error ? ' admin-input--error' : ''}${cls ? ` ${cls}` : ''}`}
      {...rest}
    />
  );
}

interface SelectProps {
  value?: string | undefined;
  error?: boolean | undefined;
  disabled?: boolean | undefined;
  class?: string | undefined;
  children?: ComponentChildren;
  onChange?: JSX.GenericEventHandler<HTMLSelectElement> | undefined;
  id?: string | undefined;
  name?: string | undefined;
}

export function Select({ error, class: cls, children, ...rest }: SelectProps): JSX.Element {
  return (
    <select
      class={`admin-select${error ? ' admin-select--error' : ''}${cls ? ` ${cls}` : ''}`}
      {...rest}
    >
      {children}
    </select>
  );
}

interface TextareaProps {
  value?: string | undefined;
  rows?: number | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  class?: string | undefined;
  style?: JSX.CSSProperties | undefined;
  onInput?: JSX.GenericEventHandler<HTMLTextAreaElement> | undefined;
  onBlur?: JSX.FocusEventHandler<HTMLTextAreaElement> | undefined;
  id?: string | undefined;
  name?: string | undefined;
}

export function Textarea({ class: cls, rows, ...rest }: TextareaProps): JSX.Element {
  return <textarea class={`admin-textarea${cls ? ` ${cls}` : ''}`} rows={rows ?? 4} {...rest} />;
}

interface FormActionsProps {
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}

export function FormActions({ onCancel, saving, isNew }: FormActionsProps): JSX.Element {
  return (
    <div class="admin-form-actions">
      <button type="button" class="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>
        Отмена
      </button>
      <button type="submit" class="admin-btn admin-btn--primary" disabled={saving}>
        {saving ? 'Сохранение…' : isNew ? 'Создать' : 'Сохранить'}
      </button>
    </div>
  );
}
