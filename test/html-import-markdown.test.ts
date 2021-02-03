import { HTMLImportHTMLElement } from "../src/html-import";
import "../src/html-import-markdown";

describe("markdown extension", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("adds markdown support", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/markdown.md" markdown="true"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(fixture.innerHTML)
      .toBe(`<html-import src="/base/test/resources/markdown.md" markdown="true"><h1 id="hello-word">Hello Word</h1>
<p>This is a paragraph</p>
</html-import>`);
  });
});
