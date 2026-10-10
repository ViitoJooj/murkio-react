import type { AccessClaims, Me } from '@murkio/html';
import { createElement, Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useMurkio } from './context';

export interface AuthState {
  /** False until the client loaded in the browser. */
  isLoaded: boolean;
  isSignedIn: boolean;
  /** The access token claims (sub, sid, roles...), read without verification: use them for display only. */
  claims: AccessClaims | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const murkio = useMurkio();
  const [claims, setClaims] = useState<AccessClaims | null>(null);

  useEffect(() => (murkio ? murkio.onAuthChange(setClaims) : undefined), [murkio]);

  const getToken = useCallback(() => (murkio ? murkio.getToken() : Promise.resolve(null)), [murkio]);
  const signOut = useCallback(() => (murkio ? murkio.signOut() : Promise.resolve()), [murkio]);

  return { isLoaded: murkio !== null, isSignedIn: claims !== null, claims, getToken, signOut };
}

export interface UserState {
  isLoaded: boolean;
  user: Me | null;
  error: unknown;
}

/** The signed-in user's profile (POST /v1/me: email, verification, roles, 2FA). */
export function useUser(): UserState {
  const murkio = useMurkio();
  const { claims } = useAuth();
  const [state, setState] = useState<UserState>({ isLoaded: false, user: null, error: null });

  useEffect(() => {
    if (!murkio) return;
    let active = true;
    if (!claims) {
      setState({ isLoaded: true, user: null, error: null });
      return;
    }
    murkio.getUser().then(
      (user) => active && setState({ isLoaded: true, user, error: null }),
      (error: unknown) => active && setState({ isLoaded: true, user: null, error }),
    );
    return () => {
      active = false;
    };
  }, [murkio, claims?.sid, claims?.sub]);

  return state;
}

/** Renders its children only when someone is signed in. */
export function SignedIn({ children }: { children?: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && isSignedIn ? createElement(Fragment, null, children) : null;
}

/** Renders its children only when nobody is signed in (after the client loaded). */
export function SignedOut({ children }: { children?: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && !isSignedIn ? createElement(Fragment, null, children) : null;
}
