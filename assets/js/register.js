(function () {
  "use strict";

  var form = document.getElementById("regForm");
  if (!form) return;

  var EVENTS = window.INNOVERSE_EVENTS || {};
  var screens = form.querySelectorAll(".reg-screen");
  var steps = document.querySelectorAll(".reg-step");
  var current = 1;
  var eventSlug = null;
  var teams = [];

  var teamCount = document.getElementById("f-team-count");
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
    if (n === 3) {
      syncTeamCount();
      showTeamBlocks();
      updateEventStatus();
    }
    if (n === 4) buildReview();
    if (n === 5 && eventSlug && EVENTS[eventSlug]) {
      document.getElementById("completeSub").textContent =
        "Confirm your registration for " + EVENTS[eventSlug].name + " — " + teams.length + " team" + (teams.length === 1 ? "" : "s") + ".";
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

  function teamSizeRangeError(t) {
    if (!eventSlug) return "";
    var ev = EVENTS[eventSlug];
    if (!ev || ev.min == null || ev.max == null) return "";
    var n = teamSizeNumber(t);
    if (n === null) return "Enter the number of members.";
    if (n < ev.min) return "This event needs at least " + ev.min + " members — you entered " + n + ".";
    if (n > ev.max) return "This event allows at most " + ev.max + " members — you entered " + n + ".";
    return "";
  }

  function teamCountNumber() {
    var n = parseInt(teamCount.value, 10);
    return isNaN(n) ? 1 : Math.max(1, Math.min(10, n));
  }

  function makeTeamBlock(i) {
    var div = document.createElement("div");
    div.className = "reg-team-block";
    div.setAttribute("data-index", i);
    div.innerHTML =
      '<p class="rtb-num">Team ' + (i + 1) + '</p>' +
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
    var t = {
      block: div,
      name: div.querySelector('input[id="t' + i + '-name"]'),
      className: div.querySelector('input[id="t' + i + '-class"]'),
      size: div.querySelector('input[id="t' + i + '-size"]'),
      members: div.querySelector('textarea[id="t' + i + '-members"]')
    };
    return t;
  }

  function syncTeamCount() {
    var target = teamCountNumber();
    while (teams.length < target) {
      var t = makeTeamBlock(teams.length);
      teams.push(t);
      teamsContainer.appendChild(t.block);
    }
    while (teams.length > target) {
      var last = teams.pop();
      last.block.parentNode.removeChild(last.block);
    }
  }

  function showTeamBlocks() {
    var hint = document.getElementById("regTeamHint");
    if (!hint) return;
    hint.hidden = !!eventSlug;
    if (teamsContainer) teamsContainer.hidden = !eventSlug;
  }

  function updateEventStatus() {
    var el = document.getElementById("epStatus");
    if (!el) return;
    var ev = eventSlug ? EVENTS[eventSlug] : null;
    if (!ev) {
      el.hidden = true;
      return;
    }
    var rangeTxt = (ev.min === ev.max) ? "a team of " + ev.min
                  : "a team of " + ev.min + "–" + ev.max;
    var base = ev.name + " · " + rangeTxt + ".";
    var bad = null;
    teams.forEach(function (t) {
      var n = teamSizeNumber(t);
      if (n === null) return;
      if (n < ev.min || n > ev.max) bad = bad || { n: n, num: teams.indexOf(t) + 1 };
    });
    if (bad) {
      el.textContent = base + " Team " + bad.num + " has " + bad.n + " members — outside the allowed range. Fix it below.";
      el.classList.add("is-warn");
    } else if (teams.length && teams.every(function (t) { return teamSizeNumber(t) !== null; })) {
      el.textContent = base + " All " + teams.length + " team" + (teams.length === 1 ? "" : "s") + " fit.";
      el.classList.remove("is-warn");
    } else {
      el.textContent = base + " Enter each team's size below.";
      el.classList.remove("is-warn");
    }
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
      var c = parseInt(teamCount.value, 10);
      if (isNaN(c) || c < 1 || c > 10) {
        ok = false;
        setFieldError(teamCount, "Enter a number between 1 and 10.");
      } else {
        setFieldError(teamCount, "");
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
      var sel = form.querySelector('input[name="event"]:checked');
      if (!sel) {
        ok = false;
        var groups = document.querySelectorAll(".event-picker-group");
        groups.forEach(function (g) {
          var err = g.querySelector(".field-error");
          if (!err) {
            var e = document.createElement("p");
            e.className = "field-error";
            e.textContent = "Choose the event you're registering for.";
            g.appendChild(e);
          }
        });
      } else {
        document.querySelectorAll(".event-picker-group .field-error").forEach(function (e) { e.remove(); });
      }
      syncTeamCount();
      teams.forEach(function (t) {
        ok = validateTeam(t) && ok;
      });
    }
    return ok;
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

  if (teamCount) {
    teamCount.addEventListener("change", function () {
      setFieldError(teamCount, "");
      if (current === 3) {
        syncTeamCount();
        updateEventStatus();
      }
    });
  }

  form.addEventListener("change", function (e) {
    if (e.target && e.target.name === "event" && e.target.checked) {
      eventSlug = e.target.value;
      document.querySelectorAll(".event-picker-group .field-error").forEach(function (x) { x.remove(); });
      showTeamBlocks();
      updateEventStatus();
    }
  });

  if (teamsContainer) {
    teamsContainer.addEventListener("input", function (e) {
      var t = e.target.closest ? e.target.closest(".reg-team-block") : null;
      if (!t) return;
      if (e.target.name && e.target.name !== "teamSize") return;
      if (eventSlug) updateEventStatus();
    });
  }

  var picked = new URLSearchParams(location.search).get("event");
  if (picked && EVENTS[picked]) {
    eventSlug = picked;
    var input = form.querySelector('input[name="event"][value="' + picked + '"]');
    if (input) input.checked = true;
  }

  syncTeamCount();
  showTeamBlocks();

  function buildReview() {
    var list = document.getElementById("reviewList");
    var ev = eventSlug ? EVENTS[eventSlug] : null;
    var html = "";

    html += '<ul class="reg-review">';
    html += row("School", fields.school.value.trim());
    html += row("City", fields.city.value.trim());
    html += row("Escort teacher", fields.escort.value.trim());
    html += row("Mentor email", fields.email.value.trim());
    html += row("Mentor phone", fields.phone.value.trim());
    html += row("Event", ev ? escapeHtml(ev.name) + " · " + ev.path : "Not selected");
    html += "</ul>";

    syncTeamCount();
    teams.forEach(function (t, i) {
      html += '<div class="review-team">';
      html += '<p class="rtb-num">Team ' + (i + 1) + "</p>";
      html += "<ul class=\"reg-review\">";
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
      return Promise.all(payloads.map(function (p) {
        return fetch(SUBMIT_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(p)
        });
      })).then(function () {
        return { ok: true };
      });
    }
    return new Promise(function (resolve) {
      setTimeout(function () { resolve({ demo: true }); }, 900);
    });
  }

  function buildPayloads() {
    var ev = eventSlug ? EVENTS[eventSlug] : null;
    syncTeamCount();
    return teams.map(function (t) {
      return {
        event: eventSlug,
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
        var ev = EVENTS[eventSlug];
        var n = teams.length;
        document.getElementById("suSub").textContent =
          "Your registration for " + ev.name + " is recorded — " + n + " team" + (n === 1 ? "" : "s") + " submitted. Here is what you sent.";
        var list = document.getElementById("suList");
        var html = "";
        teams.forEach(function (t, i) {
          html += '<div class="su-team">';
          html += "<p>" + escapeHtml(t.name.value.trim() || "Team " + (i + 1)) + "</p>";
          html += "<ul>";
          html += "<li><span>Event</span><span>" + escapeHtml(ev.name) + " · " + ev.path + "</span></li>";
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
