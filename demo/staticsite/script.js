const importElement = document.querySelector("html-import");
const loaderElement = document.querySelector(".loading");

const navLinks = Object.fromEntries(
  Array.from(document.querySelectorAll("nav a"), (a) => [a.href, a])
);
let activeNavLink = document.querySelector("nav a.active");

function scrollTo(hash) {
  if (hash) {
    if (hash === "#top") {
      window.scrollTo({ top: 0 });
      return;
    }
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView();
    }
  }
}

function goTo(href) {
  const parsed = new URL(href);
  const hash = parsed.hash;
  const site = parsed.origin + parsed.pathname;
  if (site !== importElement.src) {
    loaderElement.removeAttribute("hidden");
    activeNavLink.classList.remove("active");
    activeNavLink = navLinks[site];
    activeNavLink.classList.add("active");
    importElement.src = site;
    importElement.done.then(([{ title }]) => {
      window.document.title = title;
      loaderElement.setAttribute("hidden", "hidden");
      scrollTo(hash);
    });
  } else {
    scrollTo(hash);
  }
}

window.addEventListener("popstate", ({ state }) => {
  if (state && state.href) {
    goTo(state.href);
  }
});

window.addEventListener("click", (evt) => {
  const anchor = evt.target.closest(`a[href]:not([href^="#"])`);
  if (anchor && anchor.href.startsWith(window.location.origin)) {
    evt.preventDefault();
    window.history.pushState({ href: anchor.href }, "", anchor.href);
    goTo(anchor.href);
  }
});
