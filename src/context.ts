import { defineElements, init, type Murkio, type MurkioOptions } from '@murkio/html';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';

const MurkioContext = createContext<Murkio | null>(null);

export interface MurkioProviderProps extends MurkioOptions {
  children?: ReactNode;
}

/**
 * Creates the page's Murkio client in the browser and registers the
 * `<murkio-identity-*>` elements. On the server (SSR) nothing is created: the
 * client only exists where there is a window, and the hooks report "not loaded"
 * until the first render in the browser.
 */
export function MurkioProvider({ children, ...options }: MurkioProviderProps) {
  const [murkio, setMurkio] = useState<Murkio | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the client is created once per publishable key; other option changes need a reload
  useEffect(() => {
    defineElements();
    setMurkio(init(options));
  }, [options.publishableKey]);

  return createElement(MurkioContext.Provider, { value: murkio }, children);
}

/** The Murkio client, or null before it loads (server render, first paint). */
export function useMurkio(): Murkio | null {
  return useContext(MurkioContext);
}
