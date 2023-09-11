import { expect } from "@esm-bundle/chai";
import { spy } from "sinon";
import HTMLImportElement from "../src/html-import";

const wait = (ms: number): Promise<any> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Add artificial network delay to make observing events easy
const originalFetch = HTMLImportElement.prototype.fetch;
HTMLImportElement.prototype.fetch = async function fetch(
  this: HTMLImportElement,
  url: string,
  signal: AbortSignal,
): Promise<any> {
  await wait(100);
  return await originalFetch.call(this, url, signal);
};

// web-dev-server injects garbage into imported HTML file
function cleanupHTML(html: string): string {
  return html.replaceAll(
    `<!-- injected by web-dev-server -->\n<script type="module" src="/__web-dev-server__web-socket.js"></script>`,
    "",
  );
}

describe("use via constructor", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("transforms relative src attributes to absolute src props", () => {
    const element = new HTMLImportElement("test/resources/content.html");
    expect(element.src).to.match(/^http/);
    expect(element.src).to.match(/content\.html$/);
    expect(element.getAttribute("src")).to.equal("test/resources/content.html");
  });

  it("does not transform empty or missing src attributes", () => {
    expect(new HTMLImportElement().src).to.equal("");
    expect(new HTMLImportElement("").src).to.equal("");
  });

  it("initializes in 'ready' state", () => {
    expect(new HTMLImportElement().state).to.equal("ready");
  });

  it("imports a whole file", async () => {
    const element = new HTMLImportElement("test/resources/content.html");
    expect(element.state).to.equal("loading");
    element.innerHTML = "This goes away";
    expect(element.toString()).to.equal("[object HTMLImportElement]");
    expect(element.done().toString()).to.equal("[object Promise]");
    fixture.append(element);
    await element.done();
    expect(element.state).to.equal("done");
    expect(element.innerHTML).to.equal(
      `<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`,
    );
  });

  it("imports content matching the the fragment", async () => {
    const element = new HTMLImportElement("test/resources/content3.html#lorem");
    element.innerHTML = "This goes away";
    fixture.append(element);
    await element.done();
    expect(element.innerHTML).to.equal(
      `<p id="lorem"><span class="foo">Lorem</span></p>`,
    );
  });

  it("imports only elements matching the selector", async () => {
    const element = new HTMLImportElement(
      "test/resources/content.html",
      "#lorem",
    );
    element.innerHTML = "This goes away";
    fixture.append(element);
    await element.done();
    expect(element.innerHTML).to.equal(`<p id="lorem">Lorem</p>`);
  });

  it("replaces imported content reactively on src change", async () => {
    const element = new HTMLImportElement("test/resources/content.html");
    element.innerHTML = "This goes away";
    fixture.append(element);
    await element.done();
    expect(element.innerHTML).to.equal(
      `<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`,
    );
    element.src = "test/resources/content2.html";
    await element.done();
    expect(element.innerHTML).to.equal(`<p id="dolor">Dolor</p>\n`);
  });

  it("replaces imported content reactively on selector change", async () => {
    const element = new HTMLImportElement(
      "test/resources/content.html",
      "#lorem",
    );
    fixture.append(element);
    await element.done();
    expect(element.innerHTML).to.equal(`<p id="lorem">Lorem</p>`);
    element.selector = "#ipsum";
    await element.done();
    expect(element.innerHTML).to.equal(`<p id="ipsum">Ipsum</p>`);
  });

  it("Does not reload when event handlers change", async () => {
    const element = new HTMLImportElement(
      "test/resources/content.html",
      "#lorem",
    );
    fixture.append(element);
    await element.done();
    element.onimportstart = function () {
      throw new Error("This import start event should not happen!");
    };
    await wait(100);
  });
});

describe("use via innerHTML", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("imports a whole file", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p id="lorem">Lorem</p>\n<p id="ipsum">Ipsum</p>\n`,
    );
  });

  it("imports a whole file with text nodes", async () => {
    fixture.innerHTML = `<html-import src="test/resources/contentWithText.html"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `Hello\n<p id="lorem">Lorem</p>\nWorld\n<p id="ipsum">Ipsum</p>\n`,
    );
  });

  it("imports only elements matching the hash", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html#ipsum"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p id="ipsum">Ipsum</p>`,
    );
  });

  it("imports only elements matching the selector", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html" selector="#ipsum"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p id="ipsum">Ipsum</p>`,
    );
  });

  it("imports only select elements that also match the hash", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html#ipsum" selector="#ipsum"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p id="ipsum">Ipsum</p>`,
    );
  });

  it("does not import elements that do not match the hash", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html#ipsum" selector="p"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p id="ipsum">Ipsum</p>`,
    );
  });

  it("imports only top-most selector-matching elements", async () => {
    fixture.innerHTML = `<html-import src="test/resources/nestedContent.html" selector=".foo"></html-import>`;
    await fixture.querySelector("html-import")?.done();
    expect(fixture.querySelector("html-import")?.innerHTML).to.equal(
      `<p class="foo"><span class="foo">Lorem</span></p>`,
    );
  });
});

