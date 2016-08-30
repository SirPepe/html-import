window.HTMLImportHtmlElement = window.HTMLImportHtmlElement || (function(){
  "use strict";

  function resolveAsap(value){
    return new Promise(function(resolve){
      setTimeout(resolve, 0);
    });
  }

  function insertAfter(target, node){
    return target.parentNode.insertBefore(node, target.nextSibling);
  }

  function getHash(url){
    return url.split("#")[1];
  }

  function fetchHtml(url){
    return window.fetch(url)
      .then( response => response.text() );
  }

  function extractElement(doc, id){
    const element = doc.getElementById(id);
    if(!element){
      throw new Error(`Could not find element #${id} in ${html}`);
    }
    if(Object.prototype.toString.call(element) === "[object HTMLTemplateElement]"){
      return importChildren(element.content);
    }
    return document.importNode(element, true);
  }

  function extractBodyContent(doc){
    return importChildren(doc.body);
  }

  function importChildren(sourceElement){
    const fragment = document.createDocumentFragment();
    for(let child of sourceElement.children){
      const node = document.importNode(child, true);
      fragment.appendChild(node);
    }
    return fragment;
  }

  function waitForImports(importedImports){
    const promises = [];
    for(let importElement of importedImports){
      // Wait for the current stack to clear before reporting "ready", so
      // that polyfilled custom elements can initialize - otherwise
      // importElement.ready would not be ready
      const waiting = resolveAsap().then( () => importElement.ready );
      promises.push(waiting);
    }
    return Promise.all(promises);
  }

  function extractContent(html, id){
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if(id){
      return extractElement(doc, id);
    } else {
      return extractBodyContent(doc);
    }
  }

  return document.registerElement('html-import', {
    prototype: Object.create(window.HTMLElement.prototype, {
      attachedCallback: {
        value: function(){
          const src = this.getAttribute("src");
          const id = getHash(src);
          this.ready = fetchHtml(src)
            .then( html => extractContent(html, id) )
            .then( content => {
              var importedImports = content.querySelectorAll("html-import");
              insertAfter(this, content);
              return waitForImports(importedImports);
            });
        }
      }
    })
  });

})();
