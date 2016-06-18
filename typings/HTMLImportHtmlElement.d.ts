interface HTMLImportHtmlElement extends HTMLElement {
  src: String;
  ready: Promise<HTMLElement | DocumentFragment>;
}