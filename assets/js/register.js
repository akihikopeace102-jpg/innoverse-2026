(function () {
  "use strict";

  var form = document.getElementById("regForm");
  if (!form) return;

  var EVENTS = window.INNOVERSE_EVENTS || {};
  var screens = form.querySelectorAll(".reg-screen");
  var steps = document.querySelectorAll(".reg-step");
  var current = 1;
  var teams = [];
  var selected = [];

  var picker = document.getElementById("eventPicker");
  var evCount = document.getElementById("evCount");
  var evError = document.getElementById("evError");
  var pickMention = document.getElementById("pickMention");
  var teamsContainer = document.getElementById("teamsContainer");

  var fields = {
    school: document.getElementById("f-school"),
    city: document.getElementById("f-city"),
    escort: document.getElementById("f-escort"),
    escortPhone: document.getElementById("f-escort-phone"),
    email: document.getElementById("f-email"),
    phone: document.getElementById("f-phone")
  };

  function go(n) {
    if (n < 1 || n > 5) return;
    current = n;
    screens.forEach(function (s) {
      s.classList.toggle("is-active", +s.getAttribute("data-step") === n);
    });
    steps.forEach(function (st, i) {
      var num = i + 1;
      st.classList.toggle("is-here", num === n);
      st.classList.toggle("is-done", num < n);
    });
    if (n === 2) updateMention();
    if (n === 3) syncTeams();
    if (n === 4) buildReview();
    if (n === 5) {
      document.getElementById("completeSub").textContent = completeLine();
    }
  }

  function setFieldError(field, msg) {
    var wrap = field.closest(".field");
    if (!wrap) return;
    var err = wrap.querySelector(".field-error");
    if (msg) {
      wrap.classList.add("is-invalid");
      if (!err) {
        var e = document.createElement("p");
        e.className = "field-error";
        e.textContent = msg;
        wrap.appendChild(e);
      }
    } else {
      wrap.classList.remove("is-invalid");
      if (err) err.remove();
    }
  }

  function checkRequired(field, msg) {
    if (!field.value.trim()) {
      setFieldError(field, msg);
      return false;
    }
    setFieldError(field, "");
    return true;
  }

  function checkText(field, required, msg) {
    var v = field.value.trim();
    if (!v) {
      if (required) {
        setFieldError(field, msg);
        return false;
      }
      setFieldError(field, "");
      return true;
    }
    if (!/[^\d\s]/.test(v)) {
      setFieldError(field, "This field can't contain only numbers or spaces.");
      return false;
    }
    setFieldError(field, "");
    return true;
  }

  function checkPhone(field, required, msg) {
    var v = field.value.trim().replace(/[\s\-().]/g, "");
    if (!v) {
      if (required) {
        setFieldError(field, msg);
        return false;
      }
      setFieldError(field, "");
      return true;
    }
    if (!/^\+?\d{10,15}$/.test(v)) {
      setFieldError(field, "Enter a valid phone number (10–15 digits).");
      return false;
    }
    setFieldError(field, "");
    return true;
  }

  function checkEmail(field, required, msg) {
    var v = field.value.trim();
    if (!v) {
      if (required) {
        setFieldError(field, msg);
        return false;
      }
      setFieldError(field, "");
      return true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setFieldError(field, "Enter a valid email address.");
      return false;
    }
    setFieldError(field, "");
    return true;
  }

  function teamSizeNumber(t) {
    var n = parseInt(t.size.value, 10);
    return isNaN(n) ? null : n;
  }

  function teamEventData(t) {
    return t.slug && EVENTS[t.slug] ? EVENTS[t.slug] : null;
  }

  function teamSizeRangeError(t) {
    var ev = teamEventData(t);
    if (!ev || ev.min == null || ev.max == null) return "";
    var n = teamSizeNumber(t);
    if (n === null) return "Enter the number of members.";
    if (n < ev.min) return "This event needs at least " + ev.min + " members — you entered " + n + ".";
    if (n > ev.max) return "This event allows at most " + ev.max + " members — you entered " + n + ".";
    return "";
  }

  function eventCard(slug) {
    var ev = EVENTS[slug];
    if (!ev) return "";
    var id = "ev-" + slug;
    return '<div class="ev-card" data-slug="' + slug + '">' +
      '<input type="checkbox" class="ev-check" id="' + id + '" value="' + slug + '">' +
      '<label class="ev-card-body" for="' + id + '">' +
        '<span class="ev-tick" aria-hidden="true"></span>' +
        '<span class="ev-main">' +
          '<span class="ev-name">' + escapeHtml(ev.name) + '</span>' +
          '<span class="ev-team">' + escapeHtml(ev.team) + '</span>' +
        '</span>' +
        '<span class="ev-blurb">' + escapeHtml(ev.blurb) + '</span>' +
      '</label>' +
      '<a class="ev-more" href="' + ev.page + '#' + slug + '" target="_blank" rel="noopener">Event details &#8599;</a>' +
    '</div>';
  }

  function renderPicker() {
    var html = "";
    ["E-Summit", "Techfest"].forEach(function (p) {
      var slugs = Object.keys(EVENTS).filter(function (s) { return EVENTS[s].path === p; });
      if (!slugs.length) return;
      html += '<div class="ev-group">';
      html += '<p class="ev-group-label">' + p + "</p>";
      html += '<div class="ev-grid">';
      slugs.forEach(function (s) { html += eventCard(s); });
      html += "</div></div>";
    });
    picker.innerHTML = html;
  }

  function refreshSelected() {
    selected = [];
    var checks = picker.querySelectorAll(".ev-check:checked");
    Array.prototype.forEach.call(checks, function (c) { selected.push(c.value); });
    var cards = picker.querySelectorAll(".ev-card");
    Array.prototype.forEach.call(cards, function (c) {
      c.classList.toggle("is-on", c.querySelector(".ev-check").checked);
    });
    var n = selected.length;
    if (evCount) {
      if (n > 0) {
        evCount.hidden = false;
        evCount.textContent = n === 1
          ? "1 event selected · that's 1 team"
          : n + " events selected · that's " + n + " teams";
      } else {
        evCount.hidden = true;
      }
    }
    if (evError) evError.hidden = true;
    if (pickMention) updateMention();
    if (current === 3) syncTeams();
  }

  function makeTeamBlock(i, slug) {
    var ev = EVENTS[slug];
    var div = document.createElement("div");
    div.className = "reg-team-block";
    div.setAttribute("data-index", i);
    div.setAttribute("data-event", slug);
    div.innerHTML =
      '<p class="rtb-num">Team ' + (i + 1) + '</p>' +
      '<div class="rtb-event">' +
        '<span class="rtb-event-name">' + escapeHtml(ev ? ev.name : slug) + '</span>' +
        '<span class="rtb-event-path">' + escapeHtml(ev ? ev.path : "") + '</span>' +
        (ev ? '<a class="rtb-event-link" href="' + ev.page + '#' + slug + '" target="_blank" rel="noopener">Event details &#8599;</a>' : "") +
      '</div>' +
      '<p class="rtb-event-hint" hidden></p>' +
      '<div class="field-grid">' +
        '<div class="field"><label for="t' + i + '-name">Team name</label>' +
          '<input id="t' + i + '-name" type="text" autocomplete="off"></div>' +
        '<div class="field"><label for="t' + i + '-class">Class / Grade</label>' +
          '<input id="t' + i + '-class" type="text" autocomplete="off"></div>' +
      '</div>' +
      '<div class="field-grid">' +
        '<div class="field"><label for="t' + i + '-size">Number of members <span class="req">*</span></label>' +
          '<input id="t' + i + '-size" type="number" min="1" max="10" step="1" required></div>' +
        '<div class="field"><label for="t' + i + '-members">Member names</label>' +
          '<textarea id="t' + i + '-members" placeholder="One name per line." autocomplete="off"></textarea></div>' +
      '</div>';
    return {
      block: div,
      slug: slug,
      name: div.querySelector('input[id="t' + i + '-name"]'),
      className: div.querySelector('input[id="t' + i + '-class"]'),
      size: div.querySelector('input[id="t' + i + '-size"]'),
      members: div.querySelector('textarea[id="t' + i + '-members"]'),
      hint: div.querySelector(".rtb-event-hint")
    };
  }

  function copyTeamValues(from, to) {
    to.name.value = from.name.value;
    to.className.value = from.className.value;
    to.size.value = from.size.value;
    to.members.value = from.members.value;
  }

  function syncTeams() {
    var keep = {};
    teams.forEach(function (t) { keep[t.slug] = t; });
    teams = [];
    teamsContainer.innerHTML = "";
    selected.forEach(function (slug, i) {
      var t = makeTeamBlock(i, slug);
      if (keep[slug]) copyTeamValues(keep[slug], t);
      teams.push(t);
      teamsContainer.appendChild(t.block);
      updateTeamHint(t);
    });
  }

  function updateTeamHint(t) {
    var el = t.hint;
    if (!el) return;
    var ev = teamEventData(t);
    if (!ev) {
      el.hidden = true;
      return;
    }
    var rangeTxt = (ev.min === ev.max) ? "a team of " + ev.min
                  : "a team of " + ev.min + "–" + ev.max;
    var msg = ev.name + " · " + ev.team + ".";
    var n = teamSizeNumber(t);
    if (n !== null && (n < ev.min || n > ev.max)) {
      msg += " Your team has " + n + " — this event needs " + rangeTxt + ".";
      el.classList.add("is-warn");
    } else {
      el.classList.remove("is-warn");
    }
    el.textContent = msg;
    el.hidden = false;
  }

  function validateTeam(t) {
    var ok = checkText(t.name, false, "") && checkText(t.className, false, "");
    ok = checkRequired(t.size, "Enter the number of members.") && ok;
    var n = teamSizeNumber(t);
    if (n !== null && (n < 1 || n > 10)) {
      ok = false;
      setFieldError(t.size, "Team size must be a number between 1 and 10.");
    }
    var te = teamSizeRangeError(t);
    if (te) {
      ok = false;
      setFieldError(t.size, te);
    }
    ok = checkText(t.members, false, "") && ok;
    return ok;
  }

  function validate(n) {
    var ok = true;
    if (n === 1) {
      if (!selected.length) {
        ok = false;
        if (evError) evError.hidden = false;
      } else if (evError) {
        evError.hidden = true;
      }
    }
    if (n === 2) {
      ok = checkText(fields.school, true, "Enter your school name.") && ok;
      ok = checkText(fields.city, false, "") && ok;
      ok = checkText(fields.escort, false, "") && ok;
      ok = checkPhone(fields.escortPhone, false, "") && ok;
      ok = checkEmail(fields.email, false, "") && ok;
      ok = checkPhone(fields.phone, false, "") && ok;
    }
    if (n === 3) {
      syncTeams();
      teams.forEach(function (t) {
        ok = validateTeam(t) && ok;
        updateTeamHint(t);
      });
    }
    return ok;
  }

  function updateMention() {
    if (!pickMention) return;
    var n = selected.length;
    pickMention.innerHTML = n === 1
      ? "You picked <b>1 event</b> — the next step has a form for your team."
      : "You picked <b>" + n + " events</b> — the next step has a form for each team.";
  }

  function completeLine() {
    var n = teams.length;
    if (n === 1) {
      var ev = teams[0] ? teamEventData(teams[0]) : null;
      return ev ? "Confirm your registration — 1 team for " + ev.name + "." : "Confirm your registration — 1 team.";
    }
    return "Confirm your registration — " + n + " teams across the " + n + " events you chose.";
  }

  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      var target = +b.getAttribute("data-go");
      if (target > current && !validate(current)) return;
      go(target);
    });
  });

  document.getElementById("goComplete").addEventListener("click", function () {
    if (!validate(3)) {
      go(3);
      return;
    }
    go(5);
  });

  if (picker) {
    picker.addEventListener("change", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("ev-check")) {
        refreshSelected();
      }
    });
  }

  if (teamsContainer) {
    teamsContainer.addEventListener("input", function (e) {
      var block = e.target.closest ? e.target.closest(".reg-team-block") : null;
      if (!block) return;
      var t = teams[+block.getAttribute("data-index")];
      if (!t) return;
      if (e.target === t.size) updateTeamHint(t);
    });
  }

  renderPicker();
  var picked = new URLSearchParams(location.search).get("event");
  if (picked && EVENTS[picked]) {
    var chk = picker.querySelector('.ev-check[value="' + picked + '"]');
    if (chk) chk.checked = true;
  }
  refreshSelected();

  function buildReview() {
    var list = document.getElementById("reviewList");
    var html = "";

    html += '<ul class="reg-review">';
    html += row("School", fields.school.value.trim());
    html += row("City", fields.city.value.trim());
    html += row("Escort teacher", fields.escort.value.trim());
    html += row("Mentor email", fields.email.value.trim());
    html += row("Mentor phone", fields.phone.value.trim());
    html += "</ul>";

    syncTeams();
    teams.forEach(function (t, i) {
      var ev = teamEventData(t);
      html += '<div class="review-team">';
      html += '<p class="rtb-num">Team ' + (i + 1) + "</p>";
      html += "<ul class=\"reg-review\">";
      html += row("Event", ev ? escapeHtml(ev.name) + " · " + ev.path : "");
      html += row("Team name", t.name.value.trim());
      html += row("Class / Grade", t.className.value.trim());
      html += row("Team size", t.size.value.trim() || "—");
      html += row("Members", t.members.value.trim());
      html += "</ul></div>";
    });

    list.innerHTML = html;
  }

  function row(label, value) {
    if (!value) return "";
    return '<li><span class="rr-label">' + label + '</span><span class="rr-value">' + escapeHtml(value) + "</span></li>";
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var SUBMIT_ENDPOINT = "https://script.google.com/macros/s/AKfycby43xuv-KKuSQ7N8wOijv8wxwq1SMPu-1ToZ9_M_FMCVPP7HX5ypeD3049F5F6Nkefa/exec";

  function submitRegistration(payloads) {
    if (SUBMIT_ENDPOINT) {
      return fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ teams: payloads })
      }).then(function () {
        return { ok: true };
      });
    }
    return new Promise(function (resolve) {
      setTimeout(function () { resolve({ demo: true }); }, 900);
    });
  }

  function buildPayloads() {
    syncTeams();
    return teams.map(function (t) {
      var ev = teamEventData(t);
      return {
        event: t.slug,
        eventName: ev ? ev.name : "",
        path: ev ? ev.path : "",
        school: fields.school.value.trim(),
        city: fields.city.value.trim(),
        escort: fields.escort.value.trim(),
        escortPhone: fields.escortPhone.value.trim(),
        participant: "",
        className: t.className.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value.trim(),
        teamName: t.name.value.trim(),
        teamSize: t.size.value.trim(),
        members: t.members.value.trim()
      };
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var agree = document.getElementById("f-agree");
    if (!agree.checked) {
      agree.focus();
      return;
    }
    var step = 1;
    if (!validate(1)) { step = 1; }
    else if (!validate(2)) { step = 2; }
    else if (!validate(3)) { step = 3; }
    else { step = 0; }
    if (step) {
      go(step);
      return;
    }
    var btn = document.getElementById("regSubmit");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Submitting…';
    submitRegistration(buildPayloads())
      .then(function () {
        form.hidden = true;
        var su = document.getElementById("regSuccess");
        var n = teams.length;
        document.getElementById("suSub").textContent =
          "Your registration is recorded — " + n + " team" + (n === 1 ? "" : "s") + " submitted. Here is what you sent.";
        var list = document.getElementById("suList");
        var html = "";
        teams.forEach(function (t, i) {
          var ev = teamEventData(t);
          html += '<div class="su-team">';
          html += "<p>" + escapeHtml(t.name.value.trim() || "Team " + (i + 1)) + "</p>";
          html += "<ul>";
          html += "<li><span>Event</span><span>" + escapeHtml(ev ? ev.name + " · " + ev.path : "—") + "</span></li>";
          html += "<li><span>Class / Grade</span><span>" + escapeHtml(t.className.value.trim() || "—") + "</span></li>";
          html += "<li><span>Team size</span><span>" + escapeHtml(t.size.value.trim()) + "</span></li>";
          html += "</ul></div>";
        });
        list.innerHTML = html;
        su.hidden = false;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Register for Innoverse";
        alert("Submission failed. Please try again or contact Innoverse directly.");
      });
  });

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
})();
