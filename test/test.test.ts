import { HTMLImportHTMLElement } from "../src/index";

describe("use via constructor", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("imports a whole file", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html"
    );
    element.innerHTML = "This goes away";
    expect(element.toString()).toBe("[object HTMLImportHTMLElement]");
    expect(element.done.toString()).toBe("[object Promise]");
    fixture.append(element);
    await element.done;
    expect(element.innerHTML).toBe(
      `<p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`
    );
  });

  it("imports only select elements", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html",
      "#lorem"
    );
    element.innerHTML = "This goes away";
    expect(element.toString()).toBe("[object HTMLImportHTMLElement]");
    expect(element.done.toString()).toBe("[object Promise]");
    fixture.append(element);
    await element.done;
    expect(element.innerHTML).toBe(`<p id="lorem">Lorem</p>`);
  });

  it("replaces imported content reactively on src change", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html"
    );
    element.innerHTML = "This goes away";
    fixture.append(element);
    await element.done;
    expect(element.innerHTML).toBe(
      `<p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`
    );
    element.src = "/base/test/resources/content2.html";
    await element.done;
    expect(element.innerHTML).toBe(`<p id="dolor">Dolor</p>`);
  });

  it("replaces imported content reactively on selector change", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html",
      "#lorem"
    );
    fixture.append(element);
    await element.done;
    expect(element.innerHTML).toBe(`<p id="lorem">Lorem</p>`);
    element.selector = "#ipsum";
    await element.done;
    expect(element.innerHTML).toBe(`<p id="ipsum">Ipsum</p>`);
  });
});

describe("use via innerHTML", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("imports a whole file", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(
      fixture.querySelector<HTMLImportHTMLElement>("html-import").innerHTML
    ).toBe(`<p id="lorem">Lorem</p><p id="ipsum">Ipsum</p>`);
  });

  it("imports only select elements", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html" selector="#ipsum"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(
      fixture.querySelector<HTMLImportHTMLElement>("html-import").innerHTML
    ).toBe(`<p id="ipsum">Ipsum</p>`);
  });
});
