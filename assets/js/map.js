(function () {
  "use strict";

  var EVENTS = window.INNOVERSE_EVENTS || {};
  var routes = document.querySelectorAll("[data-route]");
  if (!routes.length) return;

  var order = {
    esummit: ["brand-reboot", "pitch-arena", "fort-knox-escape", "make-and-sell", "trade-tremors"],
    techfest: ["code-decode", "frontier-1", "crossfire", "survivor", "science-vault"]
  };

  var info = document.getElementById("mapInfo");
  var title = document.getElementById("miTitle");
  var body = document.getElementById("miBody");
  var team = document.getElementById("miTeam");
  var explore = document.getElementById("miExplore");
  var register = document.getElementById("miRegister");
  var nodes = [];

  routes.forEach(function (ol) {
    var lane = ol.getAttribute("data-route");
    order[lane].forEach(function (slug, i) {
      var ev = EVENTS[slug];
      if (!ev) return;
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-node";
      btn.setAttribute("data-slug", slug);
      btn.setAttribute("aria-pressed", "false");

      var num = document.createElement("span");
      num.className = "mn-num";
      num.textContent = String(i + 1).padStart(2, "0");

      var name = document.createElement("span");
      name.className = "mn-name";
      name.textContent = ev.name;

      btn.appendChild(num);
      btn.appendChild(name);
      btn.insertAdjacentHTML("beforeend", '<svg class="mn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>');
      li.appendChild(btn);
      ol.appendChild(li);
      nodes.push(btn);
      btn.addEventListener("click", function () { select(slug); });
    });
  });

  function select(slug) {
    var ev = EVENTS[slug];
    if (!ev) return;
    nodes.forEach(function (n) {
      var active = n.getAttribute("data-slug") === slug;
      n.classList.toggle("is-active", active);
      n.setAttribute("aria-pressed", String(active));
    });
    title.textContent = ev.name;
    body.textContent = ev.blurb;
    team.textContent = ev.path + " · " + ev.team;
    explore.href = ev.page + "#" + slug;
    register.href = "https://forms.gle/2wMmQGNTSf1ycA4x6";
    info.hidden = false;
  }

  var filters = document.querySelectorAll(".map-filter");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.classList.toggle("is-active", x === f); });
      var filter = f.getAttribute("data-filter");
      document.querySelectorAll(".map-lane").forEach(function (lane) {
        var laneName = lane.getAttribute("data-lane");
        lane.classList.toggle("is-hidden", !(filter === "all" || laneName === filter));
      });
    });
  });
})();
