# &lt;html-import&gt;

**v2 is a work in progress!**

Custom HTML element for importing HTML documents (or parts of documents) into
other documents on the fly. It works similar to `include()` in PHP, `import` in
JavaScript or `#include` in C/C++, but for HTML content, but can also be used
in a reactive fashion.

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
    something matching .foo themselves) in content.html when it has loaded.
  </p>
</html-import>

<!-- Reactive import -->
<html-import src="">
  <p>
    This text is replaced by whatever the src property get set to if and when it
    gets set to something.
  </p>
</html-import>
```

Notable features:

* Nest imports to your heart's content
* Reactive imports - updating the `src` or `selector` attributes replaces already imported content with new content as specified by the attributes
* Filter imported elements by selector (`<html-import src="a.html" selector=".foo"></html-import>`)
* Non-blocking scripts in imported HTML files work as expected. Blocking scripts will be executed asynchronously, and thus may cause unintended effects.

## Why?

## Usage in HTML

## Reactivity

Any change to the attributes `src` or `selector` causes the imported content to
update. The old nodes get removed and replaced by the newly imported content.
This means that it's quite easy to "ajaxify" any old collection of static HTML
documents:

```html
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8">
<title>Document</title>
<script type="module" src="../../dist/index.js"></script>

<h1>Demo site</h1>

<ul>
  <li onclick="document.querySelector('html-import').src = 'start.html'">Start</li>
  <li onclick="document.querySelector('html-import').src = 'about.html'">About</li>
  <li onclick="document.querySelector('html-import').src = 'contact.html'">Contact</li>
</ul>

<html-import src="start.html" selector="body"></html-import>
```

Clicks on the list items load the respective pages, extract their `body` content
and dump it into the main page's DOM. Add a litte extra JS for routing and
everything feels like a SPA without causing any work.

Check out `demo/staticsite` to see this principle in action.

## JavaScript API

You can construct instances of the element by using the `HTMLImportHTMLElement`
constructor:

```javascript
let myImportElement = new HTMLImportHTMLElement(
  "/optional/initial/src/value",
  "#optionalSelector"
);
```

Apart from `src` and `selector` (which reflect their respective attributes and
can be used as setters), each element implements a DOM property `done` which
returns a promise for that resolves when the element's target document has been
loaded. `done` returns a new promise each time you use the property, with the
promise reflecting the then-current loading operation each time.

```javascript
// TODO example
```


## Caveats

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox on Ubuntu.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support older browsers) you get a bunch of additional caveats (eg. when using innerHTML) for free.
