(function () {
  "use strict";

  window.INNOVERSE_EVENTS = {
    "brand-reboot": { name: "The Brand Reboot", path: "E-Summit", page: "esummit.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Acquire a struggling legacy brand, diagnose why it failed, and write its comeback." },
    "pitch-arena": { name: "Pitch Arena", path: "E-Summit", page: "esummit.html", team: "Teams of up to 4", min: 1, max: 4, blurb: "Turn a startup idea into a pitch investors believe in." },
    "fort-knox-escape": { name: "Fort Knox Escape", path: "E-Summit", page: "esummit.html", team: "Teams of 4", min: 4, max: 4, blurb: "Solve business cases, then escape the room before the clock runs out." },
    "make-and-sell": { name: "Make & Sell", path: "E-Summit", page: "esummit.html", team: "Teams of 4–5", min: 4, max: 5, blurb: "Build an MVP, run a stall, and win pre-orders from real customers." },
    "trade-tremors": { name: "Trade Tremors", path: "E-Summit", page: "esummit.html", team: "Teams of up to 5", min: 1, max: 5, blurb: "Run a trading firm through real-time market shifts and crises." },
    "code-decode": { name: "Code Decode", path: "Techfest", page: "techfest.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Solve puzzles, write code, and crack the vault before it seals forever." },
    "frontier-1": { name: "Frontier-1", path: "Techfest", page: "techfest.html", team: "Teams of 3–4", min: 3, max: 4, blurb: "Guide a blindfolded driver across an illuminated track with your voice." },
    "crossfire": { name: "The Crossfire", path: "Techfest", page: "techfest.html", team: "Teams of 5–6", min: 5, max: 6, blurb: "The flagship 5v5 VALORANT tournament, group stage to grand final." },
    "survivor": { name: "Survivor", path: "Techfest", page: "techfest.html", team: "Teams of 4", min: 4, max: 4, blurb: "Negotiate, adapt, and present your strategy after the heist goes wrong." },
    "science-vault": { name: "Science Vault", path: "Techfest", page: "techfest.html", team: "Teams of 2–4", min: 2, max: 4, blurb: "Build a working prototype and win visitor votes at your stall." }
  };

  document.documentElement.classList.add("js");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("scrollProgress");
  var menuBtn = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (progress) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mobileNav.classList.toggle("is-open", !open);
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
      }
    });
  }

  var portal = document.getElementById("portal");
  if (portal && !reduce) {
    document.body.classList.add("is-portal-lock");
    window.setTimeout(function () {
      document.body.classList.remove("is-portal-lock");
    }, 2600);
  }

  function initReveal() {
    var revealEls = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  if (portal && !reduce) {
    window.setTimeout(initReveal, 2000);
  } else {
    initReveal();
  }

  var crumb = document.getElementById("youAreHere");
  if (crumb) {
    function renderCrumb() {
      var box = document.body.getAttribute("data-crumbbox");
      var here = document.body.getAttribute("data-crumb") || "INNOVERSE";
      var html = '<span class="yah-mark" aria-hidden="true">&#9679;</span>';
      if (box) {
        var parts = box.split(",");
        parts.forEach(function (p, i) {
          var name = p.trim();
          if (i === parts.length - 1) {
            html += ' <span class="yah-here">' + name + "</span>";
          } else {
            html += ' <a href="index.html">' + name + "</a>";
          }
          if (i < parts.length - 1) html += ' <span class="yah-sep" aria-hidden="true">/</span>';
        });
      } else {
        html += ' <span class="yah-here">' + here + "</span>";
      }
      var match = window.INNOVERSE_EVENTS[location.hash.replace("#", "")];
      if (match) {
        html += ' <span class="yah-sep" aria-hidden="true">/</span> <span class="yah-here">' + match.name + "</span>";
      }
      crumb.innerHTML = html;
    }
    renderCrumb();
    window.addEventListener("hashchange", renderCrumb);
  }
})();
