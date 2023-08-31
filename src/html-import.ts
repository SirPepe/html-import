import { define, attr, href, string, reactive, event } from "@sirpepe/ornament";

type State = "loading" | "done" | "fail" | "ready";

type Handler<E extends Event> = ((evt: E) => void) | null;

type PromiseResponse = {
  element: HTMLImportElement;
  title: string;
};

type FulfillmentCallbacks = [
  Resolve: (entries: PromiseResponse[]) => any,
  Reject: (reason: any) => any
];

class ImportStartEvent extends Event {
  constructor() {
    super("importstart", { bubbles: true });
  }
}

class ImportDoneEvent extends Event {
  constructor() {
    super("importdone", { bubbles: true });
  }
}

class ImportAbortEvent extends Event {
  constructor() {
    super("importabort", { bubbles: true });
  }
}

class ImportFailEvent extends Event {
  #reason: any;

  constructor(reason: any) {
    super("importfail", { bubbles: true });
    this.#reason = reason;
  }

  get reason(): any {
    return this.#reason;
  }
}

function insertAfter(target: Element, content: Node): void {
  if (target.parentNode) {
    if (target.nextElementSibling) {
      target.parentNode.insertBefore(content, target.nextElementSibling);
    } else {
      target.parentNode.append(content);
    }
  }
}

// Fixing scripts is required because Firefox (rightly) treats scripts that are
// cloned or adopted from other documents as suspicious and won't run them. So
// we have to _manually_ clone the scripts and copy the original's content and
// attributes over to the clones, because that's not suspicious at all. This
// must happen in all browsers for the sake of consistency. Importing scripts
// turns them asynchronous
function fixScripts(context: DocumentFragment): void {
  const scripts = context.querySelectorAll("script");
  for (const script of scripts) {
    const clone = document.createElement("script");
    clone.text = script.text;
    for (const attribute of script.attributes) {
      clone.attributes.setNamedItem(attribute.cloneNode() as Attr);
    }
    insertAfter(script, clone);
    script.remove();
  }
}

async function awaitNested(
  imports: Iterable<HTMLImportElement>
): Promise<PromiseResponse[]> {
  const promises: Promise<PromiseResponse[]>[] = [];
  for (const importElement of imports) {
    promises.push(importElement.done());
  }
  const responses = await Promise.all(promises);
  return responses.flat();
}

// no selector, no hash = entire body contents
// selector, no hash = all elements matching selector
// no selector, hash = first element matching hash
// selector and hash = first element matching hash that also matches selector
function extractContent(
  html: string,
  selector: string,
  hash: string
): { content: DocumentFragment; title: string } {
  const content = window.document.createDocumentFragment();
  const source = new DOMParser().parseFromString(html, "text/html");
  if (!selector && !hash) {
    // Can't use for-of here because adoptNode() removes the adopted nodes from
    // the source child list, for which document.body.childNodes is a *live*
    // view.
    while (source.body.childNodes.length > 0) {
      content.append(window.document.adoptNode(source.body.childNodes[0]));
    }
  } else if (selector && !hash) {
    const matchingDescendants = source.querySelectorAll(selector);
    for (const descendant of matchingDescendants) {
      if (!descendant?.parentElement?.closest(selector)) {
        content.append(window.document.adoptNode(descendant));
      }
    }
  } else {
    const hashMatch = source.querySelector(hash); // basically getELementById()
    if (hashMatch && (!selector || hashMatch.matches(selector))) {
      content.append(hashMatch);
    }
  }
  return { content, title: source.title };
}

@define("html-import")
class HTMLImportElement extends HTMLElement {
  // Aborts running downloads and also serves as the object symbolizing the
  // current loading operation - AbortController is single-use anyway and so has
  // to be replaced for each request.
  #controller = new AbortController();

  // Promise fulfillment triggers, registered via done()
  #callbacks: FulfillmentCallbacks[] = [];

