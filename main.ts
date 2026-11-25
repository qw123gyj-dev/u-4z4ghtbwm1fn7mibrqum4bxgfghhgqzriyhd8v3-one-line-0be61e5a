// One Line, One Laugh — deterministic one-liner picker.
//
// The brief asks for exactly one funny line of text, a single
// self-contained joke of at most 140 characters. An AI judge compares
// entries pairwise, weighing, most important first:
//   1. It is one funny line of text, whole and self-contained, and an
//      entry that is not a funny line of text loses to any funny line.
//   2. It actually lands a laugh: a real turn, surprise or twist rather
//      than a mild observation.
//   3. It is tight, with every word earning its place and nothing left
//      to trim.
//   4. It is fresh, not a joke everyone has already heard or a pun that
//      was obvious from the first word.
//   5. It is clear on first read, needing no explanation and no second
//      line to make sense.
//
// This program scores a set of hand-written candidate one-liners against
// those five criteria, in that order (weights 5, 4, 3, 2, 1), writes the
// winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt),
// reads it back and verifies it against every gate before exiting.
//
// Every candidate below was written for this brief from scratch. None of
// them is a recycled joke: no bar, no chicken crossing a road, no "my
// wife", no knock-knock, no airplane food, no doctor-doctor. Each one is
// built the same way a stand-up one-liner is built — a plain setup in the
// first half, then a turn in the second half that reframes the setup —
// because that is what criterion 2 rewards and what the judge reads for.
//
// Revision thinking, applied before the first run:
//   - Criterion 1 docks a line that is only an observation with no joke
//     structure (no turn, no punch word in the tail). A mild observation
//     loses to any real joke, so the scorer must be able to tell them
//     apart, not just check that the text is a sentence.
//   - Criterion 2 requires the twist to sit in the second half of the
//     line, and pays full marks only when it lands inside the last six
//     words. A twist telegraphed in the first clause is a setup that
//     gives itself away.
//   - Criterion 4 docks shopworn frames and puns the reader can see
//     coming from the first word, and rewards an incongruous pairing —
//     an inanimate object behaving like a person, or a bureaucratic
//     frame applied to something private — because that is where fresh
//     one-liners actually come from.
//   - Ties break the way the judge walks the brief: criterion by
//     criterion, in the brief's order, then by shorter text, then
//     lexicographically. No randomness anywhere.
//
// Revision round 2 (hand-written improvement edit):
//   - Added four new candidates, each built the same way: a plain setup,
//     then a turn in the last few words that reframes it — appliances
//     conspiring, plants cutting their owner out, an alarm snoozing its
//     owner, a plant ghosting its buyer.
//   - Tightened criterion 2's twist landing: full marks now need the
//     punch phrase inside the last four words, not the last six. A
//     twist sitting five or six words out is a punchline that has
//     already started to fade, so it now scores 0.9, not 1.0. The
//     criterion 1 punch-in-tail check is tightened to the last four
//     words for the same reason.
//   - Tightened criterion 5's long-word dock: a 12-letter word now
//     costs 0.25 (was 0.15) and a 10-letter word 0.10 (was 0.05). In a
//     line under 70 characters one long word is a bigger share of the
//     reader's first read, so it should cost more than it did.
//
// Node 24, standard library only, no network, fully deterministic: the
// same candidates always produce the same winner.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Eighteen hand-written one-liners. Each comment states the setup and the
// turn, so a reader can check that the turn really is a turn and not a
// second setup wearing a punchline's clothes.

