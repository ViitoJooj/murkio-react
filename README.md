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

## Developing

```sh
npm ci     # also builds the package (the `prepare` script)
npm test
```

`@murkio/html` is not on the npm registry yet, so `package.json` takes it from its
repository at a pinned commit, built on install; `.npmrc` allows that (npm 12 refuses git
dependencies by default) and `npm publish` refuses to run until the dependency is a plain
version. The tests run against that build, the same code an application gets.

The checks in `infra/pipeline/` are kept in the Murkio identity service and synced from
there, so they are not edited here.

Every pull request runs the workflows in `.github/workflows`. The same checks, locally:

| Workflow | What it runs |
| --- | --- |
| Build | `npm run build`, `npm run package:check` (publint) and `npm pack --dry-run`, on Node.js 20 and 24 |
| Format | `npm run format:check` (Biome; `npm run format` fixes) |
| Lint | `npm run lint` (Biome), `npm run typecheck` (strict TypeScript) |
| Tests | `npm test` on Node.js 20 and 24 |
| Quality & Governance Checks | `for check in infra/pipeline/*.py; do python3 "$check"; done` |
| Security | `npm audit --omit=dev`, `npm audit --audit-level=high`, `npm audit signatures`, `gitleaks git .`, `zizmor --pedantic .` |
| CodeQL, Dependency Review | run by GitHub on the pull request |

Security reports: see [SECURITY.md](SECURITY.md).
