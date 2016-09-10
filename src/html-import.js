window.HTMLImportHtmlElement = window.HTMLImportHtmlElement || (function(){
  "use strict";

  function resolveAsap(value){
    return new Promise(function(resolve){
      setTimeout(resolve, 0);
    });
  }

  function isScript(node){
    return Object.prototype.toString.call(node) === "[object HTMLScriptElement]";
  }

  function isTemplate(node){
    return Object.prototype.toString.call(node) === "[object HTMLTemplateElement]";
  }

  // This whole dance around scripts is nessercary because Firefox treats
  // scripts that come from other documents as tainted and won't run them. So
  // we have to clone the scripts and copy the original's content and/or
  // href values over to the clones
  function runScripts(node, parent){
    if(isScript(node)){
      runScript(node, parent);
    } else {
      for(let child of node.children){
        runScripts(child, node);
      }
    }
  }

  function runScript(script, parent){
    const clone = document.createElement("script");
    insertAfter(script, clone);
    clone.text = script.text;
    if(script.src){
      clone.src = script.src;
    }
    parent.removeChild(script);
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
    let element = doc.getElementById(id);
    if(!element){
      element = extractFromTemplates(doc, id);
    }
    if(!element){
      throw new Error(`Could not find element #${id}`);
    }
    if(isTemplate(element)){
      return importChildren(element.content);
    }
    return document.importNode(element, true);
  }

  function extractFromTemplates(doc, id){
    const templates = doc.querySelectorAll("template");
    for(let template of templates) {
      const element = template.content.getElementById(id);
      if(element){
        return element;
      }
    }
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
              runScripts(content, this);
              insertAfter(this, content);
              return waitForImports(importedImports);
            });
        }
      }
    })
  });

})();