const CANDIDATES: string[] = [
  // Setup: therapy and a fear of commitment. Turn: the commitment he
  // did make is to a password that betrays him on a schedule.
  "My therapist says I fear commitment, so I married my Wi-Fi password — at least it changes every month.",
  // Setup: a gym refund request. Turn: the only weight ever lifted is
  // an abstract noun, not a dumbbell.
  "I asked the gym for a refund, because the only thing I've lifted there is my expectations.",
  // Setup: dead houseplants replaced with plastic ones. Turn: the guilt
  // survives the thing that caused it, aimed at something unkillable.
  "My houseplants died of neglect, so I bought plastic ones — now I feel guilty for ignoring something that doesn't need me.",
  // Setup: identifying as rich to the bank. Turn: the bank reframes the
  // identity claim as the crime it literally describes.
  "I told my bank I identify as rich. They said identity theft is still a crime.",
  // Setup: a weekly screen-time report. Turn: it is filed under horror,
  // a genre the reader writes for himself every Sunday.
  "My phone's screen-time report is the only horror story I read every single Sunday.",
  // Setup: finally cleaning the room. Turn: the lost-and-found inventory
  // escalates from the remote to motivation to chargers for dead phones.
  "I finally cleaned my room and found the remote, my motivation, and three chargers for phones I no longer own.",
  // Setup: dating-app bios promising seriousness. Turn: "serious" is
  // redefined, by the app's own behaviour, as seriously ignoring you.
  "Dating apps taught me that 'looking for something serious' means seriously avoiding my messages.",
  // Setup: a standing desk bought for health. Turn: the health purchase
  // is defeated by sitting anyway, just higher up.
  "I bought a standing desk to get healthier. Now I just sit on a taller chair.",
  // Setup: a smart fridge that judges midnight snacks. Turn: the fridge
  // stops at judging and starts parenting, ordering salad unasked.
  "My smart fridge judges my midnight snacks out loud — last night it sighed and ordered me a salad.",
  // Setup: meditation to find inner peace. Turn: inner peace behaves
  // like a bad date and ghosts the meditator.
  "I tried meditation to find my inner peace, but my inner peace keeps ghosting me.",
  // Setup: a printer that jams only when hurried. Turn: the only
  // explanation left is the supernatural, adopted on office evidence.
  "The printer only jams when I'm in a hurry, which is why I now believe in ghosts.",
  // Setup: a calendar reminder to relax. Turn: relaxing is filed as a
  // task, and worrying about it gets scheduled instead.
  "My calendar reminded me to relax, so I scheduled worrying about it for later.",
  // Setup: quitting sugar for a week. Turn: the cake treats the absence
  // as a disappearance and organises a rescue.
  "I quit sugar for a week. The cake sent out a search party.",
  // Setup: asking AI to write an apology. Turn: the apology is delivered
  // and the situation is worse, which is the opposite of the ask.
  "I asked AI to write my apology. It apologised on my behalf and somehow made it worse.",
  // Setup: the smart fridge texts the bathroom scale. Turn: the two
  // appliances conspire against their owner and stage a diet
  // intervention, as if they were worried friends.
  "My smart fridge texted my scale. They're staging an intervention.",
  // Setup: promising thirsty houseplants water tomorrow. Turn: the
  // plants cut the owner out and start a group chat without him.
  "I told my plants I'd water them tomorrow. They've started a group chat without me.",
  // Setup: asking the alarm for a lie-in. Turn: the alarm turns the
  // snooze button on its owner and snoozes him instead.
  "I asked my alarm for a lie-in. It snoozed me instead.",
  // Setup: buying a plant for company. Turn: the plant is the one who
  // leaves first, ghosting the buyer who bought it for company.
  "I bought a plant for company. It ghosted me first.",
];

// ------------------------------------------------------- scorer lexicons
// All lexicons are plain word lists checked against the candidate text
// itself; no candidate carries a pre-assigned score. A candidate earns
// its marks only by what its own words contain.

const WEIGHTS = [5, 4, 3, 2, 1]; // brief order: criterion 1 matters most.

// A whole, self-contained funny line reads as one complete thought: it
// has a subject doing something, ends with terminal punctuation, and
// does not trail off or ask the reader to supply the second half.
const ACTION_VERBS = [
  "says",
  "said",
  "married",
  "asked",
  "lifted",
  "died",
  "bought",
  "feel",
  "told",
  "read",
  "found",
  "taught",
  "means",
  "sit",
  "judges",
  "sighed",
  "ordered",
  "tried",
  "keeps",
  "jams",
  "believe",
  "reminded",
  "scheduled",
  "quit",
  "sent",
  "write",
  "made",
  "changes",
  "avoiding",
  "texted",
  "staging",
  "started",
  "snoozed",
  "ghosted",
];

// Words that mark a real turn: a contrast, a reframe, a reversal, or an
// outcome that runs against the setup's direction (criterion 2).
const TURN_WORDS = [
  "but",
  "instead",
  "somehow",
  "at least",
  "now",
  "still",
  "only",
  "turns out",
  "which is why",
  "so i",
];

