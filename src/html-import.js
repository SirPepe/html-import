// @flow

window.HTMLImportElement = window.HTMLImportElement || (function(){
  "use strict";

  const cache = new Map();

  function resolveAsap () {
    return new Promise( (resolve) => setTimeout(resolve, 0) );
  }

  function isScript (node) {
    return Object.prototype.toString.call(node) === "[object HTMLScriptElement]";
  }

  function isTemplate (node) {
    return Object.prototype.toString.call(node) === "[object HTMLTemplateElement]";
  }

  // This whole dance around scripts is nessercary because Firefox treats
  // scripts that come from other documents as tainted and won't run them. So
  // we have to clone the scripts and copy the original's content and/or
  // href values over to the clones
  function runScripts(node, parent){
    if (isScript(node)) {
      runScript(node, parent);
    } else {
      for (let child of node.children) {
        runScripts(child, node);
      }
    }
  }

  function runScript (script, parent) {
    const clone = document.createElement("script");
    insertAfter(script, clone);
    clone.text = script.text;
    if (script.src) {
      clone.src = script.src;
    }
    parent.removeChild(script);
  }

  function insertAfter (target, node) {
    if (target.parentNode) {
      return target.parentNode.insertBefore(node, target.nextSibling);
    }
  }

  function removeHash (url) {
    return url.split("#")[0];
  }

  function getHash (url) {
    return url.split("#")[1];
  }

  function fetchHtml (url) {
    url = removeHash(url);
    const fromCache = cache.get(url);
    if (fromCache) {
      return fromCache;
    } else {
      const promise = window.fetch(url).then( (response) => response.text() );
      cache.set(url, promise);
      return promise;
    }
  }

  function extractElement (doc, id, newId, path) {
    let element = doc.getElementById(id);
    if (!element) {
      element = extractFromTemplates(doc, id);
    }
    if (!element) {
      throw new Error(`Could not find element #${id} in ${removeHash(path)}`);
    }
    if (element && isTemplate(element) && element.content) {
      if (newId) {
        throw new Error(`Imported element #${id} and found it to be a template, which cannot be renamed to ${newId} as specified in the 'as' attribute`);
      }
      return importChildren(element.content);
    }
    if (newId) {
      element = element.cloneNode(true);
      element.id = newId;
    }
    return document.importNode(element, true);
  }

  function extractFromTemplates (doc, id) {
    const templates = doc.querySelectorAll("template");
    for (let template of templates) {
      const element = template.content.getElementById(id);
      if (element) {
        return element;
      }
    }
  }

  function extractBodyContent (doc) {
    return importChildren(doc.body);
  }

  function importChildren (sourceElement) {
    if (!sourceElement) {
      throw new Error("Missing sourceElement");
    }
    const fragment = document.createDocumentFragment();
    const children = sourceElement.children;
    for (let child of children) {
      const node = document.importNode(child, true);
      fragment.appendChild(node);
    }
    return fragment;
  }

  function waitForImports (importedImports) {
    const promises = [];
    for (let importElement of importedImports) {
      // Wait for the current stack to clear before reporting "ready", so
      // that polyfilled custom elements can initialize - otherwise
      // importElement.ready would not be ready
      const waiting = resolveAsap().then( () => importElement.ready );
      promises.push(waiting);
    }
    return Promise.all(promises);
  }

  function extractContent (html, id, newId, path) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (id) {
      return extractElement(doc, id, newId, path);
    } else {
      return extractBodyContent(doc);
    }
  }

  const RESOLVE_KEY = Symbol();
  const REJECT_KEY  = Symbol();

  class HTMLImportElement extends HTMLElement {

    constructor (self) {
      self = super(self);
      self.ready = new Promise( (resolve, reject) => {
        self[RESOLVE_KEY] = resolve;
        self[REJECT_KEY]  = reject;
      });
      return self;
    }

    connectedCallback () {
      const hasSrc = this.hasAttribute("src");
      if (!hasSrc) {
        return this[REJECT_KEY](new Error("The 'src' attribute is required"));
      }
      const src   = this.getAttribute("src");
      if (!src) {
        return this[REJECT_KEY](new Error("The 'src' attribute is empty"));
      }
      const hasAs = this.hasAttribute("as");
      const newId = this.getAttribute("as");
      if (hasAs && !newId) {
        return this[REJECT_KEY](new Error("The 'as' attribute was defined, but it is empty"));
      }
      const id = getHash(src);
      if (newId && !id) {
        return this[REJECT_KEY](new Error("The 'as' attribute was defined, but src attribute is not targeting an element"));
      }
      this[RESOLVE_KEY](fetchHtml(src)
        .then( (html) => extractContent(html, id, newId, src) )
        .then( (content) => {
          var importedImports = content.querySelectorAll("html-import");
          runScripts(content, this);
          insertAfter(this, content);
          return waitForImports(importedImports);
        }));
    }

  }

  customElements.define("html-import", HTMLImportElement);

  return HTMLImportElement;

})();
