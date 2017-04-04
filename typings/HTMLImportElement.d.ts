interface HTMLImportElement extends HTMLElement {
  src: String;
  ready: Promise<HTMLElement | DocumentFragment>;
}