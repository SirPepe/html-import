# &lt;html-import&gt;

**Custom HTML element for importing HTML documents (or parts of documents) into
other HTML documents on the fly!** First install the package:

```shell
npm install @sirpepe/html-import
```

Then either load the module or the minified bundle and then use
`<html-import src>` in your HTML:

```html
<!-- Importing body content -->
<html-import src="content.html">
  <p>
    This text gets replaced when the content of the body element from
    content.html once it has loaded. If the browser does not support custom
    elements, this text is rendered as a fallback.
  </p>
</html-import>

<!-- Importing only content that matches a specific selector -->
<html-import src="content.html" selector=".foo">
  <p>
    This text gets replaced by elements matching .foo (that are not nested
    inside something matching .foo themselves) in content.html when it has
    loaded. Note that the selector's scope is not limited to the body, so you
    can import elements from a document's head as well.
  </p>
</html-import>

<!-- Reactive import -->
<html-import src="">
  <p>
    This text gets replaced by whatever the src property is set to if and when
    it gets set to something. This way the element works kindof like an iframe.
  </p>
</html-import>
```

Notable features:

* **Import whatever you like:** plain HTML elements, style and link elements and even script elements work. Non-blocking scripts (script elements with `async`, `defer` or `type="module"`) in imported HTML files work as expected. Blocking scripts will execute asynchronously, and thus may cause unintended effects.
* **Nest imports** as much as needed (as long as no circular imports exist)
* Optionally **filter imported elements by selector** with an attribute: `<html-import src="a.html" selector=".foo"></html-import>`. Fragments also work: `<html-import src="a.html#foo"></html-import>`.
* **Reactive imports:** updating the `src` or `selector` attributes replaces already imported content with new content as specified by the attributes
* **No frameworks, libraries or build tools required!** You can use the ESM version of this component with your favorite build tool or just drop the minified version right into your web project.
* Easy to customize through subclassing, monkey patching or events handlers.

## Guide

### Usage in HTML

To use the element in HTML you have to import the main script somewhere. The
custom element will register itself automatically and upgrade any
already-existing instances of `<html-import>`. Any new instances will initialize
in an upgraded state.

The element has two important HTML attributes:

* **`src`** defines the source HTML document for an import element. You can omit, remove or update the attribute at any time and the element will (if necessary) reload the source file and update itself. Both relative and absolute URLs work.
* **`selector`** defines a selector for specific elements to import from the source document. Any CSS selector that your target browsers support is valid. You can omit, remove or update the attribute at any time and the element will (if necessary) reload the source file and update itself with the new elements. If the `selector` attribute is missing or empty and the `src` attribute is set, the import element will import *all content* from the target document's `<body>` element (including text nodes). If the `selector` attribute is set, it selects elements from the entire target document (not just the `<body>`).

If the selector attribute is defined *and* if the `src` attribute contains a URL
with a fragment identifier, the element will import *only* the fragment target
if it also matches the selector. In summary:

* no selector, no fragment in URL = entire body contents
* selector, no fragment in URL = all elements matching the selector
* no selector, fragment in URL = first element matching the fragment
* selector and fragment in URL = first element matching the fragment if it that also matches selector

The element performs `fetch()` requests under the hood. Once such a request has
finished, the element's contents get replaced by whatever the result HTML
(optionally filtered by the selector). The content between an `<html-import>`
element's tags thus serves as both its initial content and its fallback content
in case some scripts break or an ancient browser without support for custom
elements comes along.

### JavaScript API

The JS API for `<html-import>` consists of a constructor function, four events,
two method, and three DOM properties (plus attributes for event handlers).

#### Constructor

You can construct instances of the element by using the `HTMLImportElement`
constructor:

```javascript
import HTMLImportElement from "html-import";

let myImportElement = new HTMLImportElement(
  "/optional/initial/src/value",
  "#optionalSelector"
);

document.body.append(myImportElement);
```

If you don't use ESM modules, you can always get access to the constructor via
the custom elements registry:

```javascript
window.customElements.whenDefined("html-import").then(() => {
  let HTMLImportElement = window.customElements.get("html-import");
});
```

#### Events

`HTMLImportElement` can fire four events:

* `importstart`: Fires when the element starts to load content, eg. after a change to the attributes `src` or `selector` or after calling `reload()`
* `importdone`: Fires when the element has imported content
* `importfail` Fires when importing content has failed (eg. due to 404). The event object implements a property `detail` that contains the reason for the failure.
* `importabort` Fires when the element was about to import content, but got interrupted (eg. by a new `src` value) before it could finish

All four events bubble and aren't cancelable. Note that you can use old-school
attribute event handlers a la `<html-import onimportdone="...">` in addition to
`addEventListener()`.

#### Methods

`HTMLImportElement` implements two DOM methods:

* `reload()` causes a re-load without the need to change any attributes or properties. The method takes no arguments and returns a promise that resolves to an array of imported elements and the imported document's titles (just like the promise returned by `done` as described below).
* `done()` returns a promise for that resolves when the element's target document has been loaded (or has failed to load due to an error).

