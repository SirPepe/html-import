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

  it("removes imported elements upon own removal", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html",
      "#lorem"
    );
    fixture.append(element);
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html" selector="#lorem"></html-import><p id="lorem">Lorem</p>`
    );
    element.remove();
    expect(fixture.innerHTML).toBe("");
  });

  it("replaces imported content reactively on src change", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html"
    );
    fixture.append(element);
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html"></html-import><p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`
    );
    element.src = "/base/test/resources/content2.html";
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content2.html"></html-import><p id="dolor">Dolor</p>`
    );
  });

  it("replaces imported content reactively on selector change", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html",
      "#lorem"
    );
    fixture.append(element);
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html" selector="#lorem"></html-import><p id="lorem">Lorem</p>`
    );
    element.selector = "#ipsum";
    await element.done;
    expect(fixture.innerHTML).toBe(
      `<html-import src="/base/test/resources/content.html" selector="#ipsum"></html-import><p id="ipsum">Ipsum</p>`
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
