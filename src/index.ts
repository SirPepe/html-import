function $<T extends Element>(
  target: Element | Document | DocumentFragment,
  selector: string
): NodeListOf<T> {
  return target.querySelectorAll(selector);
}

// Not really "ASAP", but probably works well enough
function resolveAsap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function isScript(node: any): node is HTMLScriptElement {
  return Object.prototype.toString.call(node) === "[object HTMLScriptElement]";
}

function insertAfter(target: Element, node: Node): void {
  if (target.parentNode) {
    target.parentNode.insertBefore(node, target.nextSibling);
  }
}

function matchAncestor(element: Element, selector: string): Element | null {
  if (!element.parentElement) {
    return null;
  }
  return element.parentElement.closest(selector);
}

// This whole dance around scripts is required because Firefox (rightly) treats
// scripts that come from other documents as suspicious and won't run them. So
// we have to clone the scripts and copy the original's content and/or href
// values over to the clones, because that's not suspicious at all.
function runScript(script: HTMLScriptElement, parent: Node): void {
  const clone = document.createElement("script");
  insertAfter(script, clone);
  clone.text = script.text;
  if (script.src) {
    clone.src = script.src;
  }
  parent.removeChild(script);
}

function runScripts(
  node: Element | DocumentFragment,
  parent: Element | DocumentFragment
): void {
  if (isScript(node)) {
    runScript(node, parent);
  } else {
    for (const child of node.children) {
      runScripts(child, node);
    }
  }
}

async function awaitNested(
  imports: Iterable<HTMLImportHTMLElement>
): Promise<HTMLImportHTMLElement[]> {
  const promises = [];
  for (const importElement of imports) {
    // Wait for the current stack to clear before reporting "done", so
    // that polyfilled custom elements can initialize - otherwise
    // importElement.ready would not be ready
    const waiting = resolveAsap().then(() => importElement.done);
    promises.push(waiting);
  }
  return Promise.all(promises);
}

async function fetchHtml(url: string, signal: AbortSignal): Promise<string> {
  return window.fetch(url, { signal }).then((response) => response.text());
}

function extractContent(html: string, selector: string): DocumentFragment {
  const content = window.document.createDocumentFragment();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (selector) {
    const matchingDescendants = $(document, selector);
    for (const descendant of matchingDescendants) {
      if (!matchAncestor(descendant, selector)) {
        content.append(window.document.importNode(descendant, true));
      }
    }
  } else {
    for (const child of document.body.children) {
      content.append(window.document.importNode(child, true));
    }
  }
  return content;
}

export class HTMLImportHTMLElement extends HTMLElement {
  #importedNodes: Element[] = [];
  #done: Promise<HTMLImportHTMLElement[]>;
  #working = false;
  #setDone: (elements: HTMLImportHTMLElement[]) => void;
  #setFail: (reason: any) => void;
  #abortInProgress: AbortController | null = null;
  #updateTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(src?: string, selector?: string) {
    super();
    if (src) {
      this.src = src;
    }
    if (selector) {
      this.selector = selector;
    }
    this.setupPromise();
  }

  // Create a new promise with new handlers only if the previous operation has
  // finished
  private setupPromise(): void {
    if (!this.#working) {
      this.#working = true;
      this.#done = new Promise((resolve, reject) => {
        this.#setDone = (elements) => {
          resolve(elements);
          this.#working = false;
        };
        this.#setFail = (reason) => {
          if (reason !== "AbortError") {
            reject(reason);
            this.#working = false;
          }
        };
      });
    }
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
    if (this.#updateTimeout) {
      clearTimeout(this.#updateTimeout);
    }
    if (this.#abortInProgress) {
      this.#abortInProgress.abort();
    }
    this.cleanup();
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
  // the actual import, mainly because attribute changes are not batched.
  private import(): void {
    this.setupPromise();
    if (this.#updateTimeout) {
      clearTimeout(this.#updateTimeout);
    }
    if (this.#abortInProgress) {
      this.#abortInProgress.abort();
    }
    this.#updateTimeout = setTimeout(() => {
      this.cleanup();
      this.load();
    }, 0);
  }

  private cleanup(): void {
    for (const node of this.#importedNodes) {
      node.remove();
    }
    this.#importedNodes.length = 0;
  }

  private async load(): Promise<void> {
    this.#abortInProgress = new AbortController();
    try {
      const content = extractContent(
        await fetchHtml(this.src, this.#abortInProgress.signal),
        this.selector
      );
      this.#importedNodes.length = 0;
      this.#importedNodes.push(...content.children);
      runScripts(content, this);
      insertAfter(this, content);
      const nested = await awaitNested(
        $<HTMLImportHTMLElement>(content, "html-import")
      );
      this.#setDone([this, ...nested]);
    } catch (error) {
      this.#setFail(error.name);
    }
  }

  get done(): Promise<HTMLImportHTMLElement[]> {
    return this.#done;
  }

  get src(): string {
    return this.getAttribute("src") || "";
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