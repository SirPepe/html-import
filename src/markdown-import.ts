/*!
 * <html-import> | Copyright (C) 2021 Peter Kröner | GPL-3.0-only
 */

import marked from "marked";
import HTMLHTMLImportElement from "./html-import";

export default class HTMLImportMarkdownElement extends HTMLHTMLImportElement {
  public get [Symbol.toStringTag](): string {
    return "HTMLMarkdownImportElement";
  }

  public beforeReplaceContent(content: DocumentFragment): DocumentFragment {
    const contentContainer = this.ownerDocument.createElement("template");
    let html = "";
    for (const node of content.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        html += node.textContent;
      } else if (node instanceof HTMLElement) {
        html += node.innerText;
      }
    }
    contentContainer.innerHTML = marked(html);
    return contentContainer.content;
  }
}

window.customElements.define("markdown-import", HTMLImportMarkdownElement);
