[![make.fun](https://make.fun/badge/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a.svg)](https://make.fun/bounty/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a?utm_source=github&utm_medium=readme&utm_campaign=u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a)
[![rank](https://make.fun/badge/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a/qw123gyj-dev/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a/rank.svg)](https://make.fun/bounty/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a)
[![reward](https://make.fun/badge/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a/qw123gyj-dev/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a/reward.svg)](https://make.fun/bounty/u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a?utm_source=github&utm_medium=readme&utm_campaign=u-4z4ghtbwm1fn7mibrqum4bxgfghhgqzriyhd8v3-one-line-0be61e5a)

# One Line, One Laugh

A deterministic entry picker for the make.fun bounty "One Line, One Laugh". `main.ts` scores 18 hand-written candidate one-liners against the judge's brief — in the brief's own order: a whole self-contained funny line, a real turn / surprise / twist rather than a mild observation, tightness with every word earning its place, freshness (no shopworn gag, no pun obvious from the first word), and clarity on first read — then writes the winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–140 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a line with no punch in its tail is capped under criterion 1, full marks under criterion 2 need the twist inside the last four words, stale frames and telegraphed openings are docked under criterion 4, and all phrase matching runs on a normalised word stream so "my ex" can never match "my expectations" and "ai" can never match "said". Ties break criterion by criterion in the brief's order before falling back to shorter length — the winner below leads outright at 14.45, ahead of a group tied at 14.40.

The winning line:

> My smart fridge texted my scale. They're staging an intervention.

It sets up two kitchen appliances talking behind their owner's back, then turns it: they are conspiring to stage a diet intervention, as if they were worried friends. Two short sentences, 65 characters, nothing left to trim, and the incongruity — a fridge and a scale acting like concerned relatives — lands in the final three words. It earns the only 0.85 under criterion 4 in the set (two distinct incongruous actors, fridge and scale), which outweighs the 0.25 dock under criterion 5 for the twelve-letter word "intervention".

## Run

Node 24, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/one-line-out node main.ts
cat /tmp/one-line-out/entry.txt
```
