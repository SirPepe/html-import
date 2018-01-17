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
 * Importing single elements (`<html-import src="a.html#SomeId"></html-import>`)
 * Filter imported elements by selector (`<html-import src="a.html" selector=".foo"></html-import>`)
 * Renaming importing single elements (`<html-import src="a.html#SomeId" as="SomethingElse"></html-import>`)
 * Erasing the ids from imported elements by leaving the `as` attribute empty (`<html-import src="a.html#SomeId" as=""></html-import>`)
 * Scripts in imported HTML files (will be executed asynchronously)
 * An in-memory cache prevents multiple downloads of the same file

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

To only import specific child elements use the `selector` attribute:

```html
<div class="wrapper">
  <!-- Import children of content.html that have the class "foo" -->
  <html-import src="content.html" selector=".foo"></html-import>
</div>
```

Only direct child elements of the document are matched against the selector. If
there is an element with the class `foo` in `content.html` not nested in any
other element, this is the result:

```html
<div class="wrapper">
  <html-import src="content.html" selector=".foo"></html-import>
  <p class="foo">Lorem</p>
</div>
```

You can also import single elements from a file:

```html
<div class="wrapper">
  <!-- Import an element with a specific ID -->
  <html-import src="content.html#foo"></html-import>
</div>
```

Result:

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
  <p id="foo">Lorem</p>
</div>
```

This will grab the element with the specified ID from anywhere in the imported
document, no matter how deeply nested.

Use the `as` attribute to change an element's ID after importing it. This might
be useful if you want to import multiple instances of the same element into one
page, but require IDs to remain unique:

```html
<div class="wrapper">
  <!-- Import an element with a specific ID and rename it -->
  <html-import src="content.html#foo" as="bar"></html-import>
</div>
```

Result:

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
  <p id="bar">Lorem</p>
</div>
```

If you want to erase the ID when importing the element, just add an empty `as`
attribute:

```html
<div class="wrapper">
  <!-- Import an element with a specific ID and erase the id when importing -->
  <html-import src="content.html#foo" as=""></html-import>
</div>
```

Result:

```html
<div class="wrapper">
  <html-import src="content.html#foo"></html-import>
  <p>Lorem</p>
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

Because template elements themselves do not get imported into the page, the
`as` attribute does not work when targeting templates (the `as` attribute is
silently ignored). If the `selector` attribute is specified, it will be used
to select the template elements to be imported (and will have no effect on their
contents).



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

The promise will be rejected (and the element will not import anything) if
anything mayor goes wrong. Things that might go wrong:

 * the `src` attribute is missing or empty
 * the url to load cannot be found
 * the requested element (specified by its ID) cannot be found in the imported document



Caveats
-------

* Because I'm a lazy linux-using slob this element has so far only been tested in Chrome and Firefox.
* If you use the [Polyfill](https://github.com/WebReflection/document-register-element) for `document-register-element`) (which you have to use if you want to support older browsers) you get a bunch of additional caveats (eg. when using innerHTML) for free.