  // Internal state management. If a new request happens while the state is
  // "loading", the AbortController needs to be used to stop the previous
  // download.
  #state: State = "ready";

  // Public attributes
  @attr(href()) accessor src = "";
  @attr(string()) accessor selector = "";
  @attr(event()) accessor onimportstart: Handler<ImportStartEvent> = null;
  @attr(event()) accessor onimportdone: Handler<ImportDoneEvent> = null;
  @attr(event()) accessor onimportabort: Handler<ImportAbortEvent> = null;
  @attr(event()) accessor onimportfail: Handler<ImportFailEvent> = null;

  constructor(src?: string, selector?: string) {
    super();
    if (src) {
      this.src = src;
    }
    if (selector) {
      this.selector = selector;
    }
  }

  // Reset the current loading operation, if any. Abort the fetch request, fire
  // an abort error, but keep the current callbacks alive.
  #setBack(): void {
    if (this.#state === "loading") {
      this.#controller.abort();
      this.#controller = new AbortController();
      this.dispatchEvent(new ImportAbortEvent());
    }
    this.#state = "ready";
  }

  // End the current loading operation as a success. Fire a "done" event, then
  // trigger and re-set the success callbacks
  #setDone(entries: PromiseResponse[]): void {
    this.dispatchEvent(new ImportDoneEvent());
    this.#callbacks.forEach(([resolve]) => resolve(entries));
    this.#callbacks = [];
    this.#state = "done";
  }

  // End the current loading operation as a failure
  #setFail(reason: any): void {
    this.dispatchEvent(new ImportFailEvent(reason));
    this.#callbacks.forEach(([, reject]) => reject(reason));
    this.#callbacks = [];
    this.#state = "fail";
  }

  get [Symbol.toStringTag](): string {
    return "HTMLImportElement";
  }

  // Manually triggers a reload without changing src or selector
  async reload(): Promise<PromiseResponse[]> {
    this.#setBack();
    if (!this.src) {
      return [];
    }
    return (await this.#load()) ?? [];
  }

  @reactive({ keys: ["src", "selector"] })
  #import(): void {
    this.#setBack();
    if (!this.src) {
      return;
    }
    this.#load();
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // implement their own loading logic.
  async fetch(url: string, signal: AbortSignal): Promise<string> {
    const response = await window.fetch(url, { signal });
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error(`Response status not ok: ${response.statusText}`);
    }
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // manipulate the content that is about the get used.
  beforeReplaceContent(content: DocumentFragment): DocumentFragment {
    return content;
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // change how content gets replaced by new content.
  replaceContent(newContent: DocumentFragment): void {
    this.innerHTML = "";
    this.append(newContent);
  }

  async #load(): Promise<PromiseResponse[] | undefined> {
    const src = this.src;
    this.#state = "loading";
    this.dispatchEvent(new ImportStartEvent());
    // this.#abortController may be replaced while the load function is in the
    // middle of its job. We need this reference to keep access the relevant
    // promise triggers for when the operation completes.
    try {
      const imported = extractContent(
        await this.fetch(src, this.#controller.signal),
        this.selector,
        new URL(src, window.location.origin).hash
      );
      fixScripts(imported.content);
      this.replaceContent(this.beforeReplaceContent(imported.content));
      const nested = await awaitNested(this.querySelectorAll("html-import"));
      const result = [{ element: this, title: imported.title }, ...nested];
      this.#setDone(result);
      return result;
    } catch (error) {
      // Ignore abort "errors"
      if (!String(error).startsWith("AbortError")) {
        this.#setFail(`${String(error)} (${src})`);
      }
    }
  }

  done(): Promise<PromiseResponse[]> {
    return new Promise((...callbacks) => this.#callbacks.push(callbacks));
  }

  get state(): State {
    return this.#state;
  }
}

export default HTMLImportElement;

declare global {
  interface HTMLElementTagNameMap {
    "html-import": HTMLImportElement;
  }
}
