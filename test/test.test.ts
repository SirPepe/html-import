import { HTMLImportHTMLElement } from "../src/html-import";

const wait = (ms: number): Promise<any> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Add artificial delay to make observing events easy
const slowdown = (element: HTMLImportHTMLElement): void => {
  (element as any).fetch = (url: string, signal: AbortSignal): Promise<string> =>
    wait(100).then(() => (HTMLImportHTMLElement.prototype as any).fetch.call(element, url, signal));
};

describe("use via constructor", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("transforms relative src attributes to absolute src props", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/content.html"
    );
    expect(element.src).toMatch(/^http/);
    expect(element.src).toMatch(/content\.html$/);
  });

  it("does not transform empty or missing src attributes", async () => {
    expect((new HTMLImportHTMLElement()).src).toBe("");
    expect((new HTMLImportHTMLElement("")).src).toBe("");
  });

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

  it("imports only top-most select elements", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/nestedContent.html" selector=".foo"></html-import>`;
    await fixture.querySelector<HTMLImportHTMLElement>("html-import").done;
    expect(
      fixture.querySelector<HTMLImportHTMLElement>("html-import").innerHTML
    ).toBe(`<p class="foo"><span class="foo">Lorem</span></p>`);
  });
});

describe("JS API", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("delivers a new promise from 'done' each time and fires done events", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html"></html-import>`;
    const element = fixture.querySelector<HTMLImportHTMLElement>("html-import");
    const eventCallback = jasmine.createSpy();
    element.addEventListener("importdone", eventCallback);
    const a = element.done;
    const b = element.done;
    expect(a).not.toBe(b);
    const promiseCallback = jasmine.createSpy();
    a.then(promiseCallback);
    b.then(promiseCallback);
    await element.done;
    expect(promiseCallback).toHaveBeenCalledTimes(2);
    expect(eventCallback).toHaveBeenCalledTimes(1);
  });

  it("fires abort events and never fulfills outdated promises", async () => {
    fixture.innerHTML = `<html-import src="/base/test/resources/content.html"></html-import>`;
    const element = fixture.querySelector<HTMLImportHTMLElement>("html-import");
    slowdown(element);
    const a = element.done;
    const promiseCallback = jasmine.createSpy();
    a.then(promiseCallback, promiseCallback); // neither should happen on abort
    const eventCallback = jasmine.createSpy();
    element.addEventListener("importabort", eventCallback);
    await wait(20); // allow debounce to happen after attribute change
    element.src = "/base/test/resources/content2.html"; // make "a" moot
    await element.done;
    expect(promiseCallback).toHaveBeenCalledTimes(0);
    expect(eventCallback).toHaveBeenCalledTimes(1);
  });

  it("fires fail events and rejects promises", async () => {
    fixture.innerHTML = `<html-import></html-import>`;
    const element = fixture.querySelector<HTMLImportHTMLElement>("html-import");
    element.src = "/404";
    const thenCallback = jasmine.createSpy("then");
    const catchCallback = jasmine.createSpy("catch");
    const eventCallback = jasmine.createSpy("failevent");
    element.done.then(thenCallback, catchCallback);
    element.addEventListener("importfail", eventCallback);
    await element.done.catch(() => {});
    expect(thenCallback).toHaveBeenCalledTimes(0);
    expect(catchCallback).toHaveBeenCalledTimes(1);
    expect(eventCallback).toHaveBeenCalledTimes(1);
  });
});

describe("nesting", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("works with nested imports", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/nesting.html"
    );
    fixture.append(element);
    const promiseResponse = await element.done;
    expect(element.outerHTML)
      .toBe(`<html-import src="/base/test/resources/nesting.html"><html-import src="/base/test/resources/content.html"><p id="lorem">Lorem</p>
<p id="ipsum">Ipsum</p>
</html-import>
</html-import>`);
    expect(promiseResponse).toHaveSize(2);
  });

  it("works with nested imports in nested imports", async () => {
    const element = new HTMLImportHTMLElement(
      "/base/test/resources/doubleNesting.html"
    );
    fixture.append(element);
    const promiseResponse = await element.done;
    expect(element.outerHTML)
      .toBe(`<html-import src="/base/test/resources/doubleNesting.html"><html-import src="/base/test/resources/nesting.html"><html-import src="/base/test/resources/content.html"><p id="lorem">Lorem</p>
<p id="ipsum">Ipsum</p>
</html-import>
</html-import>
</html-import>`);
    expect(promiseResponse).toHaveSize(3);
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
