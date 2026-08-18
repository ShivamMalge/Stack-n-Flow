/**
 * Fails when the committed widget bundle does not match a fresh build.
 *
 * The committed bundle under pratyaksha/static/ is what `pip install` ships, so
 * a stale one is a release bug no test catches: the source is correct, the suite
 * is green, and the notebook still renders yesterday's code.
 *
 * The two artefacts are compared differently, for a reason:
 *
 *   pratyaksha-bridge.mjs — byte-exact. esbuild reproduces identical output
 *     across platforms, so any difference is a real change.
 *
 *   pratyaksha.css — compared as a rule map. Minification is done by
 *     lightningcss, which ships as a platform-native binary, and the Windows and
 *     Linux builds group selectors differently while emitting the same rules. A
 *     byte comparison there fails on every cross-platform push regardless of
 *     staleness; see scripts/css-rule-map.mjs.
 *
 * Usage: node scripts/check-bundle-freshness.mjs <committed-dir>
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cssRuleMap, diffRuleMaps } from "./css-rule-map.mjs";

const committedDir = process.argv[2];

if (!committedDir) {
  console.error("usage: check-bundle-freshness.mjs <committed-dir>");
  process.exit(2);
}

const read = (path) => readFileSync(path, "utf8");
const committed = (name) => read(join(committedDir, name));
const rebuilt = (name) => read(join("pratyaksha", "static", name));

let stale = false;

// ── The bundle: byte-exact ──────────────────────────────────────────────────
{
  const name = "pratyaksha-bridge.mjs";
  const before = committed(name);
  const after = rebuilt(name);

  if (before === after) {
    console.log(`${name}: matches a fresh build (${after.length} bytes)`);
  } else {
    stale = true;

    // These files are minified onto very long lines, so a line diff shows
    // nothing useful — report the first differing byte with context instead.
    const limit = Math.min(before.length, after.length);
    let at = limit;
    for (let i = 0; i < limit; i += 1) {
      if (before[i] !== after[i]) {
        at = i;
        break;
      }
    }

    const context = 120;
    const from = Math.max(0, at - context);
    const slice = (text) => JSON.stringify(text.slice(from, at + context));

    console.error(`::error::${name} is stale (committed ${before.length} bytes, fresh ${after.length}).`);
    console.error(`  first difference at byte ${at}`);
    console.error(`  committed: ${slice(before)}`);
    console.error(`  rebuilt  : ${slice(after)}`);
  }
}

// ── The stylesheet: same rules, regardless of how they were grouped ─────────
{
  const name = "pratyaksha.css";
  const before = cssRuleMap(committed(name));
  const after = cssRuleMap(rebuilt(name));
  const { count, sample } = diffRuleMaps(after, before);

  if (count === 0) {
    let declarations = 0;
    for (const set of after.values()) declarations += set.size;
    console.log(`${name}: ${after.size} rules and ${declarations} declarations match a fresh build`);
  } else {
    stale = true;
    console.error(`::error::${name} is stale — ${count} rule difference(s) against a fresh build:`);
    for (const line of sample) console.error(`  ${line}`);
    if (count > sample.length) console.error(`  ...and ${count - sample.length} more`);
  }
}

if (stale) {
  console.error("\nRun 'npm run build-lib' and commit pratyaksha/static/.");
  process.exit(1);
}

console.log("Committed bundle is current.");