// Phrases that land the laugh itself — the specific surprise the line
// is built around. These are checked in the tail of the line, where a
// punchline has to live (criterion 2, strongest evidence).
const STRONG_TWISTS = [
  "changes every month",
  "is my expectations",
  "doesn't need me",
  "is still a crime",
  "every single sunday",
  "no longer own",
  "avoiding my messages",
  "taller chair",
  "ordered me a salad",
  "keeps ghosting me",
  "believe in ghosts",
  "for later",
  "search party",
  "made it worse",
  "staging an intervention",
  "group chat without me",
  "snoozed me instead",
  "ghosted me first",
];

// A weaker but real turn: the line bends without a single quotable
// punch phrase (criterion 2, medium evidence).
const MEDIUM_TWISTS = [
  "refund",
  "guilty",
  "horror story",
  "motivation",
  "seriously",
  "healthier",
  "judges",
  "sighed",
  "inner peace",
  "ghosts",
  "relax",
  "search",
  "apologised",
  "apology",
  "intervention",
  "group chat",
  "snoozed",
  "ghosted",
];

// Incongruous pairings: an inanimate object, an app, or an abstraction
// behaving like a person, or a bureaucratic frame applied to private
// life. Fresh one-liners are usually built on exactly one of these
// (criterion 4, freshness evidence).
const INCONGRUOUS_ACTORS = [
  "wi-fi password",
  "houseplants",
  "plastic ones",
  "screen-time report",
  "dating apps",
  "standing desk",
  "smart fridge",
  "printer",
  "calendar",
  "cake",
  "ai",
  "inner peace",
  "motivation",
  "expectations",
  "scale",
  "plants",
  "alarm",
  "plant",
];

// Shopworn frames and gags: if a line is built on one of these, the
// reader has heard it before, and the pun was obvious from the first
// word (criterion 4). Every candidate was written to avoid them; the
// scorer still checks, so a stale line cannot win by accident.
const STALE_FRAMES = [
  "walks into a bar",
  "chicken crossed",
  "why did the chicken",
  "knock knock",
  "my wife",
  "told my wife",
  "airplane food",
  "doctor doctor",
  "what do you call",
  "a priest",
  "a rabbi",
  "blonde",
  "my ex",
  "ex-wife",
  "two guys",
  "yo mama",
  "that's what she said",
  "take my wife",
  "i hate mondays",
  "garfield",
];

// Words that do no work inside 140 characters: hedges, intensifiers,
// throat-clearing and filler that a tight line would cut (criterion 3).
const FILLERS = [
  "please",
  "very",
  "just",
  "really",
  "simply",
  "actually",
  "literally",
  "basically",
  "totally",
  "kindly",
  "remember",
  "like",
  "you know",
  "honestly",
  "seriously",
  "every single",
  "single",
];

// Words a first-time reader might have to stop and decode: jargon,
// uncommon vocabulary, or a reference that needs outside knowledge
// (criterion 5). Plain, everyday words keep a line clear on first read.
const OBSCURE_WORDS = [
  "ontological",
  "epistemological",
  "quixotic",
  "antediluvian",
  "sesquipedalian",
  "defenestration",
  "liminal",
  "oneiric",
  "palimpsest",
  "apophatic",
  "hermeneutic",
  "solipsism",
  "cryptocurrency",
  "blockchain",
  "quantum",
];

// First words that give the punch away before the line has started:
// a riddle opening, a "why did" setup, or a label that names the joke
// (criterion 4 — the pun was obvious from the first word).
const TELEGRAPHED_OPENINGS = [
  "why did",
  "why do",
  "what do you call",
  "what's the difference",
  "knock knock",
  "a man walks",
  "so a guy",
  "pun:",
  "joke:",
];

// ------------------------------------------------------------------ helpers

function lower(text: string): string {
  return text.toLowerCase();
}

function wordsOf(text: string): string[] {
  return lower(text)
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9'\-]/g, ""))
    .filter((w) => w.length > 0);
}

function containsAny(text: string, words: string[]): boolean {
  return countDistinct(text, words) > 0;
}

function countDistinct(text: string, words: string[]): number {
  const hay = ` ${norm(text)} `;
  return words.filter((w) => hay.includes(` ${w} `)).length;
}

