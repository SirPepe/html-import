import HTMLMarkdownImportElement from "../src/markdown-import";

describe("Markdown subclass", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("has markdown support", async () => {
    fixture.innerHTML = `<markdown-import src="/base/test/resources/markdown.md"></markdown-import>`;
    const element = fixture.querySelector<HTMLMarkdownImportElement>(
      "markdown-import"
    );
    await element.done;
    expect(fixture.innerHTML)
      .toBe(`<markdown-import src="/base/test/resources/markdown.md"><h1 id="hello-word">Hello Word</h1>
<p>This is a paragraph</p>
</markdown-import>`);
  });
});
