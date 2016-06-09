html-import
===========

If you know PHP, it's basically `include()` for HTML as a custom element.

Usage:

```html
<!-- Complete file (body) content will be appended
     after the element -->
<html-import src="content.html"></html-import>

<!-- Import an element with a specific ID -->
  <html-import src="content.html#foo"></html-import>
```

JavaScript API:

```js
var el = document.querySelector("html-import#foo");
el.ready.then(function(content){
  // "content" is the imported node or the imported
  // nodes in a DocumentFragment
});
```

Imports in imports work (in Chrome, just like regular imports).