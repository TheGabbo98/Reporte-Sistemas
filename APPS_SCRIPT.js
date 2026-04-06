// ════════════════════════════════════════════════════════
//  REPORTE DE SISTEMAS — Google Apps Script v3.2
//  Usa JSONP para evitar CORS completamente
//  GET  → login, getUsers, addUser, deleteUser, changePass
//  POST → guardar reportes
// ════════════════════════════════════════════════════════

function doGet(e) {
  var p = e.parameter || {};
  var cb = p.callback || ''; // JSONP callback name

  var result;
  switch (p.action) {
    case 'login':      result = handleLogin(p); break;
    case 'getUsers':   result = handleGetUsers(); break;
    case 'addUser':    result = handleAddUser(p); break;
    case 'deleteUser': result = handleDeleteUser(p); break;
    case 'changePass': result = handleChangePass(p); break;
    default:           result = { ok: true, msg: "Reporte de Sistemas v3.2 activo" };
  }

  var json = JSON.stringify(result);

  // Si hay callback → respuesta JSONP (evita CORS completamente)
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  // Sin callback → JSON normal
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'report') return res(handleReport(data));
    return res({ ok: true });
  } catch (err) {
    return res({ ok: false, error: err.toString() });
  }
}

// ── LOGIN ─────────────────────────────────────────────
function handleLogin(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var u = String(rows[i][0]).trim().toLowerCase();
    var h = String(rows[i][1]).trim();
    var r = String(rows[i][2]).trim().toLowerCase();
    if (u === String(p.user || '').trim().toLowerCase()
     && h === String(p.hash || '').trim()) {
      return { ok: true, user: String(rows[i][0]).trim(), role: r };
    }
  }
  return { ok: false };
}

// ── GET USERS ─────────────────────────────────────────
function handleGetUsers() {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim()) {
      users.push({
        user: String(rows[i][0]).trim(),
        role: String(rows[i][2]).trim()
      });
    }
  }
  return { ok: true, users: users };
}

// ── ADD USER ──────────────────────────────────────────
function handleAddUser(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase()
     === String(p.user || '').trim().toLowerCase()) {
      return { ok: false, msg: "Ya existe un usuario con ese nombre" };
    }
  }
  sh.appendRow([
    String(p.user).trim(),
    String(p.hash).trim(),
    String(p.role || 'operator').trim()
  ]);
  return { ok: true };
}

// ── DELETE USER ───────────────────────────────────────
function handleDeleteUser(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase()
     === String(p.user || '').trim().toLowerCase()) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, msg: "Usuario no encontrado" };
}

// ── CHANGE PASSWORD ───────────────────────────────────
function handleChangePass(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase()
     === String(p.user || '').trim().toLowerCase()) {
      sh.getRange(i + 1, 2).setValue(String(p.hash).trim());
      return { ok: true };
    }
  }
  return { ok: false, msg: "Usuario no encontrado" };
}

// ── SAVE REPORT ───────────────────────────────────────
function handleReport(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Reportes') || ss.insertSheet('Reportes');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Tipo','Local','Motivo','Solución','Atendido','Fecha','Hora']);
    sh.getRange(1,1,1,8)
      .setFontWeight('bold')
      .setBackground('#1b4f8a')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  sh.appendRow([
    data.id||'', data.tipo||'', data.local||'', data.motivo||'',
    data.solucion||'', data.atendido||'', data.fecha||'', data.hora||''
  ]);
  return { ok: true, msg: 'saved' };
}

// ── HELPERS ───────────────────────────────────────────
function getOrCreateUsuarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Usuarios');
  if (!sh) {
    sh = ss.insertSheet('Usuarios');
    sh.appendRow(['Usuario', 'PassHash', 'Rol']);
    sh.getRange(1,1,1,3)
      .setFontWeight('bold')
      .setBackground('#1b4f8a')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // Hash SHA-256 real de '3309_RES'
    sh.appendRow(['Juan',
      'b93eed4a03beb523d19a1926e0c951bcff333f577a8cd8d66e9e82eaad45bf2b',
      'admin']);
  }
  return sh;
}

function res(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
