(() => {
  "use strict";

  /* ---------- Preloader / ready gate ----------
   * Everything below used to run the moment this deferred script parsed,
   * which is often before fonts have swapped in or images have settled.
   * Starting reveal observers against a page that is still reflowing
   * is what caused animations to occasionally stall mid-way or never fire at all.
   * Instead we hide the page behind a preloader and only wire up any of
   * that once the page has actually finished loading (fonts + window
   * "load"), with a safety timeout so a slow asset can never leave the
   * site stuck behind the preloader indefinitely.
   */
  const preloader = document.querySelector("[data-preloader]");

  function whenReady() {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      const fontsReady =
        document.fonts && document.fonts.ready
          ? document.fonts.ready.catch(() => {})
          : Promise.resolve();

      const pageLoaded =
        document.readyState === "complete"
          ? Promise.resolve()
          : new Promise((res) => window.addEventListener("load", res, { once: true }));

      Promise.all([fontsReady, pageLoaded]).then(done);

      // Never block the page for more than 3s (slow network, a stalled
      // font or the third-party icon script failing to load, etc.).
      setTimeout(done, 3000);
    });
  }

  function hidePreloader() {
    document.body.classList.remove("is-loading");
    if (!preloader) return;

    preloader.classList.add("is-hidden");
    preloader.addEventListener("transitionend", () => preloader.remove(), {
      once: true,
    });
    // Fallback in case the transition never fires.
    setTimeout(() => preloader.remove(), 700);
  }

  function init() {
  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navOverlay = document.querySelector("[data-nav-overlay]");

  function closeNav() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    navOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function openNav() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    navOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && navOverlay) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeNav() : openNav();
    });

    navOverlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    // Tap the empty backdrop (not a link) to dismiss too.
    navOverlay.addEventListener("click", (event) => {
      if (event.target === navOverlay) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal-up");

  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const sections = ["work", "skills", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === `#${id}`;
      if (isMatch) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Scroll progress bar ---------- */
  const progressEl = document.querySelector("[data-scroll-progress]");
  let progressTicking = false;

  function updateProgress() {
    if (!progressEl) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    progressEl.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    progressTicking = false;
  }

  if (progressEl) {
    window.addEventListener(
      "scroll",
      () => {
        if (!progressTicking) {
          requestAnimationFrame(updateProgress);
          progressTicking = true;
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.querySelector("[data-copy-email]");

  if (copyBtn) {
    const icon = copyBtn.querySelector("[data-copy-icon]");
    let revertTimer = null;

    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.getAttribute("data-email") || "";

      try {
        await navigator.clipboard.writeText(email);
      } catch (err) {
        return;
      }

      copyBtn.classList.add("is-copied");
      if (icon) {
        icon.classList.remove("ph-copy");
        icon.classList.add("ph-check");
      }

      clearTimeout(revertTimer);
      revertTimer = setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        if (icon) {
          icon.classList.remove("ph-check");
          icon.classList.add("ph-copy");
        }
      }, 1600);
    });
  }

  } // end init()

  whenReady().then(() => {
    hidePreloader();
    init();
  });

})();
