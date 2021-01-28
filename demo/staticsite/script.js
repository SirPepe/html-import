const importElement = document.querySelector("html-import");
window.addEventListener("click", (evt) => {
  const anchor = evt.target.closest(`a[href]`);
  if (anchor && anchor.href.startsWith(window.location.origin)) {
    evt.preventDefault();
    window.history.pushState({}, "", anchor.href);
    importElement.src = anchor.href;
    importElement.done.then(([{ title }]) => (window.document.title = title));
  }
});
