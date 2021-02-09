/*!
 * <html-import> | Copyright (C) 2021 Peter Kröner | GPL-3.0-only
 */

type PromiseResponse = {
  element: HTMLHTMLImportElement;
  title: string;
};

type FulfillmentCallbacks = [
  Resolve: (entries: PromiseResponse[]) => any,
  Reject: (reason: any) => any
];

let link: HTMLAnchorElement;
function absoluteUrl(href: string): string {
  link = link || document.createElement("a");
  link.href = href;
  return link.href;
}

function $<T extends Element>(
  target: Element | Document | DocumentFragment,
  selector: string
): NodeListOf<T> {
  return target.querySelectorAll(selector);
}

function warn(...args: any[]): void {
  if (window.console) {
    if (typeof window.console.warn === "function") {
      window.console.warn(...args);
    } else if (typeof window.console.log === "function") {
      window.console.log(...args);
    }
  }
}

function isAsyncByDesign(script: HTMLScriptElement): boolean {
  return (
    script.hasAttribute("async") ||
    script.hasAttribute("defer") ||
    script.getAttribute("type") === "module"
  );
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

function matchAncestor(element: Element, selector: string): Element | null {
  if (!element.parentElement) {
    return null;
  }
  return element.parentElement.closest(selector);
}

// Fixing scripts is required because Firefox (rightly) treats scripts that are
// cloned or adopted from other documents as suspicious and won't run them. So
// we have to _manually_ clone the scripts and copy the original's content and
// attributes over to the clones, because that's not suspicious at all. This
// must happen in all browsers for the sake of consistency. Importing scripts
// turns them asynchronous, so we issue a warning if the scripts were not
// originally meant to execute asynchronously. Also screw TypeScript for having
// Attr extend Node, but also having Node.cloneNode() return Node.
function fixScripts(context: DocumentFragment, sourceUrl: string): void {
  const scripts = context.querySelectorAll("script");
  for (const script of scripts) {
    if (!isAsyncByDesign(script)) {
      warn(
        `An formerly blocking script in ${sourceUrl} has been imported by html-import and is now executing asynchronously`
      );
    }
    const clone = document.createElement("script");
    clone.text = script.text;
    for (const attribute of script.attributes) {
      clone.attributes.setNamedItem(attribute.cloneNode() as Attr);
    }
    insertAfter(script, clone);
    context.removeChild(script);
  }
}

async function awaitNested(
  imports: Iterable<HTMLHTMLImportElement>
): Promise<PromiseResponse[]> {
  const promises: Promise<PromiseResponse[]>[] = [];
  for (const importElement of imports) {
    promises.push(importElement.done);
  }
  const responses = await Promise.all(promises);
  return [].concat(...responses);
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
    const matchingDescendants = $(source, selector);
    for (const descendant of matchingDescendants) {
      if (!matchAncestor(descendant, selector)) {
        content.append(window.document.adoptNode(descendant));
      }
    }
  } else {
    const hashMatch = $(source, hash)[0];
    if (hashMatch && (!selector || hashMatch.matches(selector))) {
      content.append(hashMatch);
    }
  }
  return { content, title: source.title };
}

export default class HTMLHTMLImportElement extends HTMLElement {
  // Aborts running downloads and also serves as the object symbolizing the
  // current operation - AbortController is single-use anyway and so has to be
  // replaced for each request.
  #abortController = new AbortController();

  // Internal state management, used to decide if the AbortController needs to
  // be used when a new request happens.
  #state: "loading" | "done" | "fail" | "none" = "none";

  // Promise fulfillment triggers mapped by the AbortController that was in use
  // when they were registered (using the AbortController as a stand-in for the
  // then-current operation)
  #callbacks: WeakMap<AbortController, FulfillmentCallbacks[]> = new WeakMap();

