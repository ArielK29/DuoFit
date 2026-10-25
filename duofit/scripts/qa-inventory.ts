// Static inventory of every interactive handler in the app, plus a few checks for things that look like
// unfinished or inaccessible buttons. Used for checklist item B8 (docs/QA-FLOWS.md).
//   npm run qa:scan            prints the report
//   npm run qa:scan -- --md    prints the report as markdown
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// QA_ROOT lets the tests point the scan at a small fixture project.
const ROOT = process.env.QA_ROOT ? path.resolve(process.env.QA_ROOT) + path.sep : fileURLToPath(new URL('../', import.meta.url));
const DIRS = ['screens', 'components', 'src/app'];
const HANDLERS = new Set(['onPress', 'onPressIn', 'onPressOut', 'onLongPress', 'onChangeText', 'onValueChange', 'onSubmitEditing', 'onSlidingComplete']);
const TOUCHABLES = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight']);

interface Finding {
  file: string;
  line: number;
  kind: 'empty-handler' | 'icon-only-no-label' | 'english-text' | 'placeholder-word';
  detail: string;
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

function tagName(node: ts.JsxOpeningLikeElement): string {
  return node.tagName.getText();
}

function attrNames(node: ts.JsxOpeningLikeElement): Set<string> {
  const names = new Set<string>();
  node.attributes.properties.forEach((p) => {
    if (ts.isJsxAttribute(p)) names.add(p.name.getText());
  });
  return names;
}

function isEmptyFunction(expr: ts.Expression): boolean {
  if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
    const body = expr.body;
    return ts.isBlock(body) && body.statements.length === 0;
  }
  return false;
}

// Does the element show any readable text (a Text child, a string, or a text expression)?
function hasVisibleText(node: ts.JsxElement): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (found) return;
    if (ts.isJsxText(n) && n.text.trim()) found = true;
    else if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && /(^|\.)Text$/.test(n.tagName.getText())) found = true;
    else if (ts.isJsxExpression(n) && n.expression && (ts.isStringLiteral(n.expression) || ts.isTemplateExpression(n.expression))) found = true;
    else if (ts.isJsxExpression(n) && n.expression && ts.isIdentifier(n.expression) && n.expression.text === 'children') found = true;
    ts.forEachChild(n, visit);
  };
  node.children.forEach(visit);
  return found;
}

