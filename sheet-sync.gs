/**
 * PR Max — Google Sheet mirror
 *
 * HOW TO USE
 *   1. Open your Google Sheet, then Extensions -> Apps Script.
 *      (It must be opened from the Sheet, not from script.google.com.)
 *   2. Select everything in the editor, delete it, paste this whole file.
 *   3. Change SECRET on the line below to your own random string.
 *   4. Save (Ctrl+S).
 *   5. Deploy -> New deployment -> Web app
 *          Execute as:      Me
 *          Who has access:  Anyone
 *      Deploy, approve the permissions, copy the /exec URL.
 *   6. In PR Max: Setup -> Google Sheet. Paste the URL and the same SECRET.
 *
 * "Anyone" is required because the app sends a plain request with no Google
 * login. What protects your data instead:
 *   - There is no doGet and no function that returns rows, so the URL cannot
 *     be used to read your training log. It can only write.
 *   - Every request must carry SECRET.
 *   - The Sheet stays private to your Google account.
 *
 * NEVER set the Sheet itself to "anyone with the link can view".
 * Nothing in this script can protect you from that.
 */

// ====== CHANGE THIS ONE LINE ======
var SECRET = 'put-your-own-long-random-string-here';
// ==================================

/* Optional, only if you ever share this project with someone: run setSecret()
   once from the editor, then blank out SECRET above. A value stored in Script
   Properties wins over the line above. */
function setSecret() {
  PropertiesService.getScriptProperties().setProperty('SECRET', SECRET);
}
function getSecret() {
  return PropertiesService.getScriptProperties().getProperty('SECRET') || SECRET;
}

var HEADERS = ["date", "day", "exercise", "muscle", "equipment",
               "weight", "reps", "minutes", "set"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = getSecret();
    if (!secret || secret === 'put-your-own-long-random-string-here') {
      return reply({ok: false, error: "set SECRET in the script first"});
    }
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
 *  are typed by hand. Prefix those so they stay plain text. */
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
  if (!ss) {
    throw new Error("This script is not attached to a Sheet. Open your Google " +
                    "Sheet and use Extensions > Apps Script, then paste it there.");
  }
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
