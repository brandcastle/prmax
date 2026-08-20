/**
 * PR Max — Google Sheet mirror
 *
 * Paste this into your Sheet: Extensions → Apps Script, replace everything,
 * save, then Deploy → New deployment → Web app:
 *     Execute as:  Me
 *     Who has access:  Anyone
 * Copy the /exec URL it gives you into PR Max → Setup → Google Sheet.
 *
 * "Anyone" is required because the app sends a plain request with no Google
 * login. What protects your data instead:
 *   1. There is no doGet and no function that returns rows. The URL cannot be
 *      used to read your training log, only to write.
 *   2. Every request must carry the shared secret. Without it, nothing happens.
 *   3. The Sheet itself stays private to your Google account.
 *
 * SETUP: edit setSecret() below to your own long random string, run it once from
 * the editor (Run -> setSecret), then blank the string back out and save. The
 * secret lives in Script Properties, not in this file, so sharing this project
 * never hands it over. Put the same string into PR Max -> Setup -> Google Sheet.
 *
 * NEVER set the Sheet itself to "anyone with the link can view". Nothing in this
 * script can protect you from that.
 */

/* The secret lives in Script Properties, not in this file, so sharing the
   project does not hand it over. Run setSecret() once from the editor. */
function setSecret() {
  PropertiesService.getScriptProperties()
    .setProperty('SECRET', 'change-me-to-something-long');   // edit, run once, then blank it out
}
function getSecret() {
  return PropertiesService.getScriptProperties().getProperty('SECRET');
}

var HEADERS = ["date", "day", "exercise", "muscle", "equipment",
               "weight", "reps", "minutes", "set"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = getSecret();
    if (!secret) return reply({ok: false, error: "server not configured"});
    if (body.token !== secret) return reply({ok: false, error: "bad token"});

    var sheet = getSheet();
    var ops = body.ops || [];
    var applied = 0;
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (!op || !op.date || !/^\d{4}-\d{2}-\d{2}$/.test(op.date)) continue;

      if (op.action === "delete") {
        clearDate(sheet, op.date);
        applied++;
      } else if (op.action === "upsert" && op.rows && op.rows.length) {
        /* clear only once we know there are rows to put back, so a client bug
           that sends an empty upsert can never blank out a day */
        clearDate(sheet, op.date);
        sheet.getRange(sheet.getLastRow() + 1, 1, op.rows.length, HEADERS.length)
             .setValues(op.rows.map(safeRow));
        applied++;
      }
      /* anything else is ignored rather than treated as a delete */
    }
    sortByDate(sheet);
    return reply({ok: true, applied: applied});
  } catch (err) {
    return reply({ok: false, error: String(err)});
  }
}

/** A leading = + - @ makes Sheets treat a cell as a formula, and exercise names
 *  are user-typed. Prefix those with an apostrophe so they stay plain text. */
function safeRow(row) {
  return row.map(function (v) {
    if (typeof v !== "string") return v;
    return /^[=+\-@\t\r\n]/.test(v) ? "'" + v : v;
  });
}

/** Remove every row for one date. Both upsert and delete start here, which is
 *  what makes a retry harmless — the end state is the same either way. */
function clearDate(sheet, date) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var dates = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var r = dates.length - 1; r >= 0; r--) {
    if (String(dates[r][0]).trim() === date) sheet.deleteRow(r + 2);
  }
}

function sortByDate(sheet) {
  var last = sheet.getLastRow();
  if (last > 2) {
    sheet.getRange(2, 1, last - 1, HEADERS.length)
         .sort([{column: 1, ascending: false}, {column: 3, ascending: true}]);
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Log") || ss.insertSheet("Log");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
