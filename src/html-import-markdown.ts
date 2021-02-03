import marked from "marked";

function replaceContent(newContent: DocumentFragment): void {
  if (this.getAttribute("markdown") === "true") {
    let text = "";
    for (const node of newContent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node instanceof HTMLElement) {
        text += node.innerText;
      }
    }
    this.innerHTML = marked(text);
  } else {
    this.innerHTML = "";
    this.append(newContent);
  }
}

const definition = window.customElements.get("html-import");
if (definition) {
  definition.prototype.replaceContent = replaceContent;
} else {
  window.customElements.whenDefined("html-import").then(() => {
    window.customElements.get(
      "html-import"
    ).prototype.replaceContent = replaceContent;
  });
}
