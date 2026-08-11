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
  var reviewList = document.getElementById("reviewList");
  var completeSub = document.getElementById("completeSub");
  var regSubmit = document.getElementById("regSubmit");
  var su = document.getElementById("regSuccess");
  var suSub = document.getElementById("suSub");
  var suList = document.getElementById("suList");
  var fAgree = document.getElementById("f-agree");

  var fields = {
    school: document.getElementById("f-school"),
    city: document.getElementById("f-city"),
    escort: document.getElementById("f-escort"),
    escortPhone: document.getElementById("f-escort-phone")
  };

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    if (n === 5) completeSub.textContent = completeLine();
  }

  function setFieldError(field, msg) {
    var wrap = field ? field.closest(".field") : null;
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
      setFieldError(field, "Enter a valid phone number (10 to 15 digits).");
      return false;
    }
    setFieldError(field, "");
    return true;
  }

  function teamSizeNumber(t) {
    var n = parseInt(t.size ? t.size.value : "", 10);
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
    if (n < ev.min) return "This event needs at least " + ev.min + " members (you entered " + n + ").";
    if (n > ev.max) return "This event allows at most " + ev.max + " members (you entered " + n + ").";
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
          ? "1 event selected, that's 1 team"
          : n + " events selected, that's " + n + " teams";
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
        '<div class="field"><label for="t' + i + '-size">Number of members <span class="req">*</span></label>' +
          '<input id="t' + i + '-size" type="number" min="1" max="10" step="1" required></div>' +
      '</div>' +
      '<div class="member-rows" aria-label="Members"></div>';
    return {
      block: div,
      slug: slug,
      name: div.querySelector('input[id="t' + i + '-name"]'),
      size: div.querySelector('input[id="t' + i + '-size"]'),
      hint: div.querySelector(".rtb-event-hint"),
      rows: div.querySelector(".member-rows")
    };
  }

  function syncMembers(t) {
    if (!t.rows) return;
    var count = teamSizeNumber(t);
    if (count === null || count < 1) count = t.rows.querySelectorAll(".member-row").length || 1;
    if (count > 10) count = 10;
    var old = [];
    Array.prototype.forEach.call(t.rows.querySelectorAll(".member-row"), function (r) {
      old.push({
        name: r.querySelector(".m-name").value,
        cls: r.querySelector(".m-class").value
      });
    });
    var html = "";
    for (var k = 0; k < count; k++) {
      var v = old[k] || { name: "", cls: "" };
      html += '<div class="member-row">' +
        '<span class="m-label">Member ' + (k + 1) + '</span>' +
        '<div class="field"><label>Member ' + (k + 1) + ' name</label>' +
          '<input class="m-name" type="text" autocomplete="off" value="' + escapeAttr(v.name) + '"></div>' +
        '<div class="field"><label>Member ' + (k + 1) + ' class</label>' +
          '<input class="m-class" type="text" autocomplete="off" value="' + escapeAttr(v.cls) + '"></div>' +
      '</div>';
    }
    t.rows.innerHTML = html;
  }

  function memberValues(t) {
    if (!t.rows) return [];
    var arr = [];
    Array.prototype.forEach.call(t.rows.querySelectorAll(".member-row"), function (r) {
      arr.push({
        name: r.querySelector(".m-name").value.trim(),
        cls: r.querySelector(".m-class").value.trim()
      });
    });
    return arr;
  }

  function membersText(t) {
    return memberValues(t).map(function (m) {
      return m.name + (m.cls ? " · " + m.cls : "");
    }).join("\n");
  }

  function copyTeamValues(from, to) {
    to.name.value = from.name.value;
    to.size.value = from.size.value;
    syncMembers(to);
    var vals = memberValues(from);
    var rows = to.rows.querySelectorAll(".member-row");
    Array.prototype.forEach.call(rows, function (r, i) {
      var v = vals[i] || { name: "", cls: "" };
      r.querySelector(".m-name").value = v.name;
      r.querySelector(".m-class").value = v.cls;
    });
  }

  function syncTeams() {
    var keep = {};
    teams.forEach(function (t) { keep[t.slug] = t; });
    teams = [];
    teamsContainer.innerHTML = "";
    selected.forEach(function (slug, i) {
      var t = makeTeamBlock(i, slug);
      if (keep[slug]) copyTeamValues(keep[slug], t);
      else syncMembers(t);
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
                  : "a team of " + ev.min + " to " + ev.max;
    var msg = ev.name + " · " + ev.team + ".";
    var n = teamSizeNumber(t);
    if (n !== null && (n < ev.min || n > ev.max)) {
      msg += " Your team has " + n + ", but this event needs " + rangeTxt + ".";
      el.classList.add("is-warn");
    } else {
      el.classList.remove("is-warn");
    }
    el.textContent = msg;
    el.hidden = false;
  }

  function validateTeam(t) {
    var ok = checkText(t.name, false, "");
    var n = teamSizeNumber(t);
    if (n === null) {
      ok = false;
      setFieldError(t.size, "Enter the number of members.");
    } else if (n < 1 || n > 10) {
      ok = false;
      setFieldError(t.size, "Team size must be a number between 1 and 10.");
    } else {
      setFieldError(t.size, "");
    }
    var te = teamSizeRangeError(t);
    if (te) {
      ok = false;
      setFieldError(t.size, te);
    }
    syncMembers(t);
    memberValues(t).forEach(function (m, i) {
      var input = t.rows.querySelectorAll(".member-row")[i].querySelector(".m-name");
      if (!m.name) {
        ok = false;
        setFieldError(input, "Enter the name for member " + (i + 1) + ".");
      } else {
        setFieldError(input, "");
      }
    });
    updateTeamHint(t);
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
    }
    if (n === 3) {
      syncTeams();
      teams.forEach(function (t) {
        ok = validateTeam(t) && ok;
      });
    }
    return ok;
  }

  function updateMention() {
    if (!pickMention) return;
    var n = selected.length;
    pickMention.innerHTML = n === 1
      ? "You picked <b>1 event</b>. The next step has a form for your team."
      : "You picked <b>" + n + " events</b>. The next step has a form for each team.";
  }

  function completeLine() {
    var n = teams.length;
    if (n === 1) {
      var ev = teams[0] ? teamEventData(teams[0]) : null;
      return ev ? "Confirm your registration: 1 team for " + ev.name + "." : "Confirm your registration: 1 team.";
    }
    return "Confirm your registration: " + n + " teams across the " + n + " events you chose.";
  }

  function buildReview() {
    var html = "";
    html += '<ul class="reg-review">';
    html += row("School", fields.school.value.trim());
    html += row("City", fields.city.value.trim());
    html += row("Escort teacher", fields.escort.value.trim());
    html += row("Escort teacher phone", fields.escortPhone.value.trim());
    html += "</ul>";

    syncTeams();
    teams.forEach(function (t, i) {
      var ev = teamEventData(t);
      html += '<div class="review-team">';
      html += '<p class="rtb-num">Team ' + (i + 1) + "</p>";
      html += "<ul class=\"reg-review\">";
      html += row("Event", ev ? escapeHtml(ev.name) + " · " + ev.path : "");
      html += row("Team name", t.name.value.trim());
      html += row("Team size", t.size.value.trim() || "-");
      html += row("Members", membersText(t));
      html += "</ul></div>";
    });

    reviewList.innerHTML = html;
  }

  function row(label, value) {
    if (!value) return "";
    return '<li><span class="rr-label">' + label + '</span><span class="rr-value">' + escapeHtml(value) + "</span></li>";
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
        className: "",
        teamName: t.name.value.trim(),
        teamSize: t.size.value.trim(),
        members: membersText(t)
      };
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!fAgree.checked) {
      fAgree.focus();
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
    var btn = regSubmit;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Submitting…';
    submitRegistration(buildPayloads())
      .then(function () {
        form.hidden = true;
        var n = teams.length;
        suSub.textContent =
          "Your registration is recorded: " + n + " team" + (n === 1 ? "" : "s") + " submitted. Here is what you sent.";
        var html = "";
        teams.forEach(function (t, i) {
          var ev = teamEventData(t);
          html += '<div class="su-team">';
          html += "<p>" + escapeHtml(t.name.value.trim() || "Team " + (i + 1)) + "</p>";
          html += "<ul>";
          html += "<li><span>Event</span><span>" + escapeHtml(ev ? ev.name + " · " + ev.path : "-") + "</span></li>";
          html += "<li><span>Team size</span><span>" + escapeHtml(t.size.value.trim()) + "</span></li>";
          html += "<li><span>Members</span><span>" + escapeHtml(membersText(t)) + "</span></li>";
          html += "</ul></div>";
        });
        suList.innerHTML = html;
        su.hidden = false;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Register for Innoverse";
        alert("Submission failed. Please try again or contact Innoverse directly.");
      });
  });

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
      if (e.target === t.size) {
        syncMembers(t);
        updateTeamHint(t);
      }
    });
  }

  renderPicker();
  var picked = new URLSearchParams(location.search).get("event");
  if (picked && EVENTS[picked]) {
    var chk = picker.querySelector('.ev-check[value="' + picked + '"]');
    if (chk) chk.checked = true;
  }
  refreshSelected();
})();
