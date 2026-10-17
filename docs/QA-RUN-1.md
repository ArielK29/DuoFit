# DuoFit: QA run 1 (without a phone), 2026-10-17

First pass of checklist item B8 that Claude can do on its own: the code scan for every button, and the flows that can be driven in the browser without a signed-in account. **This is not the device pass.** Android and iPhone columns of [QA-FLOWS.md](QA-FLOWS.md) stay empty until someone runs them on real phones (Claude cannot sign in with a real account or create one).

## 1. Every button (static scan)
`npm run qa:scan` reads all screens and components with the TypeScript parser. Result: **167 handlers in 44 files**, every file mapped to at least one flow ([QA-INVENTORY.md](QA-INVENTORY.md)), and:
- 0 handlers that do nothing,
- 0 icon-only buttons without an accessibility label,
- 0 English texts on a screen (the one allowed case is the map attribution "© OpenStreetMap · © CARTO", which the tile licences require),
- 0 "coming soon" or placeholder words.
The same scan runs inside `npm test`, so a new screen without a flow row, or a button that does nothing, fails the tests.

Not covered by the scan: whether a handler does the right thing. That is what the flows are for.

## 2. Flows driven in the browser (web build, local)
| Flow | What was done | Result |
|---|---|---|
| 1 Sign up (validation, terms) | Empty sign-up form; open terms from sign-up; back | "הזן שם (לפחות 2 תווים)" shown; terms open with the new providers and retention sections; back returns to sign-up |
| 2 Confirm e-mail (landing) | Open the confirmation link with an expired error, a damaged token and no link | Plain Hebrew message each time; "to login" works (see PR 109) |
| 4 Wrong input | Login with empty fields; login with "abc" | "הזן כתובת אימייל תקינה", no crash, no request sent |
| 5 Forgot password (links) | Reset link with an expired error, a damaged token, no link; "request a new link" | Hebrew messages; button opens the forgot-password screen; the reset request carries the right return address (see PR 108) |

## 3. Not done here, needs a person with a phone or an account
Flows 3, 6 to 22 (everything behind sign-in), sign-in with a wrong password, the real e-mail round trips (1, 2, 5), permissions, airplane mode, large text, cold start. They are in [QA-FLOWS.md](QA-FLOWS.md) for the device pass (checklist A8).
