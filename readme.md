# &lt;html-import&gt;

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

## JavaScript API

## Caveats

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox on Ubuntu.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support older browsers) you get a bunch of additional caveats (eg. when using innerHTML) for free.
