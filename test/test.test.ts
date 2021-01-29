import { HTMLImportHTMLElement } from "../src/index";

const wait = (ms: number): Promise<any> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
      `<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`
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
      `<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`
    );
    element.src = "/base/test/resources/content2.html";
    await element.done;
    expect(element.innerHTML).toBe(`<p id="dolor">Dolor</p>\n`);
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
    ).toBe(`<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`);
  });

  it("imports a whole file with text nodes", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/contentWithText.html"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(
      fixture.querySelector<HTMLImportHTMLElement>("html-import").innerHTML
    ).toBe(`Hello\n<p id="lorem">Lorem</p>\nWorld\n<p id="ipsum">Ipsum</p>\n`);
  });

  it("imports only select elements", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html" selector="#ipsum"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(
      fixture.querySelector<HTMLImportHTMLElement>("html-import").innerHTML
    ).toBe(`<p id="ipsum">Ipsum</p>`);
  });
});

describe("JS API", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("delivers a new promise from 'done' each time", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html"></html-import>`;
    const element = fixture.querySelector<HTMLImportHTMLElement>("html-import");
    const a = element.done;
    const b = element.done;
    expect(a).not.toBe(b);
    const callback = jasmine.createSpy();
    a.then(callback);
    b.then(callback);
    await element.done;
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("lets outdates done promises never resolve", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html"></html-import>`;
    const element = fixture.querySelector<HTMLImportHTMLElement>("html-import");
    const a = element.done;
    const callback = jasmine.createSpy();
    a.then(callback, callback); // neither should happen on about
    element.src = "/base/test/resources/content2.html"; // make "a" moot
    await element.done;
    expect(callback).toHaveBeenCalledTimes(0);
  });
});

describe("scripts", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("executes imported scripts", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/scriptedContent.html"
    );
    fixture.append(element);
    await element.done;
    expect(element.firstElementChild.className).toBe("foo");
  });

  it("eventually executes linked imported scripts", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/externalScriptedContent.html"
    );
    fixture.append(element);
    await element.done;
    await wait(100); // script turned async
    expect(element.firstElementChild.className).toBe("foo");
  });

  it("does not execute scripts that were not imported", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/scriptedContent.html",
      "p"
    );
    fixture.append(element);
    await element.done;
    expect(element.firstElementChild.className).toBe("");
  });
});
