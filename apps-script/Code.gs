/**
 * INNOVERSE 2026 — Registration backend
 *
 * The site sends ONE batched POST per registration with every team:
 *   { "teams": [ {event, eventName, path, school, ...}, ... ] }
 *
 * Every team is written:
 *   1. Into the main "Registrations" sheet (one batch setValues call), and
 *   2. Into a per-event sheet (named after the event, e.g. "The Brand Reboot")
 *      which is created on first use and auto-fills from the same data.
 *
 * Deploy: Deploy > Manage deployments > (your Web App) > Edit > Version: New
 * The /exec URL stays the same.
 */

var SHEET_NAME = "Registrations";

var HEADERS = [
  "Timestamp", "Event", "Event Name", "Path", "School", "City",
  "Escort Teacher", "Escort Phone", "Participant", "Class", "Email", "Phone",
  "Team Name", "Team Size", "Team Members"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var teams = parseTeams(e);
    if (!teams.length) {
      return respond({ ok: false, error: "empty payload" }, 400);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rows = teams.map(buildRow);

    var main = getSheet_(ss, SHEET_NAME, HEADERS);
    appendRows_(main, rows);

    var byEvent = {};
    teams.forEach(function (t, i) {
      var key = eventSheetName(t);
      (byEvent[key] = byEvent[key] || []).push(rows[i]);
    });
    Object.keys(byEvent).forEach(function (key) {
      var sheet = getSheet_(ss, key, HEADERS);
      appendRows_(sheet, byEvent[key]);
    });

    return respond({ ok: true, count: rows.length, events: Object.keys(byEvent).length });
  } catch (err) {
    return respond({ ok: false, error: String(err) }, 500);
  } finally {
    lock.releaseLock();
  }
}

/** Builds one row aligned to HEADERS. */
function buildRow(t) {
  return [
    new Date(),
    t.event || "",
    t.eventName || "",
    t.path || "",
    t.school || "",
    t.city || "",
    t.escort || "",
    t.escortPhone || "",
    t.participant || "",
    t.className || "",
    t.email || "",
    t.phone || "",
    t.teamName || "",
    t.teamSize || "",
    t.members || ""
  ];
}

/** Sheet name for an event, with characters illegal in sheet names stripped. */
function eventSheetName(t) {
  var name = String(t.eventName || t.event || "Other").trim();
  name = name.replace(/[\\\/\?\*\[\]:]/g, "");
  name = name.replace(/\s+/g, " ").trim();
  return name || "Other";
}

/** Returns the sheet, creating it with a frozen header row if it doesn't exist. */
function getSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Appends rows in a single batch call. */
function appendRows_(sheet, rows) {
  var first = sheet.getLastRow() + 1;
  sheet.getRange(first, 1, rows.length, HEADERS.length).setValues(rows);
}

/**
 * Accepts the new batched format ({teams:[...]}), a raw array, or a single
 * team object (backwards compatible with the old per-team request).
 */
function parseTeams(e) {
  var raw = (e && e.postData && e.postData.contents) || "";
  if (!raw) return [];
  var data = JSON.parse(raw);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.teams)) return data.teams;
  if (data && typeof data === "object") return [data];
  return [];
}

function respond(body, code) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