The promises returned by `reload()` and `done()` resolve to an array of data
about what was imported:

```javascript
let element = document.querySelector("html-import");
element.done.then( (data) => {
  // data[0] = { element: affectedImportElement; title: "Imported document's title"; }
  // data[1] = { element: firstNestedImportElement; title: "Nested imported document's title"; }
  // etc.
});
```

#### Properties

`HTMLImportElement` implements seven DOM properties:

* `src` reflects the `src` content attribute. Can be used as a setter to change the `src` value. As a getter, it always returns absolute URLs, even when the HTML attribute is relative (just like a `<a>` element's `href` attribute). Returns the empty string when there's no `src` set.
* `selector` reflects the `selector` content attribute. Can be used as a setter to change the `selector` value.
* `onstart`, `ondone`, `onfail` and `onabort` event handlers

Note that the internal loading mechanism for `<html-import>` batches attribute
updates and cleanly terminates any ongoing request if a change to `src` or
`selector` occurs. You don't have to concern yourself with efficiency, just set
whatever attributes or DOM properties you want to change!

### Reactivity

Any change to the attributes `src` or `selector` causes the imported content to
update. The old nodes get removed and replaced by the newly imported content.
This means that it is easy to "ajaxify" any old collection of static HTML
documents:

1. Just wrap every page's main content in `<html-import>` (a minimal change to your project's main template)
2. Add a bit of javascript to intercept navigation events and manage the history (you can use your favorite routing library or just write a few lines yourself)

```html
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8">
<title>Static site - Start</title>
<script defer src="../../dist/html-import.min.js"></script>
<script defer src="./script.js"></script>
<h1>Demo site</h1>
<ul>
  <li><a class="active" href="./">Start</a></li>
  <li><a href="about.html">About</a></li>
  <li><a href="contact.html">Contact</a></li>
</ul>
<html-import src="" selector="html-import > *">
  <h2>Welcome to the demo's start page</h2>
</html-import>
```

Clicks on the navigation links update the `<html-import>` element's `src`
attribute, which causes it to load the respective page, extract the content from
the `<html-import>` element from there and dump it into this page's
`<html-import>` element. Add a little extra JS for routing and your whole page
suddenly feels like a SPA - when all you needed to do was to wrap every page's
main content in `<html-import>` and write about 50 lines of JavaScript to
intercept clicks and manage the navigation history. If something breaks or an
ancient browser comes along, your project will still work via traditional page
loads.

Check out `demo/staticsite/index.html` to see this principle in action.

### Customize, subclass and monkey patch

You can easily customize the element's behavior by subclassing or monkey
patching `HTMLImportElement`. Three methods on the `HTMLImportElement` class
are hooks for extensions:

* `public async fetch(url: string, signal: AbortSignal): Promise<string>` downloads the text content from a URL
* `public beforeReplaceContent(content: DocumentFragment): DocumentFragment` modifies the content before it is used
* `replaceContent(newContent: DocumentFragment): void` controls the actual replacing of the old content

The following `HTMLImportMarkdownElement` illustrates how you can easily build
on top of `<html-import>`:

```javascript
import marked from "marked";
import HTMLImportElement from "html-import";

export default class HTMLImportMarkdownElement extends HTMLImportElement {
  get [Symbol.toStringTag]() {
    return "HTMLMarkdownImportElement";
  }

  beforeReplaceContent(content) {
    const contentContainer = this.ownerDocument.createElement("template");
    let html = "";
    for (const node of content.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        html += node.textContent;
      } else if (node instanceof HTMLElement) {
        html += node.innerText;
      }
    }
    contentContainer.innerHTML = marked(html);
    return contentContainer.content;
  }
}

window.customElements.define("markdown-import", HTMLImportMarkdownElement);
```

Instead of subclassing, you can always monkey patch the prototype. If, for
example, you'd like to place the imported content in a shadow tree, just
overwrite `replaceContent()` like this:

```javascript
HTMLImportElement.prototype.replaceContent = function(newContent) {
  if (!this.shadowRoot) {
    this.shadowRoot = this.attachShadow({ mode: "open" });
  } else {
    this.shadowRoot.innerHTML = "";
  }
  this.shadowRoot.append(newContent);
}
```

Try `demo/monkeypatch/index.html` to see this hack in action!

To run code on newly imported content each time the content changes, you can
also add a listener to the `importdone` event and modify the event's target
content (that is, the content that has just been inserted into the
`<html-import>` element in question) as needed:

```javascript
window.addEventListener("importdone", (evt) => doStuff(evt.target.children));
```

### Changelog

* **3.0.0**: Remove `verbose` property, turn `done` from a getter into a method, simplify rules for promise resolution, replace `CustomEvent` with proper event subclasses, remove OnEventMixin, switch license to MIT, update toolchain
* **2.1.0**: Add `verbose` property
* **2.0.1**: Fix a bug that prevented scripts that were nested in other elements from being imported properly
* **2.0.0**: Complete rewrite

### Caveats

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox on Ubuntu.

## License

MIT
