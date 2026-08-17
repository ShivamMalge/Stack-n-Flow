import React from "react";
import { render, screen } from "@testing-library/react";
import CodePanel from "@/components/ui/code-panel";

describe("CodePanel", () => {
  it("renders each line of code", () => {
    const { container } = render(
      React.createElement(CodePanel, {
        code: ["def search(arr, target):", "    return -1"],
        activeLine: null,
      })
    );

    expect(container.textContent).toContain("def search(arr, target):");
    expect(container.textContent).toContain("return -1");
  });

  it("highlights keywords, values and numbers without dropping surrounding text", () => {
    const { container } = render(
      React.createElement(CodePanel, {
        code: ["if found == true: return 42 // done"],
        activeLine: null,
      })
    );

    // The full line survives tokenisation character for character.
    expect(container.textContent).toContain("if found == true: return 42 // done");

    expect(screen.getByText("if")).toHaveClass("text-purple-400");
    expect(screen.getByText("true")).toHaveClass("text-orange-400");
    expect(screen.getByText("42")).toHaveClass("text-yellow-400");
    expect(screen.getByText("// done")).toHaveClass("text-muted-foreground");
  });

  it("renders markup in the source as literal text, never as HTML", () => {
    // Regression test: this panel used to build an HTML string and inject it
    // with dangerouslySetInnerHTML, so any markup in the code it displayed was
    // parsed by the browser.
    const { container } = render(
      React.createElement(CodePanel, {
        code: ['<img src=x onerror="alert(1)">', "<script>alert(2)</script>"],
        activeLine: null,
      })
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(container.textContent).toContain("<script>alert(2)</script>");
  });
});
