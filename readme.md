# &lt;html-import&gt;

**v2 is a work in progress!**

Custom HTML element for importing HTML documents (or parts of documents) into
other documents on the fly. It works similar to `include()` in PHP, `import` in
JavaScript or `#include` in C/C++, but for HTML content, but can also be used
in a reactive fashion.

Examples:

```html
<!-- The complete document body of content.html gets appended after the element -->
<html-import src="content.html">
  <p>This text is visible while the target file is loading</p>
</html-import>

<!-- Only elements matching .foo get imported up from content.html -->
<html-import src="content.html" selector=".foo">
  <p>This text is visible while the target file is loading</p>
</html-import>
```

Notable features:

* Nest imports to your heart's content
* Reactive imports - updating the `src` or `selector` attributes replaces already imported content with new content as specified by the attributes
* Filter imported elements by selector (`<html-import src="a.html" selector=".foo"></html-import>`)
* Non-blocking scripts in imported HTML files work (blocking scripts will be executed asynchronously, and thus may cause unintended effects)

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

## Caveats

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox on Ubuntu.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support older browsers) you get a bunch of additional caveats (eg. when using innerHTML) for free.
