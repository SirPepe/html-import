import { HTMLImportHTMLElement } from "../src/index";

describe("Constructor", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("imports a whole file", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html"
    );
    expect(element.toString()).toBe("[object HTMLImportHTMLElement]");
    expect(element.done.toString()).toBe("[object Promise]");
    fixture.append(element);
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html"></html-import><p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`
    );
  });

  it("imports only select elements", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html",
      "#lorem"
    );
    expect(element.toString()).toBe("[object HTMLImportHTMLElement]");
    expect(element.done.toString()).toBe("[object Promise]");
    fixture.append(element);
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html" selector="#lorem"></html-import><p id="lorem">Lorem</p>`
    );
  });
});

describe("innerHTML", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("imports a whole file", async () => {
    const element = `<html-import src="/base/test/resources/content.html"></html-import>`;
    fixture.innerHTML = element;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(fixture.innerHTML).toBe(
      element + `<p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`
    );
  });

  it("imports only select elements", async () => {
    const element = `<html-import src="/base/test/resources/content.html" selector="#ipsum"></html-import>`;
    fixture.innerHTML = element;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(fixture.innerHTML).toBe(element + `<p id="ipsum">Ipsum</p>`);
  });
});
