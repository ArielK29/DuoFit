# DuoFit: accessibility check (B12), 2026-10-17

What can be checked without a phone is checked and locked by tests. What needs a phone is listed at the end.

## Verified (and kept verified by `npm test`)
| Check | Result | Where |
|---|---|---|
| Text colours against every surface they are drawn on (page, card, pressed card) | All at or above 4.5:1 (WCAG AA): text, secondary and tertiary text, magenta, cyan, warning, error, success | `lib/contrast.test.ts` |
| Button labels on button backgrounds | Black on magenta (primary) and on the error colour (danger) and the text colour on the card colour (secondary) all at or above 4.5:1 | `lib/contrast.test.ts` |
| Every touchable element has a name for a screen reader | 0 icon-only buttons without a label among 167 handlers | `npm run qa:scan`, inside `npm test` |
| `Button` keeps its name and announces disabled and busy while a spinner shows | Done in PR for B8 | `components/Button.tsx` |
| Minimum touch target | `Button` has `minHeight: 48`. A scan of every `Pressable` style (2026-10-23) found one control under 48 points without `hitSlop`: the "remove image" button in the post composer (32 points); it now has `hitSlop` 8 and a button role | scan + `screens/community/ComposeModal.tsx` |
| Text scales with the phone's text size | Up to 1.35x the normal size, then it stops (`lib/fontScale.ts`, installed on the real react-native module by `lib/limitFontScaling.ts`, unit-tested). Without the cap the titles broke one letter per line at the largest accessibility size. Checked on an iPhone at the largest size on Home, Matches, Chats, Community and Progress (2026-10-23); Samsung not yet | `lib/limitFontScaling.test.ts` + device |

## Observations, not blockers
- 21 small labels use 10 or 11 point type (tab labels, chart captions, small counters). They scale with the phone's text-size setting, and their colours pass AA. If the device pass shows them too small at the default size, raise them to 12.
- The pink button with black text passes AA (about 5.6:1) but is bright. That is a design choice, kept.

## Needs a phone (checklist A8, QA-FLOWS flow 21 and 19)
- VoiceOver on iPhone and TalkBack on Android: reading order on every tab, in right-to-left.
- The largest text size: no cut text, nothing hidden under the sticky bars or the tab bar.
- Dark mode is the only mode; check the status bar icons stay readable.
- Reduce Motion setting: the 300 ms screen transitions still work (they are short fades and slides).

## VoiceOver / TalkBack script (for the first TestFlight build, about 15 minutes per phone)
1. Turn the screen reader on (iPhone: Settings, Accessibility, VoiceOver; Samsung: Settings, Accessibility, TalkBack). Swipe right/left to move between items.
2. Sign-in screen: the two fields, the sign-in button and the two links are each read once, in a sensible order, with Hebrew names (no "button" alone, no English file names).
3. Each tab (Home, Matches, Chats, Community, Progress): the title is read first; every icon (bell, filter, SOS, avatar, add) has a spoken name; the tab bar names the tab and says which one is selected.
4. Matches: the match card reads name, percent and distance; "הזמן לאימון", the pass and the chat buttons are reachable and named.
5. Chat: a message from the other member says that it can be reported (the hint "דיווח או חסימה"); the send button is named and says when it is disabled.
6. SOS: the dialog is read as a dialog, the two numbers and "ביטול" are reachable, and nothing dials without a second action.
7. Forms (profile setup, invite, weight): each field has a visible label that is also read; an error message is announced.
8. Record any item read in the wrong order or without a name in `docs/QA-RUN-2.md`, fix, repeat.
