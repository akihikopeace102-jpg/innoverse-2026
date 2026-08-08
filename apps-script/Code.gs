/**
 * INNOVERSE 2026 — Registration backend
 *
 * The site now sends ONE batched POST per registration with every team:
 *   { "teams": [ {event, eventName, path, school, ...}, ... ] }
 *
 * All teams are written in a single setValues() call — one batch append
 * instead of one appendRow per team. This is what stops teams from being
 * dropped when a school registers many teams at once.
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
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    var rows = teams.map(function (t) {
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
    });

    var first = sheet.getLastRow() + 1;
    sheet.getRange(first, 1, rows.length, HEADERS.length).setValues(rows);

    return respond({ ok: true, count: rows.length });
  } catch (err) {
    return respond({ ok: false, error: String(err) }, 500);
  } finally {
    lock.releaseLock();
  }
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
