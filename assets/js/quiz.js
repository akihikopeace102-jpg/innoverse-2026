(function () {
  "use strict";

  var shell = document.getElementById("quizShell");
  if (!shell) return;

  var EVENTS = window.INNOVERSE_EVENTS || {};

  var QS = [
    { dim: "Business ↔ Technology", text: "Would you rather run the company, or build the product?", lo: "Business", hi: "Technology" },
    { dim: "Build ↔ Strategize", text: "Are you happier making something, or planning something?", lo: "Build", hi: "Strategize" },
    { dim: "Pressure ↔ Preparation", text: "Do you think fastest when it's on the line, or when you've prepared?", lo: "Pressure", hi: "Preparation" },
    { dim: "Solo ↔ Team", text: "Do you do your best work alone, or with a team beside you?", lo: "Solo", hi: "Team" },
    { dim: "Pitch ↔ Execute", text: "Would you rather persuade the room, or finish the job?", lo: "Pitch", hi: "Execute" }
  ];

  var SCORES = {
    "brand-reboot": [-2, 2, 1, 1, -1],
    "pitch-arena": [-2, -1, 1, 1, -2],
    "fort-knox-escape": [-1, -1, -2, 2, 1],
    "make-and-sell": [-1, -2, 1, 1, 2],
    "trade-tremors": [-2, 1, -2, 1, 1],
    "code-decode": [2, 1, -2, 2, 2],
    "frontier-1": [2, 1, -1, 2, 2],
    "crossfire": [2, 0, -2, 2, 2],
    "survivor": [1, 1, -2, 2, 1],
    "science-vault": [1, -2, 1, 1, 2]
  };

  var WHY = {
    "brand-reboot": "The Brand Reboot is where a legacy brand's comeback gets written.",
    "pitch-arena": "Pitch Arena rewards the person who makes an idea believable.",
    "fort-knox-escape": "Fort Knox Escape rewards the team that stays sharp when the clock is loud.",
    "make-and-sell": "Make & Sell is built for people who build it, then sell it.",
    "trade-tremors": "Trade Tremors is a market that rewards nerves and numbers.",
    "code-decode": "Code Decode is a heist for the quick-thinking and code-crazy.",
    "frontier-1": "Frontier-1 turns a blindfold into a team sport.",
    "crossfire": "The Crossfire is five players playing as one.",
    "survivor": "Survivor rewards the team that adapts when the plan collapses.",
    "science-vault": "Science Vault is for builders who want proof something works."
  };

  var phrases = {
    lo: ["business thinking", "building things", "composure under pressure", "solo thinking", "persuasion"],
    hi: ["technology", "strategic thinking", "careful preparation", "team action", "hands-on execution"]
  };

  var el = {
    index: document.getElementById("qIndex"),
    bar: document.getElementById("qBarFill"),
    dim: document.getElementById("qDimension"),
    text: document.getElementById("qText"),
    slider: document.getElementById("qSlider"),
    minLabel: document.getElementById("qMinLabel"),
    maxLabel: document.getElementById("qMaxLabel"),
    active: document.getElementById("qActiveLabel"),
    back: document.getElementById("quizBack"),
    next: document.getElementById("quizNext")
  };

  var answers = [];
  var current = 0;

  function getScreen(name) {
    return shell.querySelector('[data-screen="' + name + '"]');
  }

  function show(name) {
    shell.querySelectorAll(".quiz-screen").forEach(function (s) {
      s.classList.toggle("is-active", s.getAttribute("data-screen") === name);
    });
  }

  function renderQuestion(i) {
    var q = QS[i];
    el.index.textContent = String(i + 1).padStart(2, "0") + " / 05";
    el.bar.style.width = (i / QS.length) * 100 + "%";
    el.dim.textContent = q.dim;
    el.text.textContent = q.text;
    el.minLabel.textContent = q.lo;
    el.maxLabel.textContent = q.hi;
    el.slider.value = typeof answers[i] === "number" ? answers[i] : 0;
    el.back.hidden = i === 0;
    el.next.innerHTML = i === QS.length - 1
      ? 'See my match <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
      : 'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    updateSliderUI();
  }

  function updateSliderUI() {
    var q = QS[current];
    var v = +el.slider.value;
    var pct = ((v + 2) / 4) * 100;
    el.slider.style.background = "linear-gradient(to right, #C1121F 0%, #C1121F " + pct + "%, rgba(242,239,232,0.34) " + pct + "%, rgba(242,239,232,0.34) 100%)";
    if (v === 0) {
      el.active.textContent = "Evenly balanced. You could go either way.";
    } else if (v < 0) {
      el.active.textContent = "You lean toward " + (v === -2 ? "entirely " : "") + q.lo + ".";
    } else {
      el.active.textContent = "You lean toward " + (v === 2 ? "entirely " : "") + q.hi + ".";
    }
  }

  function finish() {
    var best = null;
    var bestScore = Infinity;
    Object.keys(SCORES).forEach(function (slug) {
      var s = SCORES[slug];
      var d = 0;
      for (var i = 0; i < QS.length; i++) d += (s[i] - answers[i]) * (s[i] - answers[i]);
      if (d < bestScore) { bestScore = d; best = slug; }
    });

    var strong = [];
    for (var j = 0; j < QS.length; j++) {
      var av = answers[j];
      if (av !== 0) strong.push({ abs: Math.abs(av), j: j });
    }
    strong.sort(function (a, b) { return b.abs - a.abs; });

    var copy;
    if (!strong.length) {
      copy = "You sit right at the centre of every choice, which means any event could be yours.";
    } else {
      var picks = strong.slice(0, 2).map(function (t) {
        return answers[t.j] < 0 ? phrases.lo[t.j] : phrases.hi[t.j];
      });
      copy = "You lean toward " + picks.join(" and ") + ".";
    }

    var ev = EVENTS[best];
    document.getElementById("rName").textContent = ev.name;
    document.getElementById("rWhy").textContent = copy + " " + WHY[best];
    var meta = document.getElementById("rMeta");
    meta.innerHTML =
      "<span><b>" + ev.path + "</b></span>" +
      "<span>Teams · <b>" + ev.team.replace("Teams of ", "") + "</b></span>" +
      "<span>Free · <b>Yes</b></span>";
    document.getElementById("rDesc").textContent = ev.blurb;
    document.getElementById("rExplore").href = ev.page + "#" + best;
    document.getElementById("rRegister").href = "https://forms.gle/2wMmQGNTSf1ycA4x6";
    show("reveal");
  }

  function restart() {
    answers = [];
    current = 0;
    show("intro");
  }

  document.getElementById("quizStart").addEventListener("click", function () {
    answers = [];
    current = 0;
    renderQuestion(0);
    show("question");
  });

  el.next.addEventListener("click", function () {
    answers[current] = +el.slider.value;
    if (current < QS.length - 1) {
      current++;
      renderQuestion(current);
    } else {
      finish();
    }
  });

  el.back.addEventListener("click", function () {
    answers[current] = +el.slider.value;
    current--;
    renderQuestion(current);
  });

  el.slider.addEventListener("input", updateSliderUI);

  document.getElementById("quizRestart").addEventListener("click", restart);
})();
