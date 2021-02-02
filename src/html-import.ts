type PromiseResponse = {
  element: HTMLImportHTMLElement;
  title: string;
};

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
  imports: Iterable<HTMLImportHTMLElement>
): Promise<PromiseResponse[]> {
  const promises: Promise<PromiseResponse[]>[] = [];
  for (const importElement of imports) {
    promises.push(importElement.done);
  }
  const responses = await Promise.all(promises);
  return [].concat(...responses);
}

async function fetchHtml(url: string, signal: AbortSignal): Promise<string> {
  return window.fetch(url, { signal }).then((response) => response.text());
}

function extractContent(
  html: string,
  selector: string
): { content: DocumentFragment; title: string } {
  const content = window.document.createDocumentFragment();
  const source = new DOMParser().parseFromString(html, "text/html");
  if (selector) {
    const matchingDescendants = $(source, selector);
    for (const descendant of matchingDescendants) {
      if (!matchAncestor(descendant, selector)) {
        content.append(window.document.adoptNode(descendant));
      }
    }
  } else {
    // Can't use for-of here because adoptNode() removes the adopted nodes from
    // the source child list, for which document.body.childNodes is a *live*
    // view.
    while (source.body.childNodes.length > 0) {
      content.append(window.document.adoptNode(source.body.childNodes[0]));
    }
  }
  return { content, title: source.title };
}

export class HTMLImportHTMLElement extends HTMLElement {
  #done: Promise<PromiseResponse[]>;
  #abortController = new AbortController();
  #state: "loading" | "done" | "fail" | "none" = "none";
  #setDone: (entries: PromiseResponse[]) => void;
  #setFail: (reason: any) => void;
  #updateTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(src?: string, selector?: string) {
    super();
    if (src) {
      this.src = src;
    }
    if (selector) {
      this.selector = selector;
    }
    this.reset();
  }

  private reset(): void {
    if (this.#updateTimeout) {
      clearTimeout(this.#updateTimeout);
    }
    if (this.#state === "loading") {
      this.#abortController.abort();
      this.#abortController = new AbortController();
    }
    this.#state = "none";
    this.#done = new Promise((resolve, reject) => {
      this.#setDone = (entries) => {
        this.#state = "done";
        resolve(entries);
      };
      this.#setFail = (reason) => {
        if (reason !== "AbortError") {
          this.#state = "none";
          reject(reason);
        } else {
          this.#state = "fail";
        }
      };
    });
  }

  public get [Symbol.toStringTag](): string {
    return "HTMLImportHTMLElement";
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

  private async load(): Promise<void> {
    this.#state = "loading";
    try {
      const imported = extractContent(
        await fetchHtml(this.src, this.#abortController.signal),
        this.selector
      );
      fixScripts(imported.content, this.src);
      this.innerHTML = "";
      this.append(imported.content);
      const nested = await awaitNested(
        $<HTMLImportHTMLElement>(this, "html-import")
      );
      this.#setDone([{ element: this, title: imported.title }, ...nested]);
    } catch (error) {
      this.#setFail(error.name);
    }
  }

  get done(): Promise<{ element: HTMLImportHTMLElement; title: string }[]> {
    return this.#done.then((value) => value);
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

window.customElements.define("html-import", HTMLImportHTMLElement);
