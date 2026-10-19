(() => {
  "use strict";

  const STORAGE_KEY = "biLabTheme";
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  function setTheme(theme) {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", `Cambiar a tema ${isDark ? "claro" : "oscuro"}`);
      toggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
      toggle.querySelector(".theme-toggle-label").textContent = isDark ? "Tema claro" : "Tema oscuro";
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: isDark ? "dark" : "light" } }));
  }

  setTheme(savedTheme === "dark" ? "dark" : "light");
  toggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  });
})();
