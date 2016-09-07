html-import
===========

Custom element for importing HTML documents (or parts of documents) into other
documents. If you know PHP, it's basically client side `include()`.

Usage:

```html
<!-- Complete file (body) content will be appended
     after the element -->
<html-import src="content.html"></html-import>

<!-- Import an element with a specific ID -->
<html-import src="content.html#foo"></html-import>
```

If a template element is imported by its ID, *its content* will be added to the
page, not the template element itself.

JavaScript API:

```js
var el = document.querySelector("html-import.myImport");
el.ready.then(function(content){
  // "content" is the imported node or the imported
  // nodes in a DocumentFragment
});
```

Notable stuff that works:

 * Imports in other imports
 * Scripts (will be executed asynchronously)

Tested in Chrome and (using the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) in Firefox.