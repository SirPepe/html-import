interface HTMLImportElement extends HTMLElement {
  src: String;
  as: String;
  ready: Promise<HTMLElement | DocumentFragment>;
}