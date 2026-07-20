function closeNav(nav, menuBtn) {
  nav.classList.remove("open");
  document.body.classList.remove("nav-open");
  menuBtn.setAttribute("aria-expanded", "false");
}

export function initMobileNav() {
  const menuBtn = document.querySelector(".menu");
  const nav = document.querySelector(".nav");
  if (!menuBtn || !nav) return;

  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Menu");

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle("open");
    document.body.classList.toggle("nav-open", isOpen);
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.querySelectorAll(
    ".links a, .nav-login, .user-menu-btn, .user-dropdown-item, .lang-option",
  ).forEach((el) => {
    el.addEventListener("click", () => closeNav(nav, menuBtn));
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) {
      closeNav(nav, menuBtn);
    }
  });
}
