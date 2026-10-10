import type { MurkioError } from '@murkio/html';
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Listeners {
  onLogin?: () => void;
  onError?: (error: MurkioError) => void;
  onStep?: (step: string) => void;
}

/**
 * Listens to the `murkio:*` events of a custom element. React does not map
 * event names with a colon, so the listeners are added by hand; the latest
 * callbacks are read from a ref, so re-renders never re-subscribe.
 */
function useEvents(listeners: Listeners) {
  const ref = useRef<HTMLElement>(null);
  const latest = useRef(listeners);
  latest.current = listeners;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const login = () => latest.current.onLogin?.();
    const error = (event: Event) => latest.current.onError?.((event as CustomEvent<MurkioError>).detail);
    const step = (event: Event) => latest.current.onStep?.((event as CustomEvent<{ step: string }>).detail.step);
    node.addEventListener('murkio:login', login);
    node.addEventListener('murkio:error', error);
    node.addEventListener('murkio:step', step);
    return () => {
      node.removeEventListener('murkio:login', login);
      node.removeEventListener('murkio:error', error);
      node.removeEventListener('murkio:step', step);
    };
  }, []);

  return ref;
}

export interface CanvasProps extends Listeners {
  /** `sign_in` (default) or `sign_up`. */
  screen?: 'sign_in' | 'sign_up';
  locale?: string;
  /** Render without a shadow root (for password managers that do not look inside one). */
  lightDom?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** The login canvas designed in the dashboard, with the whole sign-in flow. */
export function MurkioIdentityCanvas({ screen, locale, lightDom, className, style, ...listeners }: CanvasProps) {
  const ref = useEvents(listeners);
  return createElement('murkio-identity-canvas', {
    ref,
    screen,
    locale,
    'light-dom': lightDom ? '' : undefined,
    className,
    style,
  });
}

interface FieldProps {
  className?: string;
  /** Joins components into separate forms; components without it share the page form. */
  form?: string;
}

export interface InputProps extends FieldProps {
  placeholder?: string;
  label?: string;
  autoComplete?: string;
}

export function MurkioIdentityEmailInput({ className, form, placeholder, label, autoComplete }: InputProps) {
  return createElement('murkio-identity-email-input', { className, form, placeholder, label, autocomplete: autoComplete });
}

export function MurkioIdentityPasswordInput({ className, form, placeholder, label, autoComplete }: InputProps) {
  return createElement('murkio-identity-password-input', { className, form, placeholder, label, autocomplete: autoComplete });
}

export interface KeepLoggedProps extends FieldProps {
  label?: string;
  defaultChecked?: boolean;
}

export function MurkioIdentityKeepLogged({ className, form, label, defaultChecked }: KeepLoggedProps) {
  return createElement('murkio-identity-keep-logged', { className, form, label, checked: defaultChecked ? '' : undefined });
}

export interface ButtonProps extends FieldProps, Listeners {
  children?: ReactNode;
  label?: string;
}

export function MurkioIdentityLoginButton({ className, form, label, children, ...listeners }: ButtonProps) {
  const ref = useEvents(listeners);
  return createElement('murkio-identity-login-button', { ref, className, form, label: label ?? (typeof children === 'string' ? children : undefined) });
}

export function MurkioIdentityRegisterButton({ className, form, label, children, ...listeners }: ButtonProps) {
  const ref = useEvents(listeners);
  return createElement('murkio-identity-register-button', { ref, className, form, label: label ?? (typeof children === 'string' ? children : undefined) });
}

/** Shows the translated error of its form. */
export function MurkioIdentityError({ className, form }: FieldProps) {
  return createElement('murkio-identity-error', { className, form });
}
