/**
 * Fails when the committed widget bundle does not match a fresh build.
 *
 * The committed bundle under pratyaksha/static/ is what `pip install` ships, so
 * a stale one is a release bug that no test catches: the source is correct, the
 * suite is green, and the notebook still renders yesterday's code.
 *
 * Comparison is byte-exact. A weaker content check was tried first and proved
 * useless — it passed on a bundle that was genuinely stale, because the missing
 * change was an added export rather than a changed style token.
 *
 * Usage: node scripts/check-bundle-freshness.mjs <committed-dir>
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const committedDir = process.argv[2];

if (!committedDir) {
  console.error("usage: check-bundle-freshness.mjs <committed-dir>");
  process.exit(2);
}

const FILES = ["pratyaksha.css", "pratyaksha-bridge.mjs"];
const read = (path) => readFileSync(path, "utf8");

let stale = false;

for (const file of FILES) {
  const committed = read(join(committedDir, file));
  const rebuilt = read(join("pratyaksha", "static", file));

  if (committed === rebuilt) {
    console.log(`${file}: matches a fresh build (${rebuilt.length} bytes)`);
    continue;
  }

  stale = true;

  // Report the first differing offset with context. These files are minified
  // onto very long lines, so a line-based diff shows nothing useful — the
  // difference is typically thousands of characters into a single line.
  const limit = Math.min(committed.length, rebuilt.length);
  let at = limit;
  for (let i = 0; i < limit; i += 1) {
    if (committed[i] !== rebuilt[i]) {
      at = i;
      break;
    }
  }

  const context = 120;
  const from = Math.max(0, at - context);
  const slice = (text) => JSON.stringify(text.slice(from, at + context));

  console.error(`::error::${file} is stale (committed ${committed.length} bytes, fresh build ${rebuilt.length}).`);
  console.error(`  first difference at byte ${at}`);
  console.error(`  committed: ${slice(committed)}`);
  console.error(`  rebuilt  : ${slice(rebuilt)}`);
}

if (stale) {
  console.error("\nRun 'npm run build-lib' and commit pratyaksha/static/.");
  process.exit(1);
}

console.log("Committed bundle is current.");
