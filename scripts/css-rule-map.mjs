/**
 * Parses minified CSS into a comparable map of rules.
 *
 * Needed because the stylesheet is minified by lightningcss, which ships as a
 * platform-native binary. The Windows and Linux builds apply different — but
 * equivalent — selector-grouping optimisations, so the same input yields
 * different bytes:
 *
 *   .bg-blue-400{background-color:X}.bg-blue-400,.bg-blue-50{--tw-bg-opacity:1}
 *   .bg-blue-400{--tw-bg-opacity:1;background-color:X}.bg-blue-50{...}
 *
 * Expanding grouped selectors and collecting each selector's declarations into a
 * set makes those two forms compare equal, while a genuine change — a new class,
 * a changed colour, a dropped rule — still shows up.
 */

/** At-rules whose body contains nested rules rather than declarations. */
const NESTING_AT_RULES = /^@(media|supports|layer|container|(-\w+-)?keyframes|scope|starting-style)\b/;

export function cssRuleMap(css) {
  const rules = new Map();
  let i = 0;

  function addRule(context, prelude, body) {
    const declarations = body
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean);

    for (const rawSelector of prelude.split(",")) {
      const selector = rawSelector.trim();
      if (!selector) continue;
      const key = context ? `${context} { ${selector}` : selector;
      if (!rules.has(key)) rules.set(key, new Set());
      const target = rules.get(key);
      for (const declaration of declarations) target.add(declaration);
    }
  }

  function parseBlock(context) {
    let prelude = "";

    while (i < css.length) {
      const ch = css[i];

      if (ch === "}") {
        i += 1;
        return;
      }

      if (ch === "{") {
        i += 1;
        const head = prelude.trim();
        prelude = "";

        if (NESTING_AT_RULES.test(head)) {
          parseBlock(context ? `${context} { ${head}` : head);
        } else {
          let depth = 1;
          let body = "";
          while (i < css.length && depth > 0) {
            const c = css[i];
            if (c === "{") depth += 1;
            else if (c === "}") {
              depth -= 1;
              if (depth === 0) {
                i += 1;
                break;
              }
            }
            body += c;
            i += 1;
          }
          addRule(context, head, body);
        }
        continue;
      }

      prelude += ch;
      i += 1;
    }
  }

  parseBlock("");
  return rules;
}

/** Human-readable differences between two rule maps, most useful first. */
export function diffRuleMaps(expected, actual, limit = 12) {
  const differences = [];

  for (const key of expected.keys()) {
    if (!actual.has(key)) differences.push(`missing rule: ${key}`);
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) differences.push(`unexpected rule: ${key}`);
  }

  for (const [key, expectedDecls] of expected) {
    const actualDecls = actual.get(key);
    if (!actualDecls) continue;

    const missing = [...expectedDecls].filter((d) => !actualDecls.has(d));
    const extra = [...actualDecls].filter((d) => !expectedDecls.has(d));

    if (missing.length || extra.length) {
      differences.push(
        `${key}: ` +
          (missing.length ? `missing [${missing.join("; ")}] ` : "") +
          (extra.length ? `extra [${extra.join("; ")}]` : "")
      );
    }
  }

  return { count: differences.length, sample: differences.slice(0, limit) };
}