  // Used to debounce attribute updates, which for some reason are NOT batched
  // for custom elements (in contrast to attribute changes in MutationObserver).
  #updateTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(src?: string, selector?: string) {
    super();
    if (src) {
      this.src = src;
    }
    if (selector) {
      this.selector = selector;
    }
    this.#state = "none";
  }

  private reset(): void {
    if (this.#updateTimeout) {
      clearTimeout(this.#updateTimeout);
    }
    if (this.#state === "loading") {
      this.#abortController.abort();
    }
    // Only replace the current AbortController if it was either used in the
    // previous block or if there are any triggers currently attached. This
    // keeps promises alive, for which no loading process ever started.
    const triggers = this.#callbacks.get(this.#abortController) || [];
    if (this.#state === "loading" || triggers.length > 0) {
      this.#abortController = new AbortController();
    }
    this.#state = "none";
  }

  private setDone(
    entries: PromiseResponse[],
    controller: AbortController
  ): void {
    const callbacks = this.#callbacks.get(controller) || [];
    this.dispatchEvent(new Event("importdone", { bubbles: true }));
    this.#state = "done";
    callbacks.forEach(([resolve]) => resolve(entries));
  }

  // A special case of failure is the AbortError which is not really a "failure"
  // but rather a orderly reset/shutdown.
  private setFail(reason: any, controller: AbortController): void {
    const callbacks = this.#callbacks.get(controller) || [];
    if (reason === "AbortError") {
      this.dispatchEvent(new Event("importabort", { bubbles: true }));
      this.#state = "none";
    } else {
      this.dispatchEvent(
        new CustomEvent("importfail", { bubbles: true, detail: reason })
      );
      this.#state = "fail";
      callbacks.forEach(([, reject]) => reject(reason));
    }
  }

  public get [Symbol.toStringTag](): string {
    return "HTMLHTMLImportElement";
  }

  static get observedAttributes(): string[] {
    return ["src", "selector"];
  }

  private connectedCallback() {
    this.import();
  }

  private disconnectedCallback() {
    this.reset();
  }

  private attributeChangedCallback(
    name: string,
    oldValue: any,
    newValue: any
  ): void {
    if ((name === "src" || name === "selector") && oldValue !== newValue) {
      this.import();
    }
  }

  // Public method to trigger re-loads without changing src or selector
  public async reload(): Promise<PromiseResponse[]> {
    this.reset();
    if (!this.src) {
      return [];
    }
    return this.load();
  }

  // Triggered when anything happens that requires a (re-)import, but debounces
  // the actual load process, mainly because attribute changes on custom
  // elements are, in contrast to mutation observers, not batched.
  private import(): void {
    this.reset();
    if (!this.src) {
      return;
    }
    this.#updateTimeout = setTimeout(() => this.load(), 0);
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // implement their own loading logic.
  public async fetch(url: string, signal: AbortSignal): Promise<string> {
    const response = await window.fetch(url, { signal });
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error(`Response status not ok: ${response.statusText}`);
    }
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // manipulate the content that is about the get used.
  public beforeReplaceContent(content: DocumentFragment): DocumentFragment {
    return content;
  }

  // Subclasses, extensions and tests may want to mess with this method to
  // change how content gets replaced by new content.
  public replaceContent(newContent: DocumentFragment): void {
    this.innerHTML = "";
    this.append(newContent);
  }

  private async load(): Promise<PromiseResponse[]> {
    this.#state = "loading";
    this.dispatchEvent(new Event("importstart", { bubbles: true }));
    // this.#abortController may be replaced while the load function is in the
    // middle of its job. We need this reference to keep access the relevant
    // promise triggers for when the operation completes.
    const abortController = this.#abortController;
    try {
      const imported = extractContent(
        await this.fetch(this.src, abortController.signal),
        this.selector,
        new URL(this.src).hash
      );
      fixScripts(imported.content, this.src);
      this.replaceContent(this.beforeReplaceContent(imported.content));
      const nested = await awaitNested(
        $<HTMLHTMLImportElement>(this, "html-import")
      );
      const result = [{ element: this, title: imported.title }, ...nested];
      this.setDone(result, abortController);
      return result;
    } catch (error) {
      this.setFail(error.name, abortController);
    }
  }

  get done(): Promise<PromiseResponse[]> {
    return new Promise((resolve, reject) => {
      const callbacks = this.#callbacks.get(this.#abortController);
      if (callbacks) {
        callbacks.push([resolve, reject]);
      } else {
        this.#callbacks.set(this.#abortController, [[resolve, reject]]);
      }
    });
  }

  get src(): string {
    const src = this.getAttribute("src") || "";
    if (src) {
      return absoluteUrl(src);
    }
    return "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get selector(): string {
    return this.getAttribute("selector") || "";
  }

  set selector(value: string) {
    this.setAttribute("selector", value);
  }
}

window.customElements.define("html-import", HTMLHTMLImportElement);
