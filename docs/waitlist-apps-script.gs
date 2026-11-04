/**
 * SanLaro waitlist – Google Apps Script web app (bound to a Google Sheet).
 * Appends one row per signup and emails hello@sanlaro.com. No user agent / IP stored.
 * Setup: see docs/WAITLIST.md
 */
var NOTIFY_TO = 'hello@sanlaro.com';
var SHEET_NAME = 'Waitlist';
var HEADERS = ['timestamp','name','city','sports','role','contact','heard_from','src'];
var LIMITS = {name:80, city:60, sports:120, role:20, contact:160, heard_from:100, src:32};
var ROLES = ['Player','Organizer'];

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return out_({ok:true}); // honeypot: pretend success, store nothing
    var r = {};
    for (var k in LIMITS) {
      var v = String(d[k] == null ? '' : d[k]).replace(/[\r\n\t]+/g,' ').trim();
      if (v.length > LIMITS[k]) return out_({ok:false, error:'too_long:'+k});
      if (/^[=+\-@]/.test(v)) v = "'" + v; // block spreadsheet formula injection
      r[k] = v;
    }
    r.src = r.src.toLowerCase().replace(/[^a-z0-9_\-']/g,'');
    if (!r.name || !r.city || !r.sports || !r.contact || !r.heard_from) return out_({ok:false, error:'missing'});
    if (ROLES.indexOf(r.role) < 0) return out_({ok:false, error:'role'});
    var c = r.contact;
    if (!/@/.test(c) && !/\+639\d{9}/.test(c)) return out_({ok:false, error:'contact'});

    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
      sh.appendRow([new Date(), r.name, r.city, r.sports, r.role, r.contact, r.heard_from, r.src]);
    } finally { lock.releaseLock(); }

    try {
      MailApp.sendEmail(NOTIFY_TO, 'New SanLaro waitlist signup: ' + r.name,
        HEADERS.slice(1).map(function(h){return h + ': ' + r[h];}).join('\n'));
    } catch (mailErr) { /* row is saved even if mail quota is hit */ }
    return out_({ok:true});
  } catch (err) {
    return out_({ok:false, error:'server'});
  }
}

function doGet() { return out_({ok:true, service:'sanlaro-waitlist'}); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
