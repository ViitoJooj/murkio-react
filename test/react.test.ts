import { getMurkio, reset } from '@murkio/html';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MurkioIdentityCanvas,
  MurkioIdentityEmailInput,
  MurkioIdentityLoginButton,
  MurkioProvider,
  SignedIn,
  SignedOut,
  useAuth,
} from '../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'x', details: [{ code: 'network', message: 'offline' }] }), { status: 503 }));

function jwt(claims: Record<string, unknown>) {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  return `${encode({ alg: 'EdDSA' })}.${encode(claims)}.sig`;
}

let container: HTMLElement;
let root: Root;

async function render(node: ReactNode) {
  await act(async () => {
    root.render(createElement(MurkioProvider, { publishableKey: 'pk_react', apiUrl: 'https://api.example.com', fetch }, node));
  });
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  reset();
});

describe('MurkioProvider and hooks', () => {
  it('creates the client in the browser and follows the session', async () => {
    let auth: ReturnType<typeof useAuth> | null = null;
    function Probe() {
      auth = useAuth();
      return null;
    }
    await render(createElement(Probe));

    expect(auth!.isLoaded).toBe(true);
    expect(auth!.isSignedIn).toBe(false);
    expect(customElements.get('murkio-identity-canvas')).toBeDefined();

    const exp = Math.floor(Date.now() / 1000) + 900;
    await act(async () => {
      getMurkio()!.session.setSession(
        { access_token: jwt({ sub: 'user-1', sid: 's1', exp, roles: ['admin'] }), token_type: 'Bearer', expires_in: 900, refresh_token: 'rt', session_id: 's1' },
        true,
      );
    });
    expect(auth!.isSignedIn).toBe(true);
    expect(auth!.claims?.roles).toEqual(['admin']);
  });

  it('switches SignedIn and SignedOut', async () => {
    await render(createElement('div', null, createElement(SignedIn, null, 'in'), createElement(SignedOut, null, 'out')));
    expect(container.textContent).toBe('out');
  });
});

describe('components', () => {
  it('renders the canvas element and maps its events to props', async () => {
    const onLogin = vi.fn();
    const onError = vi.fn();
    await render(createElement(MurkioIdentityCanvas, { screen: 'sign_up', lightDom: true, className: 'card', onLogin, onError }));

    const element = container.querySelector('murkio-identity-canvas')!;
    expect(element.getAttribute('screen')).toBe('sign_up');
    expect(element.hasAttribute('light-dom')).toBe(true);
    expect(element.getAttribute('class')).toBe('card');

    element.dispatchEvent(new CustomEvent('murkio-login', { bubbles: true }));
    element.dispatchEvent(new CustomEvent('murkio-error', { detail: { code: 'rsb-00' }, bubbles: true }));
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({ code: 'rsb-00' });
  });

  it('passes the developer classes to the real controls', async () => {
    await render(
      createElement('div', null,
        createElement(MurkioIdentityEmailInput, { className: 'input input-bordered', placeholder: 'you@example.com' }),
        createElement(MurkioIdentityLoginButton, { className: 'btn' }, 'Sign in'),
      ),
    );
    expect(container.querySelector('murkio-identity-email-input input')?.className).toBe('input input-bordered');
    expect(container.querySelector('murkio-identity-email-input input')?.getAttribute('placeholder')).toBe('you@example.com');
    expect(container.querySelector('murkio-identity-login-button button')?.textContent).toBe('Sign in');
  });
});
