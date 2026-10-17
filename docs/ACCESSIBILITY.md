# DuoFit: accessibility check (B12), 2026-10-17

What can be checked without a phone is checked and locked by tests. What needs a phone is listed at the end.

## Verified (and kept verified by `npm test`)
| Check | Result | Where |
|---|---|---|
| Text colours against every surface they are drawn on (page, card, pressed card) | All at or above 4.5:1 (WCAG AA): text, secondary and tertiary text, magenta, cyan, warning, error, success | `lib/contrast.test.ts` |
| Button labels on button backgrounds | Black on magenta (primary) and on the error colour (danger) and the text colour on the card colour (secondary) all at or above 4.5:1 | `lib/contrast.test.ts` |
| Every touchable element has a name for a screen reader | 0 icon-only buttons without a label among 167 handlers | `npm run qa:scan`, inside `npm test` |
| `Button` keeps its name and announces disabled and busy while a spinner shows | Done in PR for B8 | `components/Button.tsx` |
| Minimum touch target | `Button` has `minHeight: 48`; small controls use `hitSlop` | read from the code |
| Text scales with the phone's text size | No screen turns off font scaling (`allowFontScaling` / `maxFontSizeMultiplier` are not used) | read from the code |

## Observations, not blockers
- 21 small labels use 10 or 11 point type (tab labels, chart captions, small counters). They scale with the phone's text-size setting, and their colours pass AA. If the device pass shows them too small at the default size, raise them to 12.
- The pink button with black text passes AA (about 5.6:1) but is bright. That is a design choice, kept.

## Needs a phone (checklist A8, QA-FLOWS flow 21 and 19)
- VoiceOver on iPhone and TalkBack on Android: reading order on every tab, in right-to-left.
- The largest text size: no cut text, nothing hidden under the sticky bars or the tab bar.
- Dark mode is the only mode; check the status bar icons stay readable.
- Reduce Motion setting: the 300 ms screen transitions still work (they are short fades and slides).
