# @murkio/react

Murkio identity for React (18 and 19). Wraps [`@murkio/html`](../html/README.md):
the login canvas designed in the Murkio dashboard, the standalone components, and
hooks for the session. The only setting is your publishable key.

```tsx
import { MurkioProvider, MurkioIdentityCanvas, SignedIn, SignedOut, useAuth, useUser } from '@murkio/react';

export function App() {
  return (
    <MurkioProvider publishableKey="pk_..." afterLogin="/dashboard">
      <SignedOut>
        <MurkioIdentityCanvas onLogin={() => console.log('signed in')} />
      </SignedOut>
      <SignedIn>
        <Profile />
      </SignedIn>
    </MurkioProvider>
  );
}

function Profile() {
  const { user } = useUser();          // email, email_verified, roles, mfa_enabled
  const { getToken, signOut } = useAuth();
  return <button onClick={signOut}>Sign out {user?.email}</button>;
}
```

Your own layout, styled with your classes (they reach the real `<input>`/`<button>`):

```tsx
<MurkioIdentityEmailInput className="input" placeholder="you@example.com" />
<MurkioIdentityPasswordInput className="input" />
<MurkioIdentityKeepLogged label="Keep me signed in" />
<MurkioIdentityLoginButton className="btn">Sign in</MurkioIdentityLoginButton>
<MurkioIdentityRegisterButton className="btn btn-ghost">Create account</MurkioIdentityRegisterButton>
<MurkioIdentityError />
```

- `MurkioProvider` takes every `@murkio/html` option (`apiUrl`, `locale`, `afterLogin`,
  `oauthRedirectUrl`, `cookieDomain`). The client is created only in the browser; on
  the server render the hooks report `isLoaded: false`.
- `useAuth()`: `{ isLoaded, isSignedIn, claims, getToken, signOut }`. Use `getToken()`
  to call your API with `Authorization: Bearer <token>`.
- `useUser()`: the profile from `POST /v1/me`, cached for a minute per session.
- Events: `onLogin`, `onError(error)` (`error.code`) and `onStep(step)` on the canvas and
  the buttons.
- For Next.js use `@murkio/next`, which adds the server side (middleware, `auth()`).