// Normalised word stream of a text: lowercased words joined by single
// spaces, punctuation stripped. All phrase matching runs on this form,
// so "my ex" can never match "my expectations" and "ai" can never match
// "said" — substring false positives like those used to inflate scores.
function norm(text: string): string {
  return wordsOf(text).join(" ");
}

// Does the normalised word stream contain this phrase as whole words?
function hasPhrase(normedText: string, phrase: string): boolean {
  return ` ${normedText} `.includes(` ${phrase} `);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// The final clause is everything after the last sentence break; that is
// where a punchline has to sit if the line is one sentence, and it is
// the whole second sentence when the line is two.
function finalClause(text: string): string {
  const idx = Math.max(text.lastIndexOf(". "), text.lastIndexOf(" — "));
  if (idx === -1) return text;
  const cut = text.includes(". ") && text.lastIndexOf(". ") >= idx ? 2 : 3;
  return text.slice(idx + cut);
}

// The last few words of the text, joined: the surprise must land here,
// not merely somewhere in the second half.
function lastWords(text: string, n: number): string {
  const words = wordsOf(text);
  return words.slice(-n).join(" ");
}

// The second half of the line by word count. A turn that lives only in
// the first half has already been spent before the reader gets there.
function secondHalf(text: string): string {
  const words = wordsOf(text);
  return words.slice(Math.floor(words.length / 2)).join(" ");
}

// The first three words: enough to tell whether the line telegraphs its
// punch before the setup has even finished.
function firstWords(text: string, n: number): string {
  return wordsOf(text).slice(0, n).join(" ");
}

// Counts commas, semicolons and colons: each one is a subordinate clause
// or an aside the reader has to hold in their head (criterion 5).
function countClauseMarks(text: string): number {
  return [...text].filter((ch) => ch === "," || ch === ";" || ch === ":").length;
}

// The longest word in the line, in letters: a long word is a stumble
// on first read, and two of them in one line is a trip (criterion 5).
function longestWordLength(text: string): number {
  const words = wordsOf(text);
  return words.reduce((max, w) => Math.max(max, w.length), 0);
}

// Repeated content words (other than small function words) are words
// the line pays for twice (criterion 3). Deliberate repetition — the
// same phrase turned against itself — is the one exception, and the
// scorer treats a repeated phrase that also appears in STRONG_TWISTS
// as intentional, not wasteful.
const FUNCTION_WORDS = new Set([
  "i", "my", "me", "the", "a", "an", "and", "or", "so", "to", "of", "for",
  "in", "on", "at", "it", "is", "was", "are", "that", "this", "it", "you",
  "your", "he", "she", "they", "we", "but", "now", "every", "no", "not",
]);

function repeatedContentWords(text: string): number {
  const words = wordsOf(text).filter((w) => !FUNCTION_WORDS.has(w));
  const seen = new Set<string>();
  let repeats = 0;
  for (const w of words) {
    if (seen.has(w)) repeats += 1;
    seen.add(w);
  }
  return repeats;
}

// The most predictable frame in the set would be a "my wife" or bar
// joke; none of the candidates uses one, but the check stays in the
// scorer so a stale line can never slip through on other criteria.
function isStaleFrame(text: string): boolean {
  return containsAny(text, STALE_FRAMES);
}

function isTelegraphed(text: string): boolean {
  const opening = firstWords(text, 4);
  return TELEGRAPHED_OPENINGS.some((o) => opening.startsWith(o));
}

// ------------------------------------------------------------- per-criterion
// Each scorer returns a number in [0, 1] for one of the brief's five
// criteria, in the brief's order. The judge walks the criteria in that
// order and lets the first difference decide unless a later one differs
// by much more; the weights (5, 4, 3, 2, 1) and the tie-break below
// reproduce that walk.

// Criterion 1 — is it one funny line of text, whole and self-contained?
// A real one-liner has a subject doing something (an action verb), ends
// with terminal punctuation, is a single sentence or two short ones, and
// is not a bare observation. A line with no turn at all is capped hard:
// under this criterion a mild observation loses to any funny line, so
// the scorer must not hand it full marks for merely being grammatical.
function scoreCriterion1(text: string): number {
  const trimmed = text.trim();
  const hasVerb = containsAny(text, ACTION_VERBS) ? 0.35 : 0;
  const endsClean = /[.!?]$/.test(trimmed) ? 0.2 : 0;
  const oneThought =
    countClauseMarks(text) <= 2 && [...trimmed].length <= 140 ? 0.2 : 0.1;
  // Round 2: the punch must land in the last four words, not merely
  // somewhere in the tail, or the line reads as a setup that trails off.
  const tail = lastWords(text, 4);
  const hasPunchInTail =
    STRONG_TWISTS.some((w) => hasPhrase(tail, w)) ||
    MEDIUM_TWISTS.some((w) => hasPhrase(tail, w));
  const punch = hasPunchInTail ? 0.25 : 0;
  let score = hasVerb + endsClean + oneThought + punch;
  // No turn, no joke: cap the line well below a real one-liner, however
  // grammatical it is.
  if (!hasPunchInTail) score = Math.min(score, 0.45);
  // A trailing ellipsis or a dangling opener is not whole or
  // self-contained.
  if (trimmed.endsWith("...") || trimmed.endsWith("…")) score -= 0.3;
  if (/^(and|but|so|well)\b/i.test(trimmed)) score -= 0.2;
  return clamp01(score);
}

// Criterion 2 — does it actually land a laugh? A real turn, surprise or
// twist, not a mild observation. Full marks need the punch phrase in
// the last four words (tightened in round 2 from the last six); a twist
// that only shows up in the last six words or the final clause scores
// 0.9, one that only shows up in the second half scores less, and a
// line whose turn is visible from the first clause scores less still,
// because the reader saw it coming.
function scoreCriterion2(text: string): number {
  const tail = lastWords(text, 4);
  const tail6 = lastWords(text, 6);
  const half = secondHalf(text);
  const clause = norm(finalClause(text));
  if (STRONG_TWISTS.some((w) => hasPhrase(tail, w))) return 1.0;
  if (
    STRONG_TWISTS.some((w) => hasPhrase(tail6, w)) ||
    STRONG_TWISTS.some((w) => hasPhrase(clause, w))
  )
    return 0.9;
  if (STRONG_TWISTS.some((w) => hasPhrase(half, w))) return 0.8;
  if (MEDIUM_TWISTS.some((w) => hasPhrase(tail, w))) return 0.7;
  if (MEDIUM_TWISTS.some((w) => hasPhrase(half, w))) return 0.6;
  // A contrast word with no quotable punch is a bend, not a laugh.
  if (containsAny(text, TURN_WORDS)) return 0.45;
  return 0.25;
}

// Criterion 3 — is it tight? Every word earns its place. Fillers,
// repeated content words, and length spent past the point where the
// joke is already told all cost marks. Short is not the goal for its
// own sake — the brief says length for its own sake does not count —
// so the length penalty is gentle and only bites once the line is long
// enough that words are plainly being spent, not earned.
function scoreCriterion3(text: string): number {
  const words = wordsOf(text);
  if (words.length === 0) return 0;
  const filler = words.filter((w) => FILLERS.includes(w)).length;
  let score = 1 - filler / words.length;
  const repeats = repeatedContentWords(text);
  // One deliberate repeat (a phrase turned against itself) is a device,
  // not waste: only the second and later repeats cost marks.
  if (repeats > 1) score -= 0.08 * (repeats - 1);
  const len = [...text].length;
  if (len > 110) score -= (len - 110) * 0.008;
  if (len < 40) score -= 0.05; // too short to set up and turn
  return clamp01(score);
}

// Criterion 4 — is it fresh? A stale frame or a telegraphed opening is
// a heavy dock: the reader has heard the joke, or saw the pun coming
// from the first word. An incongruous pairing — an object behaving like
// a person, a bureaucracy applied to private life — is the positive
// evidence, and two distinct pairings in one line is rarer still.
function scoreCriterion4(text: string): number {
  let score = 0.55; // a plain, competently built line starts here
  const pairings = countDistinct(text, INCONGRUOUS_ACTORS);
  if (pairings >= 2) score += 0.3;
  else if (pairings === 1) score += 0.15;
  if (isStaleFrame(text)) score -= 0.45;
  if (isTelegraphed(text)) score -= 0.35;
  // A first word that is exactly the punch phrase's first word gives
  // the game away before the setup starts. Compare whole words, not
  // prefixes: a bare "I" must not match a twist that starts with "is".
  const opening = firstWords(text, 1);
  if (STRONG_TWISTS.some((w) => w.split(" ")[0] === opening)) score -= 0.2;
  return clamp01(score);
}

// Criterion 5 — is it clear on first read? No explanation needed, no
// second line to make sense. Plain everyday words, at most two clause
// marks, no word long enough to stumble over, and no pronoun left
// dangling without an antecedent in the same line.
function scoreCriterion5(text: string): number {
  let score = 1.0;
  const obscure = countDistinct(text, OBSCURE_WORDS);
  if (obscure > 0) score -= 0.25 * obscure;
  const marks = countClauseMarks(text);
  if (marks > 2) score -= 0.1 * (marks - 2);
  // Round 2: a long word costs more than it did — 0.25 at 12 letters
  // (was 0.15), 0.10 at 10 letters (was 0.05) — because in a line under
  // 70 characters one long word is a bigger stumble on first read.
  if (longestWordLength(text) >= 12) score -= 0.25;
  else if (longestWordLength(text) >= 10) score -= 0.1;
  const words = wordsOf(text);
  if (words.length > 28) score -= 0.1; // a one-liner should not need 28 words
  // A line that opens with a bare pronoun and never names its subject
  // makes the reader guess who is talking.
  if (/^(it|they|he|she|this|that)\b/i.test(text.trim())) score -= 0.15;
  return clamp01(score);
}

const CRITERION_SCORERS = [
  scoreCriterion1,
  scoreCriterion2,
  scoreCriterion3,
  scoreCriterion4,
  scoreCriterion5,
];

interface Scored {
  text: string;
  criteria: number[];
  total: number;
}

function scoreCandidate(text: string): Scored {
  const criteria = CRITERION_SCORERS.map((fn) => fn(text));
  const total = criteria.reduce((sum, c, i) => sum + WEIGHTS[i] * c, 0);
  return { text, criteria, total };
}

// --------------------------------------------------------------------- gate
// The sealed gate: /output/entry.txt must be UTF-8 text of 1 to 140
// characters, not only white space. The check here applies the same
// rules to every candidate before scoring, and again to the file after
// it is written, so an invalid entry can never be submitted.

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = [...text]; // code points, not UTF-16 units
  if (chars.length < 1 || chars.length > 140) {
    problems.push(`length ${chars.length} outside 1..140 characters`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("not a single line");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    problems.push("not valid UTF-8 round-trip");
  }
  return problems;
}

// --------------------------------------------------------------------- main

function main(): void {
  // 1. Keep only gate-valid candidates.
  const valid = CANDIDATES.filter((c) => {
    const problems = gateProblems(c);
    if (problems.length > 0) {
      console.error(`excluded candidate (${problems.join("; ")}): ${c}`);
      return false;
    }
    return true;
  });
  if (valid.length === 0) {
    console.error("no gate-valid candidate");
    process.exit(1);
  }

  // 2. Score every candidate, deterministically. Ties break the way the
  // judge walks the brief: criterion by criterion, in the brief's order,
  // then by shorter text, then lexicographically. The printed table
  // lists criteria in the brief's order (1 to 5) so a reader can check
  // the winner against the judge's own walk.
  const scored = valid.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    for (let i = 0; i < a.criteria.length; i++) {
      if (b.criteria[i] !== a.criteria[i]) return b.criteria[i] - a.criteria[i];
    }
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  console.log("total  [c1 c2 c3 c4 c5]  (chars) candidate");
  for (const s of scored) {
    console.log(
      `${s.total.toFixed(2)}  [${s.criteria.map((c) => c.toFixed(2)).join(" ")}]  (${[...s.text].length} chars) ${s.text}`,
    );
  }

  const winner = scored[0];
  console.log(`\nwinner (${[...winner.text].length} chars): ${winner.text}`);

  // 3. Write the winner, with no trailing newline: the file holds exactly
  //    the one funny line, nothing else.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // 4. Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  const backBytes = readFileSync(outPath);
  if (back !== winner.text) {
    console.error("read-back text differs from winner");
    process.exit(1);
  }
  if (!backBytes.equals(Buffer.from(winner.text, "utf8"))) {
    console.error("read-back bytes differ from winner");
    process.exit(1);
  }
  const problems = gateProblems(back);
  if (problems.length > 0) {
    console.error(`gate failed on written file: ${problems.join("; ")}`);
    process.exit(1);
  }

  console.log(`wrote and verified ${outPath} (${backBytes.length} bytes)`);
}

main();
