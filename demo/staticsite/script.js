const importElement = document.querySelector("html-import");

const navLinks = Object.fromEntries(
  Array.from(document.querySelectorAll("nav a"), (a) => [a.href, a])
);
let activeNavLink = document.querySelector("nav a.active");

function goTo(href) {
  activeNavLink.classList.remove("active");
  activeNavLink = navLinks[href];
  activeNavLink.classList.add("active");
  importElement.src = href;
  importElement.done.then(([{ title }]) => (window.document.title = title));
}

window.addEventListener("popstate", ({ state }) => {
  if (state && state.href) {
    goTo(state.href);
  }
});

window.addEventListener("click", (evt) => {
  const anchor = evt.target.closest(`a[href]`);
  if (anchor && anchor.href.startsWith(window.location.origin)) {
    evt.preventDefault();
    window.history.pushState({ href: anchor.href }, "", anchor.href);
    goTo(anchor.href);
  }
});
