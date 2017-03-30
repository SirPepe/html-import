&lt;html-import&gt;
===================

Custom element for importing HTML documents (or parts of documents) into other
documents. If you know PHP, it's basically client side `include()`.

```html
<!-- The complete file (body) content will be appended after the element -->
<html-import src="content.html"></html-import>
```

Notable features:

 * Nested imports
 * Scripts in imported HTML files (will be executed asynchronously)
 * An in-memory cache prevent multiple downloads of the same file

Usage in HTML
-------------

Given a file `content.html` with the following HTML:

```html
<p id="foo">Lorem</p>
<p id="bar">Ipsum</p>
```

Importing `content.html`:

```html
<div class="wrapper">
  <html-import src="content.html"></html-import>
</div>
```

Result:

```html
<div class="wrapper">
  <html-import src="content.html"></html-import>
  <p id="foo">Lorem</p>
  <p id="bar">Ipsum</p>
</div>
```

You can also import single elements from a file:

```html
<!-- Import an element with a specific ID -->
<html-import src="content.html#foo"></html-import>
```

Result:

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
  <p id="foo">Lorem</p>
</div>
```

If a template element is imported by its ID, *its content* will be added to the
page, not the template element itself. If `content.html` looks like this...

```html
<template id="foo">
  <p>Lorem</p>
</template>
<template id="bar">
  <p>Ipsum</p>
</template>
```

... and this is the import element...

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
</div>
```

... this will be the result:

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
  <p>Lorem</p>
</div>
```



JavaScript API
--------------

Use the class constructor to create instances of HTMLImportElement:

```js
let myImport = new HTMLImportElement();
myImport.setAttribute("src", "content.html");
document.body.appendChild(myImport);
```

The `ready` property on HTMLImportElement instances contains a promise that is
resolved as soon as the imported content (including nested imports) has been
added to the page.

```js
var el = document.querySelector("html-import.myImport");
el.ready
  .then(function(content){
    // "content" is the imported node or the imported
    // nodes in a DocumentFragment
  }, function(reasonForFailure){
    // download failed, element not found etc.
  });
```



Caveats
-------

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support Firefox) you get a bunch of additional caveats (eg. when using innerHTML) for free.