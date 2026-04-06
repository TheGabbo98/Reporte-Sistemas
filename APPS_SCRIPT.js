// ════════════════════════════════════════════════════════
//  REPORTE DE SISTEMAS — Google Apps Script v3.1
//  GET  → login, getUsers, addUser, deleteUser, changePass, test
//  POST → guardar reportes (no-cors, no necesita respuesta legible)
// ════════════════════════════════════════════════════════

function doGet(e) {
  var p = e.parameter || {};
  switch (p.action) {
    case 'login':      return handleLogin(p);
    case 'getUsers':   return handleGetUsers();
    case 'addUser':    return handleAddUser(p);
    case 'deleteUser': return handleDeleteUser(p);
    case 'changePass': return handleChangePass(p);
    case 'test':       return res({ ok: true, msg: "Reporte de Sistemas v3.1 activo" });
    default:           return res({ ok: true, msg: "Reporte de Sistemas v3.1 activo" });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'report') return handleReport(data);
    // Fallback: también aceptar acciones via POST
    switch (data.action) {
      case 'login':      return handleLogin(data);
      case 'getUsers':   return handleGetUsers();
      case 'addUser':    return handleAddUser(data);
      case 'deleteUser': return handleDeleteUser(data);
      case 'changePass': return handleChangePass(data);
      default:           return res({ ok: true, msg: "ok" });
    }
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
    if (u === String(p.user || '').trim().toLowerCase() && h === String(p.hash || '').trim()) {
      return res({ ok: true, user: String(rows[i][0]).trim(), role: r });
    }
  }
  return res({ ok: false });
}

// ── GET USERS ─────────────────────────────────────────
function handleGetUsers() {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim()) {
      users.push({ user: String(rows[i][0]).trim(), role: String(rows[i][2]).trim() });
    }
  }
  return res({ ok: true, users: users });
}

// ── ADD USER ──────────────────────────────────────────
function handleAddUser(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(p.user || '').trim().toLowerCase()) {
      return res({ ok: false, msg: "Ya existe un usuario con ese nombre" });
    }
  }
  sh.appendRow([String(p.user).trim(), String(p.hash).trim(), String(p.role || 'operator').trim()]);
  return res({ ok: true });
}

// ── DELETE USER ───────────────────────────────────────
function handleDeleteUser(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(p.user || '').trim().toLowerCase()) {
      sh.deleteRow(i + 1);
      return res({ ok: true });
    }
  }
  return res({ ok: false, msg: "Usuario no encontrado" });
}

// ── CHANGE PASSWORD ───────────────────────────────────
function handleChangePass(p) {
  var sh = getOrCreateUsuarios();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(p.user || '').trim().toLowerCase()) {
      sh.getRange(i + 1, 2).setValue(String(p.hash).trim());
      return res({ ok: true });
    }
  }
  return res({ ok: false, msg: "Usuario no encontrado" });
}

// ── SAVE REPORT ───────────────────────────────────────
function handleReport(data) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reportes')
         || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Reportes');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Tipo','Local','Motivo','Solución','Atendido','Fecha','Hora']);
    sh.getRange(1,1,1,8).setFontWeight('bold')
      .setBackground('#1b4f8a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  sh.appendRow([data.id||'', data.tipo||'', data.local||'', data.motivo||'',
                data.solucion||'', data.atendido||'', data.fecha||'', data.hora||'']);
  return res({ ok: true, msg: 'saved' });
}

// ── HELPERS ───────────────────────────────────────────
function getOrCreateUsuarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Usuarios');
  if (!sh) {
    sh = ss.insertSheet('Usuarios');
    sh.appendRow(['Usuario', 'PassHash', 'Rol']);
    sh.getRange(1,1,1,3).setFontWeight('bold')
      .setBackground('#1b4f8a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // Admin por defecto — SHA-256 de '3309_RES'
    // Cambialo desde Configuración → Usuarios una vez que entrés
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
