window.HTMLImportHtmlElement = window.HTMLImportHtmlElement || (function(){
  "use strict";

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
    return document.importNode(element, true);
  }

  function extractBodyContent(doc){
    const fragment = document.createDocumentFragment();
    for(const child of doc.body.children){
      const node = document.importNode(child, true);
      fragment.appendChild(node);
    }
    return fragment;
  }

  function waitForImports(importedImports){
    const promises = [];
    for(const importElement of importedImports){
      promises.push(importElement.ready);
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