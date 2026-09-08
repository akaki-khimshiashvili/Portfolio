(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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

  /* ---------- Terminal typewriter (hero) ---------- */
  const terminalBody = document.querySelector("[data-terminal]");
  const terminalWindow = document.querySelector(".terminal");

  if (terminalBody) {
    const typedEls = Array.from(terminalBody.querySelectorAll("[data-typed]"));
    const finalLine = terminalBody.querySelector("[data-terminal-final]");

    // Read the real text before touching it, so the terminal degrades to
    // fully readable static text if JS never runs or reduced motion is on.
    typedEls.forEach((el) => {
      if (!el.dataset.fullText) el.dataset.fullText = el.textContent;
    });

    let running = false;
    let pendingTimers = [];

    function clearPendingTimers() {
      pendingTimers.forEach((id) => clearInterval(id));
      pendingTimers = [];
    }

    function showInstantly() {
      clearPendingTimers();
      typedEls.forEach((el) => {
        el.classList.remove("is-typing");
        el.textContent = el.dataset.fullText || "";
      });
      if (finalLine) finalLine.classList.add("is-visible");
      running = false;
    }

    function runTypewriter() {
      if (prefersReducedMotion) {
        showInstantly();
        return;
      }

      // Guard against double-starts (e.g. the transitionend listener and
      // the safety-net timeout both firing).
      if (running) return;
      running = true;

      clearPendingTimers();
      if (finalLine) finalLine.classList.remove("is-visible");
      typedEls.forEach((el) => {
        el.classList.remove("is-typing");
        el.textContent = "";
      });

      let index = 0;

      function typeNext() {
        if (index >= typedEls.length) {
          if (finalLine) finalLine.classList.add("is-visible");
          running = false;
          return;
        }

        const el = typedEls[index];
        const text = el.dataset.fullText || "";
        const isOutput = el.classList.contains("terminal-output");
        const speed = isOutput ? 8 : 32;
        let charIndex = 0;

        el.classList.add("is-typing");

        const interval = setInterval(() => {
          charIndex++;
          el.textContent = text.slice(0, charIndex);

          if (charIndex >= text.length) {
            clearInterval(interval);
            pendingTimers = pendingTimers.filter((id) => id !== interval);
            el.classList.remove("is-typing");
            index++;
            setTimeout(typeNext, isOutput ? 260 : 120);
          }
        }, speed);

        pendingTimers.push(interval);
      }

      typeNext();
    }

    // Start once the terminal window's own fade/blur entrance actually
    // finishes, instead of guessing a fixed delay that can fire too early
    // (typing over an still-blurred window) or, on a slow first paint,
    // too late relative to that guess. A timeout still backs it up in case
    // the transition never runs (reduced motion edge cases, the reveal
    // never triggering) so the terminal never gets stuck blank.
    function startWhenSettled() {
      if (!terminalWindow || prefersReducedMotion) {
        runTypewriter();
        return;
      }

      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        runTypewriter();
      };

      terminalWindow.addEventListener(
        "transitionend",
        (event) => {
          if (event.target === terminalWindow) start();
        },
        { once: true }
      );
      setTimeout(start, 1400);
    }

    startWhenSettled();

    // A page restored from the back/forward cache keeps whatever DOM state
    // it was frozen in (mid-type, or emptied but never finished) and does
    // not re-run this script, so without this the terminal can come back
    // permanently blank. Replay it from scratch whenever that happens.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        running = false;
        startWhenSettled();
      }
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

  /* ---------- Tagline word by word reveal ---------- */
  const taglineEl = document.querySelector("[data-tagline]");

  if (taglineEl) {
    const words = taglineEl.textContent.trim().split(/\s+/);
    taglineEl.textContent = "";

    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      taglineEl.appendChild(span);
      if (index < words.length - 1) {
        taglineEl.appendChild(document.createTextNode(" "));
      }
    });

    const wordEls = taglineEl.querySelectorAll(".word");

    if ("IntersectionObserver" in window && wordEls.length) {
      const wordObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-active");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
      );

      wordEls.forEach((word) => wordObserver.observe(word));
    } else {
      wordEls.forEach((word) => word.classList.add("is-active"));
    }
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

  /* ---------- Hero glow, cursor follow (decorative, desktop only) ---------- */
  const heroSection = document.querySelector(".hero");
  const glowEl = document.querySelector("[data-hero-glow]");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (heroSection && glowEl && canHover && !prefersReducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = null;

    function loop() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    heroSection.addEventListener("mousemove", (event) => {
      const rect = heroSection.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = relX * 60;
      targetY = relY * 60;

      if (!raf) raf = requestAnimationFrame(loop);
    });

    heroSection.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

})();
