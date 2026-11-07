/* ==========================================================================
   توصيلة القلعة — shared site behaviour
   Language switching, scroll reveals, sticky-header state, phone carousel.
   No dependencies: this is served from GitHub Pages and should stay that way.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "qalaa-lang";

  var TITLES = {
    index:   { ar: "توصيلة القلعة — مشاوير وتوصيل طرود في عجلون",
               en: "Tawsilat Al-Qal'a — rides & parcel delivery in Ajloun" },
    privacy: { ar: "سياسة الخصوصية — توصيلة القلعة",
               en: "Privacy Policy — Tawsilat Al-Qal'a" },
    links:   { ar: "روابط توصيلة القلعة",
               en: "Tawsilat Al-Qal'a — links" }
  };

  /* -- language ---------------------------------------------------------- */

  /**
   * Reveals any .reveal element currently on screen.
   *
   * Needed on top of the IntersectionObserver because the two language trees
   * swap via display:none. An element that was display:none when observed is
   * never "intersecting", and the observer does not reliably deliver a fresh
   * entry when it becomes displayed again — so after a language switch the
   * sections already in the viewport stayed at opacity:0 and the page looked
   * blank. Verified: switching to Arabic left the first two policy sections
   * invisible until you scrolled.
   */
  function revealInView() {
    var list = document.querySelectorAll(".reveal:not(.shown)");
    Array.prototype.forEach.call(list, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add("shown");
    });
  }

  function applyLang(lang) {
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    var page = document.body.getAttribute("data-page") || "index";
    if (TITLES[page]) document.title = TITLES[page][lang];

    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }

    // Let the swap lay out, then catch anything the observer will not.
    requestAnimationFrame(function () {
      requestAnimationFrame(revealInView);
    });
  }

  function initialLang() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (saved === "ar" || saved === "en") return saved;
    // Arabic is the primary market, so it wins anything that is not clearly English.
    return (navigator.language || "ar").toLowerCase().indexOf("en") === 0 ? "en" : "ar";
  }

  applyLang(initialLang());

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang-toggle]");
    if (!btn) return;
    applyLang(root.lang === "ar" ? "en" : "ar");
  });

  /* -- sticky header ------------------------------------------------------ */

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -- scroll reveal ------------------------------------------------------ */
  // Progressive enhancement: without IntersectionObserver (or with reduced
  // motion) everything is simply shown, never left invisible.

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("shown"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Stagger siblings slightly so a grid cascades instead of snapping in.
        var delay = parseInt(entry.target.getAttribute("data-delay") || "0", 10);
        setTimeout(function () { entry.target.classList.add("shown"); }, delay);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    reveals.forEach(function (el) { io.observe(el); });
  }

  /* -- phone carousel ----------------------------------------------------- */

  var screen = document.querySelector(".phone-screen");
  var dotsBox = document.querySelector(".shot-dots");

  if (screen && dotsBox) {
    var shots = Array.prototype.slice.call(screen.querySelectorAll("img"));
    var dots  = Array.prototype.slice.call(dotsBox.querySelectorAll("button"));
    var index = 0;
    var timer = null;

    function show(i) {
      index = (i + shots.length) % shots.length;
      shots.forEach(function (img, n) { img.classList.toggle("on", n === index); });
      dots.forEach(function (d, n) {
        d.classList.toggle("on", n === index);
        d.setAttribute("aria-selected", n === index ? "true" : "false");
      });
    }

    function play() {
      if (reduced) return;               // no auto-advance if motion is unwelcome
      stop();
      timer = setInterval(function () { show(index + 1); }, 3600);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (d, n) {
      d.addEventListener("click", function () { show(n); play(); });
    });

    // Pause while the tab is hidden — a background timer swapping images is
    // pure battery cost with nobody looking.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else play();
    });

    show(0);
    play();
  }

  /* -- share (links page) ------------------------------------------------- */
  // Native share sheet on phones; desktop browsers without it get the URL on
  // the clipboard and a toast saying so.

  var toast = document.querySelector(".lt-toast");
  var toastTimer = null;

  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-share]")) return;
    var data = { title: document.title, url: location.href.split("#")[0] };

    if (navigator.share) {
      navigator.share(data).catch(function () { /* user closed the sheet */ });
      return;
    }
    if (navigator.clipboard && toast) {
      navigator.clipboard.writeText(data.url).then(function () {
        toast.classList.add("on");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("on"); }, 1800);
      });
    }
  });

  /* -- footer year -------------------------------------------------------- */
  var y = document.querySelectorAll("[data-year]");
  y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
