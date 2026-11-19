const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizarFechaNatural } = require("../../src/services/normalizadorFecha");

// Fecha base fija para que las pruebas no dependan del día en que corren:
// miércoles 18 de noviembre de 2026
const BASE = new Date(2026, 10, 18);

test("hoy, mañana y pasado mañana", () => {
  assert.equal(normalizarFechaNatural("hoy", BASE).fechaISO, "2026-11-18");
  assert.equal(normalizarFechaNatural("mañana", BASE).fechaISO, "2026-11-19");
  assert.equal(normalizarFechaNatural("pasado mañana", BASE).fechaISO, "2026-11-20");
});

test("un día de la semana apunta al próximo", () => {
  assert.equal(normalizarFechaNatural("sábado", BASE).fechaISO, "2026-11-21");
  assert.equal(normalizarFechaNatural("el próximo viernes", BASE).fechaISO, "2026-11-20");
  // Si piden el mismo día de la semana, se asume la semana siguiente
  assert.equal(normalizarFechaNatural("miércoles", BASE).fechaISO, "2026-11-25");
});

test("fechas numéricas y en texto", () => {
  assert.equal(normalizarFechaNatural("25/12", BASE).fechaISO, "2026-12-25");
  assert.equal(normalizarFechaNatural("24 de diciembre", BASE).fechaISO, "2026-12-24");
  // Una fecha que ya pasó en el año se pasa al año siguiente
  assert.equal(normalizarFechaNatural("5 de enero", BASE).fechaISO, "2027-01-05");
});

test("entradas inválidas", () => {
  assert.equal(normalizarFechaNatural("", BASE).valido, false);
  assert.equal(normalizarFechaNatural("15 de juniembre", BASE).valido, false);
  assert.equal(normalizarFechaNatural("algún día", BASE).valido, false);
});