const LATIN_WORD = /[A-Za-z]{3,}/;
const HEBREW = /[֐-׿]/;
// Product and technical names that are fine in a Hebrew screen.
const ALLOWED_LATIN = /^(FitFriend|Google|Apple|OK|SOS|Supabase|PostHog|Vercel|e-?mail|name@example\.com|kg|km|ק"מ)$/i;

function scan(file: string): { handlers: number; byHandler: Record<string, number>; findings: Finding[] } {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: Finding[] = [];
  const byHandler: Record<string, number> = {};
  let handlers = 0;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;

  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText();
      if (HANDLERS.has(name)) {
        handlers++;
        byHandler[name] = (byHandler[name] ?? 0) + 1;
        const init = node.initializer;
        if (init && ts.isJsxExpression(init) && init.expression && isEmptyFunction(init.expression)) {
          findings.push({ file: rel, line: lineOf(node), kind: 'empty-handler', detail: `${name} does nothing` });
        }
      }
      // Hebrew UI: visible strings that are English.
      if (['label', 'placeholder', 'title', 'accessibilityLabel', 'headline', 'subheading', 'ctaLabel'].includes(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const text = node.initializer.text;
        if (LATIN_WORD.test(text) && !HEBREW.test(text) && !ALLOWED_LATIN.test(text.trim())) {
          findings.push({ file: rel, line: lineOf(node), kind: 'english-text', detail: `${name}="${text}"` });
        }
      }
    }
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      if (text && LATIN_WORD.test(text) && !HEBREW.test(text) && !ALLOWED_LATIN.test(text)) {
        findings.push({ file: rel, line: lineOf(node), kind: 'english-text', detail: `text "${text}"` });
      }
      if (/בקרוב|coming soon|TODO|lorem/i.test(text)) {
        findings.push({ file: rel, line: lineOf(node), kind: 'placeholder-word', detail: `text "${text}"` });
      }
    }
    if (ts.isStringLiteral(node) && /coming soon|lorem ipsum|TODO/i.test(node.text)) {
      findings.push({ file: rel, line: lineOf(node), kind: 'placeholder-word', detail: `"${node.text.slice(0, 60)}"` });
    }
    if (ts.isJsxElement(node) && TOUCHABLES.has(tagName(node.openingElement))) {
      const attrs = attrNames(node.openingElement);
      if (!attrs.has('accessibilityLabel') && !hasVisibleText(node)) {
        findings.push({ file: rel, line: lineOf(node), kind: 'icon-only-no-label', detail: `<${tagName(node.openingElement)}> has no text and no accessibilityLabel` });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { handlers, byHandler, findings };
}

// Which flow(s) in docs/QA-FLOWS.md exercise each file's buttons. "all" = shared building block used by every flow.
// A file with handlers that is missing here fails --check: add the file (or a new flow row) when you add a screen.
const FLOW_MAP: Record<string, string> = {
  'components/AccountSheet.tsx': '3, 11, 18',
  'components/BackButton.tsx': '7, 8, 12',
  'components/BottomSheet.tsx': 'all',
  'components/Button.tsx': 'all',
  'components/Card.tsx': 'all',
  'components/EmptyState.tsx': 'all',
  'components/ErrorFallback.tsx': '22',
  'components/FilterSheet.tsx': '7',
  'components/HeaderActions.tsx': '15, 17',
  'components/Input.tsx': 'all',
  'components/NearbyPartnersRow.tsx': '7, 8',
  'components/NotificationBell.tsx': '15',
  'components/ScheduleForm.tsx': '8, 12',
  'components/SegmentedToggle.tsx': 'all',
  'components/SuggestedPartnerCard.tsx': '7, 8',
  'components/UpcomingWorkoutCard.tsx': '12, 13',
  'components/ValueStepper.tsx': '16',
  'screens/chat/ChatListScreen.tsx': '10, 11',
  'screens/chat/ConversationScreen.tsx': '10, 11, 12',
  'screens/chat/NewChatSheet.tsx': '10',
  'screens/checkout/CheckInScreen.tsx': '13',
  'screens/community/ChallengeSection.tsx': '14',
  'screens/community/CommentsModal.tsx': '11, 14',
  'screens/community/CommunityScreen.tsx': '14',
  'screens/community/ComposeModal.tsx': '14',
  'screens/community/GroupsSection.tsx': '14',
  'screens/community/PlankTimerModal.tsx': '14',
  'screens/community/PostCard.tsx': '11, 14',
  'screens/discover/DiscoverScreen.tsx': '7, 8',
  'screens/discover/PartnerCard.tsx': '7, 8',
  'screens/discover/PartnerProfileScreen.tsx': '8',
  'screens/discover/PlacesView.tsx': '9',
  'screens/login/EmailConfirmedScreen.tsx': '2',
  'screens/login/ForgotPasswordScreen.tsx': '5',
  'screens/login/LoginScreen.tsx': '3, 4',
  'screens/login/ProfileSetupScreen.tsx': '6',
  'screens/login/ResetPasswordScreen.tsx': '5',
  'screens/login/SignUpScreen.tsx': '1, 4',
  'screens/login/TermsScreen.tsx': '1',
  'screens/notifications/NotificationsScreen.tsx': '15',
  'screens/progress/ProgressScreen.tsx': '16',
  'screens/progress/ProgressSheets.tsx': '16',
  'screens/progress/SummaryCards.tsx': '16',
  'screens/progress/WorkoutsCard.tsx': '16',
  'src/app/(tabs)/dashboard.tsx': '7, 12, 15, 16',
};

// Findings that were looked at and are correct (none at the moment).
const ALLOWED: RegExp[] = [];

const files = DIRS.flatMap((dir) => listFiles(path.join(ROOT, dir))).sort();
let total = 0;
const rows: { file: string; handlers: number; flows: string }[] = [];
const all: Finding[] = [];
const unmapped: string[] = [];
for (const file of files) {
  const result = scan(file);
  total += result.handlers;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (result.handlers) {
    const flows = FLOW_MAP[rel];
    if (!flows) unmapped.push(rel);
    rows.push({ file: rel, handlers: result.handlers, flows: flows ?? '?' });
  }
  all.push(...result.findings.filter((f) => !ALLOWED.some((re) => re.test(`${f.file}:${f.line} ${f.detail}`))));
}
const staleMap = Object.keys(FLOW_MAP).filter((rel) => !rows.some((r) => r.file === rel));

if (process.argv.includes('--check')) {
  const problems = [
    ...unmapped.map((rel) => `no flow mapped for ${rel} (add it to FLOW_MAP in scripts/qa-inventory.ts and a row to docs/QA-FLOWS.md if needed)`),
    ...staleMap.map((rel) => `FLOW_MAP lists ${rel}, which has no handlers any more`),
    ...all.map((f) => `${f.kind}: ${f.file}:${f.line} ${f.detail}`),
  ];
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`ok: ${total} handlers in ${rows.length} files, all mapped to a flow, no findings`);
} else if (process.argv.includes('--md')) {
  console.log(`Handlers: ${total} in ${rows.length} files\n`);
  console.log('| File | Handlers | Flows (docs/QA-FLOWS.md) |\n|---|---|---|');
  rows.forEach((r) => console.log(`| ${r.file} | ${r.handlers} | ${r.flows} |`));
  console.log(`\nFindings: ${all.length}\n`);
  all.forEach((f) => console.log(`- ${f.kind}: ${f.file}:${f.line} ${f.detail}`));
} else {
  console.log(`handlers: ${total} in ${rows.length} files`);
  console.log(`findings: ${all.length}, unmapped files: ${unmapped.length}`);
  all.forEach((f) => console.log(`${f.kind}\t${f.file}:${f.line}\t${f.detail}`));
}
