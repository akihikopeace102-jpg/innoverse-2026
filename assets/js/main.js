(function () {
  "use strict";

  window.INNOVERSE_EVENTS = {
    "brand-reboot": { name: "The Brand Reboot", path: "E-Summit", page: "esummit.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Acquire a discontinued brand, reinvent its product, and pitch its comeback." },
    "pitch-arena": { name: "Pitch Arena", path: "E-Summit", page: "esummit.html", team: "Teams of up to 4", min: 1, max: 4, blurb: "Spot a real problem, build a solution, and pitch it in 5–7 minutes." },
    "fort-knox-escape": { name: "Fort Knox Escape", path: "E-Summit", page: "esummit.html", team: "Teams of 4", min: 4, max: 4, blurb: "Solve a business mystery, then escape the room before time runs out." },
    "make-and-sell": { name: "Make & Sell", path: "E-Summit", page: "esummit.html", team: "Teams of 4–5", min: 4, max: 5, blurb: "Build a prototype, brand it, pitch it, then sell it at a live marketplace." },
    "trade-tremors": { name: "Trade Tremors", path: "E-Summit", page: "esummit.html", team: "Teams of up to 5", min: 1, max: 5, blurb: "Run a trading firm through real-time market shifts, crises, and recoveries." },
    "code-decode": { name: "Code Decode", path: "Techfest", page: "techfest.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Become an elite heist crew: code, engineer, and crack the vault before time runs out." },
    "frontier-1": { name: "Frontier-1", path: "Techfest", page: "techfest.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Blindfolded driver, one navigator; steer your robot through the final heist." },
    "crossfire": { name: "The Crossfire", path: "Techfest", page: "techfest.html", team: "Teams of 5", min: 5, max: 5, blurb: "5v5 VALORANT esports: group stages, knockouts, and a best-of-3 grand final." },
    "survivor": { name: "Survivor", path: "Techfest", page: "techfest.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Stakeholder teams manage a live crisis; negotiate, adapt, and investigate." },
    "science-vault": { name: "Science Vault", path: "Techfest", page: "techfest.html", team: "Teams of 3–5", min: 3, max: 5, blurb: "Design, build, and present a working physical prototype and earn visitor tokens too." }
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

  var countdown = document.getElementById("countdown");
  if (countdown) {
    var TARGET = new Date("2026-09-28T09:30:00+05:30").getTime();
    var cdEl = {
      d: document.getElementById("cd-days"),
      h: document.getElementById("cd-hours"),
      m: document.getElementById("cd-min"),
      s: document.getElementById("cd-sec")
    };
    function pad2(n) { return n < 10 ? "0" + n : "" + n; }
    function tick() {
      var diff = TARGET - Date.now();
      if (diff <= 0) {
        cdEl.d.textContent = cdEl.h.textContent = cdEl.m.textContent = cdEl.s.textContent = "00";
        return;
      }
      cdEl.d.textContent = pad2(Math.floor(diff / 864e5));
      cdEl.h.textContent = pad2(Math.floor(diff % 864e5 / 36e5));
      cdEl.m.textContent = pad2(Math.floor(diff % 36e5 / 6e4));
      cdEl.s.textContent = pad2(Math.floor(diff % 6e4 / 1e3));
    }
    tick();
    window.setInterval(tick, 1000);
  }
})();
