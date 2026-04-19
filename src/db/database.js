const Database = require("better-sqlite3");
const path = require("path");

// Ruta del archivo DB
const dbPath = path.join(__dirname, "../../data/zagrada.db");

// Crear DB
const db = new Database(dbPath);

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    telefono TEXT,
    zona TEXT,
    fecha TEXT,
    fecha_texto TEXT,
    jid_cliente TEXT,
    hora TEXT,
    personas INTEGER,
    decoracion TEXT,
    mesa TEXT,
    observaciones_admin TEXT,
    estado TEXT DEFAULT 'pendiente',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT
  );

  CREATE TABLE IF NOT EXISTS domicilios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    telefono TEXT,
    direccion TEXT,
    jid_cliente TEXT,
    pedido TEXT,
    fecha_servicio TEXT,
    estado TEXT DEFAULT 'pendiente',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migraciones simples para DB ya existentes
try {
  db.prepare(`ALTER TABLE reservas ADD COLUMN mesa TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE reservas ADD COLUMN observaciones_admin TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE reservas ADD COLUMN jid_cliente TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE reservas ADD COLUMN fecha_texto TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE domicilios ADD COLUMN jid_cliente TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE domicilios ADD COLUMN fecha_servicio TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE domicilios ADD COLUMN contacto TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE domicilios ADD COLUMN forma_pago TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE domicilios ADD COLUMN observaciones TEXT`).run();
} catch (error) {}

try {
  db.prepare(`ALTER TABLE reservas ADD COLUMN observaciones TEXT`).run();
} catch (error) {}

// Configuración inicial
db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("domicilios_activos", "on");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("hora_inicio_domicilios", "11:30");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("hora_fin_domicilios", "21:00");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("lunes_laborable", "off");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("restaurante_cerrado", "off");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("apertura_excepcional_fecha", "");

db.prepare(`
  INSERT OR IGNORE INTO configuracion (clave, valor)
  VALUES (?, ?)
`).run("domicilios_reapertura", "");

// ─── IDs ciclicos 1-999 (reservas) ───────────────────────────────────────────
function siguienteId(tabla) {
  const row = db.prepare(`SELECT MAX(id) as maxId FROM ${tabla}`).get();
  const maxId = row?.maxId || 0;
  if (maxId < 999) return maxId + 1;
  for (let i = 1; i <= 999; i++) {
    const existe = db.prepare(`SELECT 1 FROM ${tabla} WHERE id = ?`).get(i);
    if (!existe) return i;
  }
  return maxId + 1;
}

// ─── IDs diarios 1-999 (domicilios: reinicia cada día) ───────────────────────
function siguienteIdDiario(tabla) {
  const hoy = new Date().toISOString().slice(0, 10);
  const row = db.prepare(
    `SELECT MAX(id) as maxId FROM ${tabla} WHERE fecha_servicio = ?`
  ).get(hoy);
  const maxId = row?.maxId || 0;
  return maxId < 999 ? maxId + 1 : 1;
}

module.exports = { db, siguienteId, siguienteIdDiario };