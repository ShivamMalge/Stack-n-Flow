import { describe, expect, it } from "vitest";
// Plain ESM helper, shared with the CI freshness gate.
import { cssRuleMap, diffRuleMaps } from "@/scripts/css-rule-map.mjs";

/**
 * This normaliser decides whether CI accepts the committed widget stylesheet, so
 * it needs to be right in both directions: blind to how lightningcss chose to
 * group selectors, and sensitive to anything that actually changed.
 */
describe("cssRuleMap", () => {
  it("treats grouped and ungrouped selectors as equivalent", () => {
    // The exact shapes the Windows and Linux minifiers produced for the same input.
    const grouped = ".a{color:red}.a,.b{--o:1}.b{color:blue}";
    const ungrouped = ".a{--o:1;color:red}.b{--o:1;color:blue}";

    expect(diffRuleMaps(cssRuleMap(grouped), cssRuleMap(ungrouped)).count).toBe(0);
  });

  it("ignores declaration order within a rule", () => {
    expect(
      diffRuleMaps(cssRuleMap(".a{color:red;margin:0}"), cssRuleMap(".a{margin:0;color:red}")).count
    ).toBe(0);
  });

  it("ignores rule order within a stylesheet", () => {
    expect(diffRuleMaps(cssRuleMap(".a{x:1}.b{y:2}"), cssRuleMap(".b{y:2}.a{x:1}")).count).toBe(0);
  });

  it("reports a changed declaration value", () => {
    const { count, sample } = diffRuleMaps(cssRuleMap(".a{color:red}"), cssRuleMap(".a{color:blue}"));

    expect(count).toBeGreaterThan(0);
    expect(sample[0]).toContain("color:red");
  });

  it("reports a missing rule", () => {
    const { count, sample } = diffRuleMaps(cssRuleMap(".a{x:1}.b{y:2}"), cssRuleMap(".a{x:1}"));

    expect(count).toBe(1);
    expect(sample[0]).toBe("missing rule: .b");
  });

  it("reports an unexpected rule", () => {
    const { count, sample } = diffRuleMaps(cssRuleMap(".a{x:1}"), cssRuleMap(".a{x:1}.c{z:3}"));

    expect(count).toBe(1);
    expect(sample[0]).toBe("unexpected rule: .c");
  });

  it("keeps at-rule context so identical selectors in different queries stay distinct", () => {
    const map = cssRuleMap(".a{x:1}@media(min-width:768px){.a{x:2}}");

    expect(map.size).toBe(2);
    expect([...map.keys()].some((key) => key.includes("@media"))).toBe(true);
  });

  it("does not confuse a media-query rule with its unqualified twin", () => {
    const bare = cssRuleMap(".a{x:2}");
    const queried = cssRuleMap("@media(min-width:768px){.a{x:2}}");

    expect(diffRuleMaps(bare, queried).count).toBeGreaterThan(0);
  });

  it("parses nested at-rules and keyframes without losing rules", () => {
    const map = cssRuleMap("@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}");

    expect(map.size).toBe(2);
  });
});