describe("JS API", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("delivers a new promise from 'done' each time and fires 'importdone' events", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html"></html-import>`;
    const element = fixture.querySelector("html-import") as HTMLImportElement;
    const eventCallback = spy();
    element.addEventListener("importdone", eventCallback);
    const a = element.done();
    const b = element.done();
    expect(a).not.to.equal(b);
    const promiseCallback = spy();
    a.then(promiseCallback);
    b.then(promiseCallback);
    await element.done();
    expect(promiseCallback.callCount).to.equal(2);
    expect(eventCallback.callCount).to.equal(1);
  });

  it("fires abort events on src change and fulfills promises from before the change", async () => {
    fixture.innerHTML = `<html-import src="test/resources/content.html"></html-import>`;
    const element = fixture.querySelector("html-import") as HTMLImportElement;
    const a = element.done();
    const abortEventCallback = spy();
    const promiseDoneCallback = spy();
    const promiseFailCallback = spy();
    a.then(promiseDoneCallback, promiseFailCallback);
    element.addEventListener("importabort", abortEventCallback);
    element.src = "test/resources/content2.html";
    await element.done();
    expect(promiseDoneCallback.callCount).to.equal(1);
    expect(promiseFailCallback.callCount).to.equal(0);
    expect(abortEventCallback.callCount).to.equal(1);
  });

  it("fires fail events and rejects promises", async () => {
    fixture.innerHTML = `<html-import></html-import>`;
    const element = fixture.querySelector("html-import") as HTMLImportElement;
    element.src = "/404";
    const thenCallback = spy();
    const catchCallback = spy();
    const eventCallback = spy();
    element.done().then(thenCallback, catchCallback);
    element.addEventListener("importfail", eventCallback);
    await element.done().catch(() => {}); // eslint-disable-line
    expect(element.state).to.equal("fail");
    expect(thenCallback.callCount).to.equal(0);
    expect(catchCallback.callCount).to.equal(1);
    expect(eventCallback.callCount).to.equal(1);
  });

  it("bubbles all events", async () => {
    const onDone = spy();
    const onFail = spy();
    const onAbort = spy();
    fixture.addEventListener("importdone", onDone);
    fixture.addEventListener("importfail", onFail);
    fixture.addEventListener("importabort", onAbort);
    const elements = [
      new HTMLImportElement("test/resources/content.html"),
      new HTMLImportElement("test/resources/404.html"),
      new HTMLImportElement("test/resources/content.html"),
    ];
    fixture.append(...elements);
    elements[2].src = "test/resources/content2.html";
    await Promise.allSettled(elements.map((el) => el.done()));
    expect(onDone.callCount).to.equal(2); // 0, 2
    expect(onFail.callCount).to.equal(1); // 1
    expect(onAbort.callCount).to.equal(1); // 2
    fixture.removeEventListener("importdone", onDone);
    fixture.removeEventListener("importfail", onFail);
    fixture.removeEventListener("importabort", onAbort);
  });
});

describe("nesting", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("works with nested imports", async () => {
    const element = new HTMLImportElement("test/resources/nesting.html");
    fixture.append(element);
    const promiseResponse = await element.done();
    expect(element.innerHTML).to.have
      .string(`<html-import src="test/resources/content.html"><p id="lorem">Lorem</p>
<p id="ipsum">Ipsum</p>
</html-import>`);
    expect(promiseResponse.length).to.equal(2);
  });

  it("works with nested imports in nested imports", async () => {
    const element = new HTMLImportElement("test/resources/doubleNesting.html");
    fixture.append(element);
    const promiseResponse = await element.done();
    expect(cleanupHTML(element.outerHTML)).to
      .equal(`<html-import src="test/resources/doubleNesting.html"><html-import src="test/resources/nesting.html"><html-import src="test/resources/content.html"><p id="lorem">Lorem</p>
<p id="ipsum">Ipsum</p>
</html-import>
</html-import>
</html-import>`);
    expect(promiseResponse.length).to.equal(3);
  });
});

describe("scripts", () => {
  const fixture = document.createElement("div");
  document.body.append(fixture);
  beforeEach(() => (fixture.innerHTML = ""));

  it("executes imported scripts", async () => {
    const element = new HTMLImportElement(
      "test/resources/scriptedContent.html",
    );
    fixture.append(element);
    await element.done();
    expect(element.firstElementChild?.className).to.equal("foo");
  });

  it("executes imported scripts nested in other elements", async () => {
    const element = new HTMLImportElement(
      "test/resources/scriptedContentNested.html",
    );
    fixture.append(element);
    await element.done();
    expect(element.firstElementChild?.className).to.equal("foo");
  });

  it("eventually executes linked imported scripts", async () => {
    const element = new HTMLImportElement(
      "test/resources/externalScriptedContent.html",
    );
    fixture.append(element);
    await element.done();
    await wait(100); // script turned async
    expect(element.firstElementChild?.className).to.equal("foo");
  });

  it("does not execute scripts that were not imported", async () => {
    const element = new HTMLImportElement(
      "test/resources/scriptedContent.html",
      "p",
    );
    fixture.append(element);
    await element.done();
    expect(element.firstElementChild?.className).to.equal("");
  });
});
