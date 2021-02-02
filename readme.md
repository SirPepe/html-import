# &lt;html-import&gt;

**v2 is a work in progress!**

Custom HTML element for importing HTML documents (or parts of documents) into
other documents on the fly. It works similar to `include()` in PHP, `import` in
JavaScript or `#include` in C/C++, but for HTML content.

Examples:

```html
<!-- Importing body content -->
<html-import src="content.html">
  <p>
    This text is replaced when the content of the body element from content.html
    once it has loaded. If the browser does not support custom elements, this
    text is rendered as a fallback.
  </p>
</html-import>

<!-- Importing only content that matches a specific selector -->
<html-import src="content.html" selector=".foo">
  <p>
    This text is replaced by elements matching .foo (that are not nested inside
    something matching .foo themselves) in content.html when it has loaded. Note
    that the selector's scope is not limited to the body, so you can import
    elements from a document's head as well.
  </p>
</html-import>

<!-- Reactive import -->
<html-import src="">
  <p>
    This text is replaced by whatever the src property is set to if and when it
    gets set to something. This way the element works kindof like an iframe.
  </p>
</html-import>
```

Notable features:

* Import whatever you like; plain HTML elements, style and link elements and
  even script elements work. Non-blocking scripts in imported HTML files work as
  expected. Blocking scripts will be executed asynchronously, and thus may cause
  unintended effects.
* Nest imports to your heart's content (as long as there's no circular imports)
* Optionally filter imported elements by selector with an additional attribute:
  `<html-import src="a.html" selector=".foo"></html-import>`
* Reactive imports - updating the `src` or `selector` attributes replaces
  already imported content with new content as specified by the attributes
* Does not rely on any frameworks, libraries or build tools

## Why?

Having dynamic HTML imports in the frontend may appear to be a questionable idea, but that really depends on the context. I originally came up with this custom elements as a way to modularize my collection HTML-based slides about various overlapping topics, for which the element worked very well. I organized almost all of my slides into around 250 "stories" that I can now combine in seconds to create new presentations.

It also turns out that `<html-import>` makes it almost trivial to add a SPA-like reactive feel to old-school HTML/CMS-based projects (see [reactivity](#reactivity)).

## License

`<html-import>` is made available under the [GPLv3 license](https://opensource.org/licenses/gpl-3.0.html) for open-source and personal projects. [Talk to me](https://www.peterkroener.de/kontakt/) if you want to use it for something else.

## Usage in HTML

To use the element in HTML you have to import the main script somewhere. The
custom element will register itself automatically and upgrade any
already-existing instances of `<html-import>`.

The element has two important HTML attributes:

* `src` defines the source HTML document for an import element. You can omit,
  remove or update the attribute at any time and the element will (if necessary)
  reload the source file and update itself. Both relative and absolute URLs
  work.
* `selector` defines a selector for specific elements to import from the source
  document. You can omit, remove or update the attribute at any time and the
  element will (if necessary) reload the source file and update itself with the
  new elements. If the `selector` attribute is missing or empty and the `source`
  attribute is set, the import element will import *all content* from the target
  document's `<body>` element (including text nodes). If the `selector`
  attribute is set, it selects elements from the entire target document (not
  just the `<body>`). You can use any selector string that your browser
  supports.

The element performs `fetch()` requests under the hood. Once such a request has
finished, the element's contents get replaced by whatever was requested
(optionally filtered by the selector). The content between an `<html-import>`
element's tags thus serves as both its initial content and its fallback content
in case some scripts break or an ancient browser without support for custom
elements comes along.

## JavaScript API

You can construct instances of the element by using the `HTMLImportHTMLElement`
constructor:

```javascript
import { HTMLImportHTMLElement } from "html-import";

let myImportElement = new HTMLImportHTMLElement(
  "/optional/initial/src/value",
  "#optionalSelector"
);

document.body.append(myImportElement);
```

`HTMLImportHTMLElement` implements three DOM properties:

* `src` reflects the `src` HTML attribute. Can be used as a setter to change the
  `src` value. As a getter, it always returns absolute URLs, even when the HTML
  attribute is relative (just like a `<a>` element's `href` attribute). Returns
  the empty string when there's no `src` set.
* `selector` reflects the `selector` HTML attribute. Can be used as a setter to
  change the `selector` value.
* `done` which returns a promise for that resolves when the element's target
  document has been loaded. Note that `done` returns a new promise each time you
  access the property, with the promise reflecting the then-current loading
  operation each time.

```javascript
const element = document.querySelector("html-import");
const a = element.done;
const b = element.done; // a new promise, not equal to a
element.src = "/somewhere/else.html"; // causes an update
// a and b will now never resolve (assuming they have not already)
const c = element.done; // resolves when "/somewhere/else.html" has loaded
```

Note that the internal loading mechanism for `<html-import>` debounces attribute
updates and cleanly terminates any ongoing request if a change to `src` or
`selector` occurs.

## Reactivity

Any change to the attributes `src` or `selector` causes the imported content to
update. The old nodes get removed and replaced by the newly imported content.
This means that it's quite easy to "ajaxify" any old collection of static HTML
documents:

```html
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8">
<title>Static site - Start</title>
<script type="module" src="../../dist/index.js"></script>
<script type="module" src="./script.js"></script>
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
`<html-import>` element. Add a little extra JS for routing and
your whole page suddenly feels like a SPA - when all you needed to do was to
wrap every page's main content in `<html-import>` and write about 50 lines of
JavaScript to intercept clicks and manage the navigation history.

Check out `demo/staticsite` to see this principle in action.

## Caveats

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox on Ubuntu.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support older browsers) you get a bunch of additional caveats (eg. when using innerHTML) for free.
